// src/components/TeachersView.jsx
export default function TeachersView({ teachers, pendingTeachers, schedules, onApprove, onReject, onRemove }) {
  return (
    <div className="fade-up">
      {pendingTeachers.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#f87171', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⏳ Pending Approvals
            <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>{pendingTeachers.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingTeachers.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,0.2)', border: '1.5px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#818cf8' }}>{u.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{u.email} · {u.employeeId} · {u.dept}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 1, fontFamily: "'Fira Code'" }}>Registered: {u.createdAt?.split('T')[0]}</div>
                </div>
                <button onClick={() => onApprove(u.id)} style={{ padding: '5px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#34d399', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'" }}>✓ Approve</button>
                <button onClick={() => onReject(u.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'" }}>✗ Reject</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ fontWeight: 800, fontSize: 12, color: '#64748b', marginBottom: 10, letterSpacing: '0.06em' }}>ACTIVE TEACHERS ({teachers.length})</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
        {teachers.map(u => {
          const load = schedules.filter(s => s.teacherId === u.id).length;
          const pct = Math.min((load / u.maxLoad) * 100, 100);
          const lc = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';
          return (
            <div key={u.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${u.color}20`, border: `2px solid ${u.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: u.color }}>{u.name[0]}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{u.employeeId} · {u.dept}</div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: '#64748b' }}>Load</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: lc, fontFamily: "'Fira Code'" }}>{load}/{u.maxLoad}h</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 4 }}>
                  <div style={{ width: `${pct}%`, background: `linear-gradient(90deg,${lc},${lc}88)`, borderRadius: 999, height: '100%', transition: 'width 0.5s' }} />
                </div>
              </div>
              <button onClick={() => onRemove(u.id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'" }}>Remove</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
