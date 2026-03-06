// routes/holidays.js — PH Holidays
// GET  /api/holidays        — list all holidays
// POST /api/holidays        — add a holiday (admin only)
// DELETE /api/holidays/:id  — remove a holiday (admin only)

const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT id, holiday_date, holiday_name, is_regular FROM ph_holidays ORDER BY holiday_date'
    );
    res.json(result.rows.map(h => ({
      id: h.id,
      date: h.holiday_date,
      name: h.holiday_name,
      isRegular: h.is_regular,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch holidays.' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { date, name, isRegular } = req.body;
  if (!date || !name) return res.status(400).json({ error: 'date and name are required.' });
  try {
    const result = await db.query(
      `INSERT INTO ph_holidays (holiday_date, holiday_name, is_regular)
       VALUES ($1, $2, $3) RETURNING *`,
      [date, name, isRegular !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Holiday already exists for that date.' });
    res.status(500).json({ error: 'Could not add holiday.' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM ph_holidays WHERE id = $1 RETURNING holiday_name',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Holiday not found.' });
    res.json({ message: `${result.rows[0].holiday_name} removed.` });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove holiday.' });
  }
});

module.exports = router;
