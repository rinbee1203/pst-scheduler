// routes/auth.js — Registration and Login
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me  (get current user info from token)

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// ── Register (self-registration by teacher) ───────────────────
// New accounts are approved: false by default.
// Admin must approve from the Teachers page.
router.post('/register', async (req, res) => {
  const { full_name, email, password, employee_id, department } = req.body;

  // Basic validation
  if (!full_name || !email || !password || !employee_id) {
    return res.status(400).json({ error: 'full_name, email, password, and employee_id are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if email already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (full_name, email, password_hash, employee_id, department, role, approved)
       VALUES ($1, $2, $3, $4, $5, 'teacher', FALSE)
       RETURNING id, full_name, email, employee_id, department, role, approved, created_at`,
      [full_name, email, password_hash, employee_id, department || 'General']
    );

    res.status(201).json({
      message: 'Registration submitted. Please wait for admin approval before logging in.',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── Login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.approved) {
      return res.status(403).json({ error: 'Your account is pending admin approval.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Create a JWT token valid for 7 days
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        employeeId: user.employee_id,
        dept: user.department,
        maxLoad: user.max_load,
        color: user.color,
        approved: user.approved,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── Get current user (validate token + refresh user data) ─────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, email, employee_id, department, role,
              max_load, color, approved, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const u = result.rows[0];
    res.json({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role,
      employeeId: u.employee_id,
      dept: u.department,
      maxLoad: u.max_load,
      color: u.color,
      approved: u.approved,
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user.' });
  }
});

module.exports = router;
