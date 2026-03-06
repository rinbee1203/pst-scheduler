// src/components/DashboardView.jsx
export default function DashboardView({ teachers, subjects, schedules, pendingTeachers, setView }) {
  return (
    <div className="fade-up">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Active Teachers', value: teachers.length, color: '#818cf8', icon: '👥' },
          { label: 'Subjects', value: subjects.length, color: '#34d399', icon: '📚' },
          { label: 'Schedules Plotted', value: schedules.length, color: '#f59e0b', icon: '📋' },
          { label: 'Pending Approvals', value: pendingTeachers.length, color: '#f87171', icon: '⏳' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px', cursor: s.label === 'Pending Approvals' && pendingTeachers.length ? 'pointer' : 'default' }}
            onClick={() => s.label === 'Pending Approvals' && pendingTeachers.length && setView('teachers')}>
            <div style={{ fontSize: 26 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 4, fontFamily: "'Fira Code'" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {pendingTeachers.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#f87171', marginBottom: 10 }}>⏳ Pending Approvals ({pendingTeachers.length})</div>
          {pendingTeachers.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.2)', border: '1.5px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#818cf8' }}>{u.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{u.email} · {u.employeeId} · {u.dept}</div>
              </div>
            </div>
          ))}
          <button className="btn-primary" style={{ marginTop: 10, fontSize: 12, padding: '7px 16px' }} onClick={() => setView('teachers')}>Manage Teachers →</button>
        </div>
      )}
    </div>
  );
}
