// src/components/Modal.jsx
import { useState } from 'react';
import { formatTime } from '../pages/MainApp.jsx';

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#0ea5e9','#8b5cf6','#ef4444','#14b8a6','#f97316'];

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
      <input className="auth-input" type={type} placeholder={placeholder} value={value} onChange={onChange} style={{ padding: '9px 12px', fontSize: 13 }} />
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Color</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {COLORS.map(c => (
          <div key={c} onClick={() => onChange(c)} style={{ width: 24, height: 24, borderRadius: 7, background: c, cursor: 'pointer', border: value === c ? '2px solid white' : '2px solid transparent', transition: 'all 0.15s' }} />
        ))}
      </div>
    </div>
  );
}

export default function Modal({ modal, setModal, onAddTeacher, onAddSubject, schedules, teachers, subjects, showToast }) {
  const [form, setForm] = useState({});
  const close = () => { setModal(null); setForm({}); };
  const s = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  if (modal.type === 'addTeacher') {
    return (
      <div className="modal-overlay" onClick={close}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 18 }}>👤 Register New Teacher</div>
          <Field label="Full Name *" value={form.name || ''} onChange={s('name')} placeholder="e.g. Ma. Santos, R." />
          <Field label="Email *" value={form.email || ''} onChange={s('email')} placeholder="teacher@school.edu.ph" type="email" />
          <Field label="Employee / DepEd ID *" value={form.employeeId || ''} onChange={s('employeeId')} placeholder="e.g. TS-2026-001" />
          <Field label="Department" value={form.dept || ''} onChange={s('dept')} placeholder="e.g. STEM, ABM" />
          <Field label="Initial Password *" value={form.password || ''} onChange={s('password')} placeholder="Min 6 characters" type="password" />
          <Field label="Max Load Hours" value={form.maxLoad || ''} onChange={s('maxLoad')} placeholder="Default: 6" />
          <ColorPicker value={form.color || ''} onChange={c => setForm(p => ({ ...p, color: c }))} />
          <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
            <button className="btn-primary" style={{ flex: 1, padding: 9 }} onClick={() => {
              if (!form.name || !form.email || !form.password || !form.employeeId) { showToast('Fill in required fields.', 'error'); return; }
              onAddTeacher({ full_name: form.name, email: form.email, password: form.password, employee_id: form.employeeId, department: form.dept || 'General', max_load: parseInt(form.maxLoad) || 6, color: form.color || '#6366f1' });
            }}>Register Teacher</button>
            <button onClick={close} style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (modal.type === 'addSubject') {
    return (
      <div className="modal-overlay" onClick={close}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 18 }}>📚 Add New Subject</div>
          <Field label="Subject Code *" value={form.code || ''} onChange={s('code')} placeholder="e.g. EmpTech" />
          <Field label="Subject Name *" value={form.name || ''} onChange={s('name')} placeholder="e.g. Empowerment Technology" />
          <Field label="Grade Level" value={form.grade || ''} onChange={s('grade')} placeholder="e.g. Gr.11" />
          <ColorPicker value={form.color || ''} onChange={c => setForm(p => ({ ...p, color: c }))} />
          <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
            <button className="btn-primary" style={{ flex: 1, padding: 9 }} onClick={() => {
              if (!form.name || !form.code) { showToast('Fill in required fields.', 'error'); return; }
              onAddSubject({ code: form.code, name: form.name, grade: form.grade || 'Gr.10', color: form.color || '#6366f1' });
            }}>Add Subject</button>
            <button onClick={close} style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (modal.type === 'export') {
    const { schedules: sc, teachers: ts, subjects: subs } = modal.data;
    const header = `FORM 7 – TEACHER SCHEDULE SUMMARY\nSchool Year 2026 | PH Standard Time\n${'='.repeat(76)}\nTEACHER              | DAY        | TIME              | SUBJECT\n${'─'.repeat(76)}`;
    const lines = sc.map(s => {
      const t = ts.find(x => x.id === s.teacherId);
      return `${(t?.name || '?').slice(0, 20).padEnd(20)} | ${s.day.padEnd(10)} | ${(formatTime(s.startTime) + '–' + formatTime(s.endTime)).padEnd(17)} | ${s.subjectName || '?'}`;
    });
    return (
      <div className="modal-overlay" onClick={close}>
        <div className="modal-box" style={{ width: 580 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>📄 Form 7 – Teacher Assignment</div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>DepEd Standard Teacher Load Sheet</div>
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 12, fontFamily: "'Fira Code'", fontSize: 9, color: '#94a3b8', maxHeight: 260, overflow: 'auto', lineHeight: 1.9, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#818cf8', marginBottom: 4, whiteSpace: 'pre' }}>{header}</div>
            {lines.length === 0 ? <div style={{ color: '#334155' }}>No schedules yet.</div> : lines.map((l, i) => <div key={i} style={{ whiteSpace: 'pre' }}>{l}</div>)}
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <button className="btn-primary" style={{ flex: 1, padding: 9 }} onClick={() => {
              const blob = new Blob([[header, '\n', ...lines].join('\n')], { type: 'text/plain' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = 'Form7_TeacherSchedule_2026.txt'; a.click();
              showToast('📄 Form 7 exported!'); close();
            }}>⬇ Download .txt</button>
            <button onClick={close} style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: 14 }}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
