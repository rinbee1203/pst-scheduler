// src/pages/AuthScreen.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { login as apiLogin, register as apiRegister } from '../api.js';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', sans-serif;
  background: #f5f3ef;
  min-height: 100vh;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.fade-up  { animation: fadeUp  0.5s cubic-bezier(.22,1,.36,1) both; }
.fade-in  { animation: fadeIn  0.4s ease both; }

.auth-input {
  width: 100%;
  background: #fff;
  border: 1.5px solid #e5e0d8;
  border-radius: 10px;
  color: #1a1612;
  padding: 12px 16px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.auth-input:focus {
  border-color: #b8860b;
  box-shadow: 0 0 0 3px rgba(184,134,11,0.12);
}
.auth-input::placeholder { color: #b8b0a4; }

.btn-primary {
  background: #1a1612;
  border: none;
  border-radius: 10px;
  color: #f5f3ef;
  padding: 13px 24px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.01em;
  position: relative;
  overflow: hidden;
}
.btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0);
  transition: background 0.2s;
}
.btn-primary:hover::after { background: rgba(255,255,255,0.07); }
.btn-primary:active { transform: scale(0.99); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.tab-btn {
  flex: 1;
  padding: 9px 0;
  border: none;
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #9d9590;
  border-bottom: 2px solid transparent;
}
.tab-btn.active {
  color: #1a1612;
  border-bottom-color: #b8860b;
  font-weight: 600;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #c5bfb8;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e0d8;
}

.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(245,243,239,0.3);
  border-top-color: #f5f3ef;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

.feature-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(184,134,11,0.2);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: #5a4f3f;
  backdrop-filter: blur(4px);
}

