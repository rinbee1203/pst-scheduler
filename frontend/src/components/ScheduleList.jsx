// src/components/ScheduleList.jsx
import { useState } from 'react';
import { formatTime } from '../pages/MainApp.jsx';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

export default function ScheduleList({ ... }) {
  const [filter, setFilter] = useState(isAdmin ? 'all' : currentUser.id);
  const filtered = filter === 'all' ? schedules : schedules.filter(s => s.teacherId === filter);
  return (
    <div className="fade-up">
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${filter === 'all' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", background: filter === 'all' ? 'rgba(99,102,241,0.15)' : 'transparent', color: filter === 'all' ? '#818cf8' : '#64748b', transition: 'all 0.15s' }}>All Teachers</button>
          {teachers.map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${filter === t.id ? `${t.color}55` : 'rgba(255,255,255,0.1)'}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", background: filter === t.id ? `${t.color}18` : 'transparent', color: filter === t.id ? t.color : '#64748b', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color }} />{t.name}
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No schedules yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Go to Schedule Grid to start plotting.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DAYS.map(day => {
            const ds = filtered.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
            const hol = weekHolidays.find(h => h.day === day);
            if (!ds.length && !hol) return null;
            return (
              <div key={day} className="card" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: ds.length ? 10 : 0 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: hol ? '#fbbf24' : '#e2e8f0' }}>{day}</span>
                  {hol && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>🇵🇭 {hol.name}</span>}
                  <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>{ds.length} class{ds.length !== 1 ? 'es' : ''}</span>
                </div>
                {ds.map(sc => {
                  const t = teachers.find(x => x.id === sc.teacherId);
                  return (
                    <div key={sc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: `${sc.subjectColor || '#6366f1'}0e`, border: `1px solid ${sc.subjectColor || '#6366f1'}22`, borderLeft: `3px solid ${sc.subjectColor || '#6366f1'}`, borderRadius: 9, marginBottom: 5 }}>
                      <span style={{ fontFamily: "'Fira Code'", fontSize: 9, color: '#64748b', width: 110, flexShrink: 0 }}>{formatTime(sc.startTime)} – {formatTime(sc.endTime)}</span>
                      <span style={{ fontWeight: 800, fontSize: 12, color: sc.subjectColor }}>{sc.subjectCode}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>{sc.subjectName}</span>
                      {isAdmin && t && <span style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: t.color }} />{t.name}</span>}
                      <span style={{ fontSize: 10, color: '#475569', fontFamily: "'Fira Code'" }}>{sc.room || '—'}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
