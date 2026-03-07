// src/components/HolidaysView.jsx
export default function HolidaysView({ holidays }) {
  return (
    <div className="fade-up" style={{ maxWidth: 600 }}>
      <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 4 }}>🇵🇭 PH Holidays 2026</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Schedule slots on these dates are automatically blocked.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {holidays.map(h => {
          // Extract just the date part (first 10 chars) — handles both
          // "2026-01-01" and "2026-01-01T00:00:00.000Z" formats
          const dateStr = (h.date || '').toString().slice(0, 10);
          const [year, month, day] = dateStr.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          const dow = d.toLocaleDateString('en-PH', { weekday: 'long' });
          const fmt = d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
          return (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 10 }}>
              <div style={{ fontFamily: "'Fira Code'", fontSize: 10, color: '#92400e', width: 86, flexShrink: 0 }}>{dateStr}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{h.name}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{dow} · {fmt}</div>
              </div>
              <span style={{ fontSize: 16 }}>🎉</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}