.left-panel-bg {
  background:
    radial-gradient(ellipse 80% 60% at 20% 0%, rgba(184,134,11,0.15) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 90% 100%, rgba(101,67,33,0.12) 0%, transparent 55%),
    linear-gradient(160deg, #faf8f4 0%, #ede8df 50%, #e0d8cc 100%);
}

.seal {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b8860b, #8b6914);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
  box-shadow: 0 4px 20px rgba(184,134,11,0.35), 0 1px 0 rgba(255,255,255,0.3) inset;
}
`;

function Field({ label, value, onChange, placeholder, type = 'text', onEnter, suffix, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, color: '#6b6057', fontWeight: 600, letterSpacing: '0.02em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          className="auth-input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          style={suffix ? { paddingRight: 44 } : {}}
        />
        {suffix}
      </div>
      {hint && <div style={{ fontSize: 11, color: '#a09890' }}>{hint}</div>}
    </div>
  );
}

export default function AuthScreen() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);

  const s = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShowPw(p => !p)}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9d9590', fontSize: 15, display: 'flex', alignItems: 'center' }}
    >
      {showPw
        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );

  const handleLogin = async () => {
    setError(''); setSuccess('');
    if (!form.email || !form.password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const { token, user } = await apiLogin(form.email, form.password);
      signIn(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError(''); setSuccess('');
    if (!form.name || !form.email || !form.password || !form.employeeId) {
      setError('Please fill in all required fields.'); return;
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await apiRegister({
        full_name: form.name,
        email: form.email,
        password: form.password,
        employee_id: form.employeeId,
        department: form.dept,
      });
      setSuccess('Registration submitted! An administrator will review and approve your account.');
      setMode('login');
      setForm({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setForm({}); setError(''); setSuccess(''); };

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f3ef',
        padding: '24px 16px',
      }}>
        <div className="fade-in" style={{
          display: 'flex',
          width: '100%',
          maxWidth: 860,
          minHeight: 560,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.8) inset',
        }}>

          {/* ── LEFT PANEL ── */}
          <div className="left-panel-bg" style={{
            width: 360,
            flexShrink: 0,
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            borderRight: '1px solid rgba(184,134,11,0.15)',
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(184,134,11,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(101,67,33,0.07)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
                <div className="seal">🏫</div>
                <div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#1a1612', lineHeight: 1.2 }}>PST Scheduler</div>
                  <div style={{ fontSize: 10, color: '#b8860b', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>DepEd · PH Standard Time</div>
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#1a1612', lineHeight: 1.25, marginBottom: 10 }}>
                  Teacher Schedule<br />
                  <span style={{ fontStyle: 'italic', color: '#b8860b' }}>Management System</span>
                </div>
                <div style={{ fontSize: 13, color: '#7a6f63', lineHeight: 1.65 }}>
                  Streamline your school's scheduling workflow with conflict detection, holiday management, and role-based access.
                </div>
              </div>

              {/* Feature pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {[
                  { icon: '🗓', label: 'Schedule Grid' },
                  { icon: '⚡', label: 'Conflict Detection' },
                  { icon: '🇵🇭', label: 'PH Holidays' },
                  { icon: '👥', label: 'Role Management' },
                  { icon: '📋', label: 'Form 7 Ready' },
                ].map(f => (
                  <span key={f.label} className="feature-pill">
                    <span>{f.icon}</span>{f.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'relative' }}>
              <div style={{ height: 1, background: 'rgba(184,134,11,0.2)', marginBottom: 16 }} />
              <div style={{ fontSize: 11, color: '#9d9590', lineHeight: 1.6 }}>
                For technical support, contact your school's<br />
                system administrator.
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{
            flex: 1,
            background: '#ffffff',
            padding: '48px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e0d8', marginBottom: 32, gap: 4 }}>
              <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>
                Sign In
              </button>
              <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>
                Create Account
              </button>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#1a1612', marginBottom: 6 }}>
                {mode === 'login' ? 'Welcome back' : 'Request Access'}
              </div>
              <div style={{ fontSize: 13, color: '#9d9590' }}>
                {mode === 'login'
                  ? 'Sign in to access your scheduling dashboard.'
                  : 'Submit your details and wait for administrator approval.'}
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div style={{ marginBottom: 18, padding: '10px 14px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 9, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div style={{ marginBottom: 18, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>✅</span>
                <span>{success}</span>
              </div>
            )}

            {/* Forms */}
            {mode === 'login' ? (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field
                  label="Email Address"
                  value={form.email || ''}
                  onChange={s('email')}
                  placeholder="yourname@school.edu.ph"
                  type="email"
                  onEnter={handleLogin}
                />
                <Field
                  label="Password"
                  value={form.password || ''}
                  onChange={s('password')}
                  placeholder="Enter your password"
                  type={showPw ? 'text' : 'password'}
                  onEnter={handleLogin}
                  suffix={eyeBtn}
                />
                <button
                  className="btn-primary"
                  style={{ width: '100%', marginTop: 6 }}
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? <><span className="spinner" />Signing in…</> : 'Sign In'}
                </button>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#9d9590' }}>
                  Don't have an account?{' '}
                  <span
                    style={{ color: '#b8860b', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => switchMode('register')}
                  >
                    Register
                  </span>
                </div>
              </div>
            ) : (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Full Name *" value={form.name || ''} onChange={s('name')} placeholder="e.g. Ma. Santos, R." />
                  <Field label="Employee / DepEd ID *" value={form.employeeId || ''} onChange={s('employeeId')} placeholder="e.g. TS-2026-001" />
                </div>
                <Field label="Email Address *" value={form.email || ''} onChange={s('email')} placeholder="yourname@school.edu.ph" type="email" />
                <Field label="Department" value={form.dept || ''} onChange={s('dept')} placeholder="e.g. STEM, ABM, HUMSS" />
                <Field
                  label="Password * (min. 6 characters)"
                  value={form.password || ''}
                  onChange={s('password')}
                  placeholder="Create a password"
                  type={showPw ? 'text' : 'password'}
                  suffix={eyeBtn}
                />
                <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, fontSize: 12, color: '#92400e', display: 'flex', gap: 8 }}>
                  <span style={{ flexShrink: 0 }}>ℹ️</span>
                  <span>Your account will require administrator approval before you can sign in for the first time.</span>
                </div>
                <button
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? <><span className="spinner" />Submitting…</> : 'Submit Registration'}
                </button>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#9d9590' }}>
                  Already have an account?{' '}
                  <span
                    style={{ color: '#b8860b', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => switchMode('login')}
                  >
                    Sign in
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
