// routes/schedules.js — Schedule plotting with conflict detection
// GET    /api/schedules             — get schedules (filtered by teacher for non-admins)
// POST   /api/schedules             — plot a new schedule entry
// DELETE /api/schedules/:id         — remove a schedule entry
// GET    /api/schedules/teacher/:id — get one teacher's full schedule

const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── Helper: check time overlap ────────────────────────────────
// Returns true if [s1, e1) overlaps [s2, e2)
function overlaps(s1, e1, s2, e2) {
  return s1 < e2 && s2 < e1;
}

// ── GET /api/schedules ────────────────────────────────────────
// Admin → returns all schedules
// Teacher → returns only their own schedules
router.get('/', requireAuth, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'admin') {
      query = `
        SELECT s.id, s.teacher_id, s.subject_id, s.day_of_week,
               s.start_time, s.end_time, s.room, s.week_date,
               u.full_name AS teacher_name, u.color AS teacher_color,
               sub.name AS subject_name, sub.code AS subject_code, sub.color AS subject_color
        FROM schedules s
        JOIN users u ON s.teacher_id = u.id
        JOIN subjects sub ON s.subject_id = sub.id
        ORDER BY s.day_of_week, s.start_time`;
      params = [];
    } else {
      query = `
        SELECT s.id, s.teacher_id, s.subject_id, s.day_of_week,
               s.start_time, s.end_time, s.room, s.week_date,
               u.full_name AS teacher_name, u.color AS teacher_color,
               sub.name AS subject_name, sub.code AS subject_code, sub.color AS subject_color
        FROM schedules s
        JOIN users u ON s.teacher_id = u.id
        JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.teacher_id = $1
        ORDER BY s.day_of_week, s.start_time`;
      params = [req.user.id];
    }

    const result = await db.query(query, params);

    res.json(result.rows.map(s => ({
      id: s.id,
      teacherId: s.teacher_id,
      subjectId: s.subject_id,
      day: s.day_of_week,
      startTime: s.start_time.slice(0, 5),   // "HH:MM"
      endTime: s.end_time.slice(0, 5),
      room: s.room,
      weekDate: s.week_date,
      teacherName: s.teacher_name,
      teacherColor: s.teacher_color,
      subjectName: s.subject_name,
      subjectCode: s.subject_code,
      subjectColor: s.subject_color,
    })));
  } catch (err) {
    console.error('Get schedules error:', err);
    res.status(500).json({ error: 'Could not fetch schedules.' });
  }
});

// ── GET /api/schedules/teacher/:id ───────────────────────────
// Get a specific teacher's schedule (any logged-in user can view)
router.get('/teacher/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.teacher_id, s.subject_id, s.day_of_week,
              s.start_time, s.end_time, s.room, s.week_date,
              sub.name AS subject_name, sub.code AS subject_code, sub.color AS subject_color
       FROM schedules s
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.teacher_id = $1
       ORDER BY s.day_of_week, s.start_time`,
      [req.params.id]
    );

    res.json(result.rows.map(s => ({
      id: s.id,
      teacherId: s.teacher_id,
      subjectId: s.subject_id,
      day: s.day_of_week,
      startTime: s.start_time.slice(0, 5),
      endTime: s.end_time.slice(0, 5),
      room: s.room,
      weekDate: s.week_date,
      subjectName: s.subject_name,
      subjectCode: s.subject_code,
      subjectColor: s.subject_color,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch teacher schedule.' });
  }
});

// ── POST /api/schedules — Plot a new schedule entry ───────────
router.post('/', requireAuth, async (req, res) => {
  const { teacherId, subjectId, day, startTime, endTime, room, weekDate } = req.body;

  // Teachers can only plot for themselves
  if (req.user.role !== 'admin' && req.user.id !== parseInt(teacherId)) {
    return res.status(403).json({ error: 'You can only plot your own schedule.' });
  }

  if (!teacherId || !subjectId || !day || !startTime || !endTime) {
    return res.status(400).json({ error: 'teacherId, subjectId, day, startTime, endTime are required.' });
  }

  try {
    // 1. Check teacher exists and is approved
    const teacherResult = await db.query(
      'SELECT id, full_name, max_load FROM users WHERE id = $1 AND approved = TRUE',
      [teacherId]
    );
    if (!teacherResult.rows[0]) {
      return res.status(404).json({ error: 'Teacher not found or not approved.' });
    }
    const teacher = teacherResult.rows[0];

    // 2. Check max load
    const loadResult = await db.query(
      'SELECT COUNT(*) FROM schedules WHERE teacher_id = $1',
      [teacherId]
    );
    const currentLoad = parseInt(loadResult.rows[0].count);
    if (currentLoad >= teacher.max_load) {
      return res.status(409).json({
        error: `${teacher.full_name} has reached their maximum teaching load of ${teacher.max_load} hours.`,
      });
    }

    // 3. Check teacher time conflict on same day
    const conflictResult = await db.query(
      `SELECT s.id, sub.name AS subject_name
       FROM schedules s
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.teacher_id = $1
         AND s.day_of_week = $2
         AND s.start_time < $4::time
         AND s.end_time   > $3::time`,
      [teacherId, day, startTime, endTime]
    );

    if (conflictResult.rows.length > 0) {
      const conflict = conflictResult.rows[0];
      return res.status(409).json({
        error: `Time conflict! ${teacher.full_name} already has "${conflict.subject_name}" overlapping that time slot.`,
        conflictId: conflict.id,
      });
    }

    // 4. Check room conflict on same day/time (if room provided)
    if (room) {
      const roomConflict = await db.query(
        `SELECT s.id, u.full_name AS teacher_name
         FROM schedules s
         JOIN users u ON s.teacher_id = u.id
         WHERE s.room = $1
           AND s.day_of_week = $2
           AND s.start_time < $4::time
           AND s.end_time   > $3::time`,
        [room, day, startTime, endTime]
      );
      if (roomConflict.rows.length > 0) {
        return res.status(409).json({
          error: `Room conflict! ${room} is already occupied by ${roomConflict.rows[0].teacher_name} at that time.`,
        });
      }
    }

    // 5. Save the schedule
    const result = await db.query(
      `INSERT INTO schedules (teacher_id, subject_id, day_of_week, start_time, end_time, room, week_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, teacher_id, subject_id, day_of_week, start_time, end_time, room, week_date`,
      [teacherId, subjectId, day, startTime, endTime, room || null, weekDate || null]
    );

    const s = result.rows[0];
    res.status(201).json({
      id: s.id,
      teacherId: s.teacher_id,
      subjectId: s.subject_id,
      day: s.day_of_week,
      startTime: s.start_time.slice(0, 5),
      endTime: s.end_time.slice(0, 5),
      room: s.room,
      weekDate: s.week_date,
    });
  } catch (err) {
    console.error('Plot schedule error:', err);
    res.status(500).json({ error: 'Could not save schedule.' });
  }
});

// ── DELETE /api/schedules/:id ────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // First find the schedule to check ownership
    const find = await db.query('SELECT teacher_id FROM schedules WHERE id = $1', [req.params.id]);
    if (!find.rows[0]) return res.status(404).json({ error: 'Schedule entry not found.' });

    // Teachers can only delete their own entries
    if (req.user.role !== 'admin' && find.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only remove your own schedule entries.' });
    }

    await db.query('DELETE FROM schedules WHERE id = $1', [req.params.id]);
    res.json({ message: 'Schedule entry removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove schedule entry.' });
  }
});

module.exports = router;
