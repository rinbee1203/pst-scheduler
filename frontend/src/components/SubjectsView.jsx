// src/components/SubjectsView.jsx
export default function SubjectsView({ subjects, onRemove }) {
  return (
    <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
      {subjects.map(s => (
        <div key={s.id} style={{ background: `${s.color}0e`, border: `1px solid ${s.color}30`, borderLeft: `4px solid ${s.color}`, borderRadius: 12, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: s.color }}>{s.code}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.name}</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{s.grade}</div>
          </div>
          <button onClick={() => onRemove(s.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, padding: 4 }}>×</button>
        </div>
      ))}
    </div>
  );
}
