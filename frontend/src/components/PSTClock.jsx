// src/components/PSTClock.jsx
import { useState, useEffect } from 'react';

export default function PSTClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  const pst = t.toLocaleString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = t.toLocaleString('en-PH', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10, padding: '8px 12px', marginBottom: 4 }}>
      <div style={{ fontFamily: "'Fira Code'", fontSize: 15, fontWeight: 700, color: '#818cf8', letterSpacing: '0.06em' }}>{pst}</div>
      <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>{date} · PST UTC+8</div>
    </div>
  );
}
