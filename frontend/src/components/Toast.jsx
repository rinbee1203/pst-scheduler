// src/components/Toast.jsx
export default function Toast({ toast }) {
  const C = {
    success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', color: '#34d399' },
    error:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)',  color: '#f87171' },
    info:    { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.35)', color: '#38bdf8' },
    warn:    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#fbbf24' },
  }[toast.type] || { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', color: '#818cf8' };
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 100,
      padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: 13,
      backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: 360, fontFamily: "'Plus Jakarta Sans', sans-serif",
      animation: 'slideRight 0.3s cubic-bezier(.34,1.56,.64,1)',
      background: C.bg, border: `1px solid ${C.border}`, color: C.color,
    }}>{toast.msg}</div>
  );
}
