// scripts/setup-db.js
// Run with: npm run db:setup
// Creates all tables and seeds the admin account + default subjects.

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'crossover.proxy.rlwy.net',
  port: 28569,
  user: 'postgres',
  password: 'DNahkkYnaMcFrByDrocsgZARqfERYkoq',
  database: 'railway',
  ssl: { rejectUnauthorized: false },
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setup() {
  const client = await pool.connect();
  console.log('✅ Connected to PostgreSQL\n');

  try {
    await client.query('BEGIN');

    // ── 1. Create users table ────────────────────────────────
    console.log('📋 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        full_name     VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        employee_id   VARCHAR(30) UNIQUE,
        department    VARCHAR(50) DEFAULT 'General',
        role          VARCHAR(10) DEFAULT 'teacher' CHECK (role IN ('admin','teacher')),
        max_load      INT DEFAULT 6,
        color         VARCHAR(10) DEFAULT '#6366f1',
        approved      BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── 2. Create subjects table ─────────────────────────────
    console.log('📋 Creating subjects table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id    SERIAL PRIMARY KEY,
        code  VARCHAR(20) UNIQUE NOT NULL,
        name  VARCHAR(100) NOT NULL,
        grade VARCHAR(20),
        color VARCHAR(10) DEFAULT '#6366f1'
      );
    `);

    // ── 3. Create schedules table ────────────────────────────
    console.log('📋 Creating schedules table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id          SERIAL PRIMARY KEY,
        teacher_id  INT REFERENCES users(id) ON DELETE CASCADE,
        subject_id  INT REFERENCES subjects(id) ON DELETE CASCADE,
        day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
        start_time  TIME NOT NULL,
        end_time    TIME NOT NULL,
        room        VARCHAR(30),
        week_date   DATE,
        created_at  TIMESTAMP DEFAULT NOW(),
        CONSTRAINT valid_time CHECK (end_time > start_time)
      );
    `);

    // ── 4. Create PH holidays table ──────────────────────────
    console.log('📋 Creating ph_holidays table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ph_holidays (
        id            SERIAL PRIMARY KEY,
        holiday_date  DATE UNIQUE NOT NULL,
        holiday_name  VARCHAR(100) NOT NULL,
        is_regular    BOOLEAN DEFAULT TRUE
      );
    `);

    // ── 5. Seed admin account ────────────────────────────────
    console.log('\n👤 Seeding admin account...');
    const adminPassword = 'Admin@2026!';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    await client.query(`
      INSERT INTO users (full_name, email, password_hash, employee_id, department, role, approved, color)
      VALUES ($1, $2, $3, $4, $5, 'admin', TRUE, '#ef4444')
      ON CONFLICT (email) DO NOTHING
    `, ['Administrator', 'admin@school.edu.ph', adminHash, 'ADMIN-001', 'Administration']);

    console.log('   Email:    admin@school.edu.ph');
    console.log('   Password: Admin@2026!');
    console.log('   ⚠️  Change this password after first login!\n');

    // ── 6. Seed default subjects ─────────────────────────────
    console.log('📚 Seeding default subjects...');
    const subjects = [
      ['EmpTech',  'Empowerment Technology',   'Gr.11', '#6366f1'],
      ['SciTech',  'Science & Technology',      'Gr.12', '#0ea5e9'],
      ['Eng10',    'English 10',                'Gr.10', '#ec4899'],
      ['Math11',   'General Mathematics',       'Gr.11', '#f59e0b'],
      ['Fil10',    'Filipino 10',               'Gr.10', '#10b981'],
      ['EarthSci', 'Earth Science',             'Gr.11', '#8b5cf6'],
      ['PE12',     'Physical Education',        'Gr.12', '#ef4444'],
      ['AP10',     'Araling Panlipunan',        'Gr.10', '#14b8a6'],
      ['Oral',     'Oral Communication',        'Gr.11', '#f97316'],
      ['Reading',  'Reading & Writing',         'Gr.11', '#06b6d4'],
    ];

    for (const [code, name, grade, color] of subjects) {
      await client.query(
        `INSERT INTO subjects (code, name, grade, color)
         VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING`,
        [code, name, grade, color]
      );
    }

    // ── 7. Seed PH holidays 2026 ─────────────────────────────
    console.log('🇵🇭 Seeding PH holidays 2026...');
    const holidays = [
      ['2026-01-01', "New Year's Day",        true],
      ['2026-04-02', 'Maundy Thursday',       true],
      ['2026-04-03', 'Good Friday',           true],
      ['2026-04-09', 'Araw ng Kagitingan',    true],
      ['2026-05-01', 'Labor Day',             true],
      ['2026-06-12', 'Independence Day',      true],
      ['2026-08-31', 'National Heroes Day',   true],
      ['2026-11-01', "All Saints' Day",       true],
      ['2026-11-30', 'Bonifacio Day',         true],
      ['2026-12-08', 'Immaculate Conception', false],
      ['2026-12-25', 'Christmas Day',         true],
      ['2026-12-30', 'Rizal Day',             true],
    ];

    for (const [date, name, isRegular] of holidays) {
      await client.query(
        `INSERT INTO ph_holidays (holiday_date, holiday_name, is_regular)
         VALUES ($1, $2, $3) ON CONFLICT (holiday_date) DO NOTHING`,
        [date, name, isRegular]
      );
    }

    await client.query('COMMIT');
    console.log('\n✅ Database setup complete!');
    console.log('   Run "npm run dev" to start the server.\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
