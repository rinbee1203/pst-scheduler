// src/pages/AuthScreen.jsx
// Login and self-registration page.
// On successful login, calls signIn() from AuthContext which updates global state.

import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { login as apiLogin, register as apiRegister } from '../api.js';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#060910;}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
.fade-up{animation:fadeUp 0.45s cubic-bezier(.22,1,.36,1) both;}
.fade-in{animation:fadeIn 0.3s ease both;}
.auth-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#e2e8f0;padding:11px 14px;font-size:14px;outline:none;transition:all 0.2s;}
.auth-input:focus{border-color:#6366f1;background:rgba(99,102,241,0.08);box-shadow:0 0 0 3px rgba(99,102,241,0.15);}
.auth-input::placeholder{color:#334155;}
.btn-primary{background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border:none;border-radius:10px;color:#fff;padding:11px 22px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 16px rgba(99,102,241,0.35);}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,0.5);}
.btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
`;

function Field({ label, value, onChange, placeholder, type = 'text', onEnter, eye }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input className="auth-input" type={type} placeholder={placeholder} value={value}
          onChange={onChange} onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          style={eye ? { paddingRight: 40 } : {}} />
        {eye}
      </div>
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
  const pwEye = (
    <button type="button" onClick={() => setShowPw(p => !p)}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#475569' }}>
      {showPw ? '🙈' : '👁️'}
    </button>
  );

  const handleLogin = async () => {
    setError(''); setSuccess('');
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }
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
      setSuccess('Registration submitted! Please wait for admin approval before logging in.');
      setMode('login');
      setForm({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 15% -5%,rgba(99,102,241,0.13) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 85% 100%,rgba(139,92,246,0.09) 0%,transparent 60%),#060910', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {/* Left panel */}
        <div className="fade-in" style={{ width: 400, height: 540, marginRight: -1, borderRadius: '24px 0 0 24px', background: 'linear-gradient(145deg,#0d1628,#111827)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.07) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          <div style={{ position: 'absolute', top: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🏫</div>
            <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>PST Scheduler</div>
            <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.18em', fontFamily: "'Fira Code'", marginBottom: 22 }}>PH STANDARD TIME · DepEd</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
              {['Drag-and-drop schedule plotter', 'Real-time conflict detection', 'PH holiday auto-blocking', 'Admin + teacher role system', 'Form 7 export ready'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#64748b', textAlign: 'left' }}>
                  <span style={{ color: '#818cf8', fontWeight: 700, fontSize: 14 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div style={{ padding: '9px 14px', background: 'rgba(99,102,241,0.1)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)', fontSize: 10, color: '#818cf8', fontFamily: "'Fira Code'", lineHeight: 1.7 }}>
              Demo admin:<br />admin@school.edu.ph<br />Admin@2026!
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="fade-up" style={{ width: 370, background: '#0a1020', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '0 24px 24px 0', padding: 32, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 24, border: '1px solid rgba(255,255,255,0.07)' }}>
            {[{ id: 'login', label: '🔑 Sign In' }, { id: 'register', label: '✏️ Register' }].map(t => (
              <button key={t.id} onClick={() => { setMode(t.id); setForm({}); setError(''); setSuccess(''); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: 12, transition: 'all 0.2s', background: mode === t.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent', color: mode === t.id ? '#fff' : '#64748b', boxShadow: mode === t.id ? '0 2px 10px rgba(99,102,241,0.4)' : 'none' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && <div style={{ marginBottom: 14, padding: '9px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, fontSize: 12, color: '#f87171' }}>{error}</div>}
          {success && <div style={{ marginBottom: 14, padding: '9px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 9, fontSize: 12, color: '#34d399' }}>{success}</div>}

          {mode === 'login' ? (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Email Address" value={form.email || ''} onChange={s('email')} placeholder="you@school.edu.ph" type="email" onEnter={handleLogin} />
              <Field label="Password" value={form.password || ''} onChange={s('password')} placeholder="••••••••" type={showPw ? 'text' : 'password'} onEnter={handleLogin} eye={pwEye} />
              <button className="btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={handleLogin} disabled={loading}>
                {loading ? <span style={{ animation: 'pulse 1s infinite' }}>Signing in…</span> : 'Sign In →'}
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#475569' }}>
                No account? <span style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setMode('register'); setForm({}); setError(''); }}>Register here</span>
              </div>
            </div>
          ) : (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Full Name *" value={form.name || ''} onChange={s('name')} placeholder="e.g. Ma. Santos, R." />
              <Field label="Email Address *" value={form.email || ''} onChange={s('email')} placeholder="yourname@school.edu.ph" type="email" />
              <Field label="Employee / DepEd ID *" value={form.employeeId || ''} onChange={s('employeeId')} placeholder="e.g. TS-2026-001" />
              <Field label="Department" value={form.dept || ''} onChange={s('dept')} placeholder="e.g. STEM, ABM, HUMSS" />
              <Field label="Password * (min 6 chars)" value={form.password || ''} onChange={s('password')} placeholder="Create a password" type={showPw ? 'text' : 'password'} eye={pwEye} />
              <div style={{ padding: '9px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', fontSize: 11, color: '#d97706' }}>
                ⚠️ Your account requires admin approval before first login.
              </div>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleRegister} disabled={loading}>
                {loading ? <span style={{ animation: 'pulse 1s infinite' }}>Submitting…</span> : 'Submit Registration →'}
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#475569' }}>
                Already registered? <span style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setMode('login'); setForm({}); setError(''); }}>Sign in</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
