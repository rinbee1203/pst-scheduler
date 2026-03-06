// routes/subjects.js — Subject catalog
// GET    /api/subjects       — list all subjects (any logged-in user)
// POST   /api/subjects       — add a subject (admin only)
// PATCH  /api/subjects/:id   — update a subject (admin only)
// DELETE /api/subjects/:id   — remove a subject (admin only)

const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET all subjects
router.get('/', requireAuth, async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT id, code, name, grade, color FROM subjects ORDER BY grade, name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch subjects.' });
  }
});

// POST — add subject (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { code, name, grade, color } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'code and name are required.' });
  }
  try {
    const result = await db.query(
      `INSERT INTO subjects (code, name, grade, color)
       VALUES ($1, $2, $3, $4)
       RETURNING id, code, name, grade, color`,
      [code, name, grade || null, color || '#6366f1']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Subject code already exists.' });
    res.status(500).json({ error: 'Could not add subject.' });
  }
});

// PATCH — update subject (admin only)
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { code, name, grade, color } = req.body;
  try {
    const result = await db.query(
      `UPDATE subjects
       SET code  = COALESCE($1, code),
           name  = COALESCE($2, name),
           grade = COALESCE($3, grade),
           color = COALESCE($4, color)
       WHERE id = $5
       RETURNING id, code, name, grade, color`,
      [code, name, grade, color, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Subject not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update subject.' });
  }
});

// DELETE — remove subject (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM subjects WHERE id = $1 RETURNING id, name',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Subject not found.' });
    res.json({ message: `${result.rows[0].name} removed.` });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove subject.' });
  }
});

module.exports = router;
