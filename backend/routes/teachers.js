// routes/teachers.js — Teacher management (admin only for most actions)
// GET    /api/teachers          — list all approved teachers
// GET    /api/teachers/pending  — list pending registrations (admin)
// POST   /api/teachers          — admin manually registers a teacher (pre-approved)
// PATCH  /api/teachers/:id/approve  — approve a pending teacher (admin)
// DELETE /api/teachers/:id      — remove a teacher (admin)
// PATCH  /api/teachers/:id      — update teacher info (admin)

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/teachers — all approved teachers (any logged-in user can view)
router.get('/', requireAuth, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, email, employee_id, department,
              max_load, color, created_at
       FROM users
       WHERE role = 'teacher' AND approved = TRUE
       ORDER BY full_name`
    );
    // Map to camelCase for the frontend
    res.json(result.rows.map(u => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      employeeId: u.employee_id,
      dept: u.department,
      maxLoad: u.max_load,
      color: u.color,
      createdAt: u.created_at,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch teachers.' });
  }
});

// GET /api/teachers/pending — pending approvals (admin only)
router.get('/pending', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, email, employee_id, department, created_at
       FROM users
       WHERE role = 'teacher' AND approved = FALSE
       ORDER BY created_at DESC`
    );
    res.json(result.rows.map(u => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      employeeId: u.employee_id,
      dept: u.department,
      createdAt: u.created_at,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch pending teachers.' });
  }
});

// POST /api/teachers — admin registers a teacher (auto-approved)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { full_name, email, password, employee_id, department, max_load, color } = req.body;

  if (!full_name || !email || !password || !employee_id) {
    return res.status(400).json({ error: 'full_name, email, password, and employee_id are required.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (full_name, email, password_hash, employee_id, department, max_load, color, role, approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'teacher', TRUE)
       RETURNING id, full_name, email, employee_id, department, max_load, color`,
      [full_name, email, password_hash, employee_id, department || 'General', max_load || 6, color || '#6366f1']
    );

    const u = result.rows[0];
    res.status(201).json({
      id: u.id, name: u.full_name, email: u.email,
      employeeId: u.employee_id, dept: u.department,
      maxLoad: u.max_load, color: u.color,
    });
  } catch (err) {
    console.error('Add teacher error:', err);
    res.status(500).json({ error: 'Could not add teacher.' });
  }
});

// PATCH /api/teachers/:id/approve — approve a pending teacher (admin)
router.patch('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE users SET approved = TRUE WHERE id = $1 AND role = 'teacher'
       RETURNING id, full_name, email`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Teacher not found.' });
    res.json({ message: 'Teacher approved.', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not approve teacher.' });
  }
});

// PATCH /api/teachers/:id — update teacher details (admin)
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { full_name, department, max_load, color } = req.body;
  try {
    const result = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           department = COALESCE($2, department),
           max_load = COALESCE($3, max_load),
           color = COALESCE($4, color)
       WHERE id = $5 AND role = 'teacher'
       RETURNING id, full_name, email, employee_id, department, max_load, color`,
      [full_name, department, max_load, color, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Teacher not found.' });
    const u = result.rows[0];
    res.json({ id: u.id, name: u.full_name, email: u.email, employeeId: u.employee_id, dept: u.department, maxLoad: u.max_load, color: u.color });
  } catch (err) {
    res.status(500).json({ error: 'Could not update teacher.' });
  }
});

// DELETE /api/teachers/:id — remove teacher and their schedules (admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM users WHERE id = $1 AND role = 'teacher' RETURNING id, full_name`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Teacher not found.' });
    res.json({ message: `${result.rows[0].full_name} removed.` });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove teacher.' });
  }
});

module.exports = router;
