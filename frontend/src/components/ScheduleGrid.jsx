// src/components/ScheduleGrid.jsx
import { formatTime } from '../pages/MainApp.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [];
for (let h = 7; h < 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

export default function ScheduleGrid({ subjects, schedules, teachers, currentUser, effectiveTid, setSelectedTeacherId, dragSubject, setDragSubject, dragOver, setDragOver, handleDrop, removeSchedule, weekHolidays, isAdmin }) {
  const teacher = [...teachers].find(t => t.id === effectiveTid) || (!isAdmin ? currentUser : null);
  const load = schedules.filter(s => s.teacherId === effectiveTid).length;
  const maxLoad = teacher?.maxLoad || 6;
  const loadPct = Math.min((load / maxLoad) * 100, 100);
  const lc = loadPct >= 100 ? '#ef4444' : loadPct >= 75 ? '#f59e0b' : '#10b981';
  const isHol = d => weekHolidays.some(h => h.day === d);
  const cellS = (day, time) => schedules.filter(s => s.teacherId === effectiveTid && s.day === day && s.startTime === time);

  return (
    <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 220px)' }}>
      {/* Palette */}
      <div style={{ width: 168, flexShrink: 0, background: 'rgba(6,9,16,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 11, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
        <div style={{ fontSize: 8, fontWeight: 800, color: '#334155', letterSpacing: '0.12em', marginBottom: 2 }}>DRAG TO PLOT</div>
        {subjects.map(sub => (
          <div key={sub.id} className="subject-drag-card" draggable
            onDragStart={() => setDragSubject(sub)} onDragEnd={() => setDragSubject(null)}
            style={{ background: `${sub.color}14`, border: `1px solid ${sub.color}33`, borderLeft: `3px solid ${sub.color}`, borderRadius: 9, padding: '6px 8px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: sub.color }}>{sub.code}</div>
            <div style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>{sub.grade} · {sub.name.slice(0, 14)}{sub.name.length > 14 ? '…' : ''}</div>
          </div>
        ))}
        {isAdmin && teachers.length > 0 && (
          <div style={{ marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
            <div style={{ fontSize: 8, fontWeight: 800, color: '#334155', letterSpacing: '0.12em', marginBottom: 6 }}>ASSIGN TO</div>
            {teachers.map(t => (
              <div key={t.id} onClick={() => setSelectedTeacherId?.(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 9, cursor: 'pointer', marginBottom: 2, border: '1px solid transparent', transition: 'all 0.15s', background: effectiveTid === t.id ? 'rgba(99,102,241,0.12)' : 'transparent', borderColor: effectiveTid === t.id ? 'rgba(99,102,241,0.25)' : 'transparent' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: effectiveTid === t.id ? '#c7d2fe' : '#94a3b8' }}>{t.name}</div>
                  <div style={{ fontSize: 8, color: '#475569' }}>{t.dept}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>
        {teacher && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: teacher.color || '#818cf8' }} />
            <span style={{ fontWeight: 800, fontSize: 13 }}>{teacher.name}</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>{teacher.dept} · {teacher.employeeId}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: '#64748b' }}>Teaching Load</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: lc, fontFamily: "'Fira Code'" }}>{load}/{maxLoad}h</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 5 }}>
                <div style={{ width: `${loadPct}%`, background: `linear-gradient(90deg,${lc},${lc}88)`, borderRadius: 999, height: '100%', transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ width: 70, padding: 8, fontSize: 8, fontWeight: 800, color: '#334155', letterSpacing: '0.1em', background: '#070a14', position: 'sticky', top: 0, left: 0, zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>TIME PST</th>
                {DAYS.map(day => {
                  const hol = weekHolidays.find(h => h.day === day);
                  return (
                    <th key={day} style={{ padding: 8, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', background: hol ? 'rgba(245,158,11,0.07)' : '#070a14', color: hol ? '#fbbf24' : '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.04)', position: 'sticky', top: 0, zIndex: 9 }}>
                      {day}{hol && <div style={{ fontSize: 7, color: '#92400e', fontWeight: 600, marginTop: 1 }}>🇵🇭 {hol.name.slice(0, 13)}</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((time, ti) => (
                <tr key={time} style={{ height: 34 }}>
                  <td style={{ padding: '0 8px', fontFamily: "'Fira Code'", fontSize: 8, fontWeight: 500, color: '#334155', background: '#070a14', position: 'sticky', left: 0, zIndex: 5, borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.03)', whiteSpace: 'nowrap' }}>{formatTime(time)}</td>
                  {DAYS.map(day => {
                    const hol = isHol(day);
                    const cs = cellS(day, time);
                    const key = `${day}-${time}`;
                    return (
                      <td key={day} className={`grid-cell ${dragSubject && !hol ? 'droppable' : ''} ${dragOver === key ? 'drag-over' : ''}`}
                        style={{ background: hol ? 'rgba(245,158,11,0.03)' : ti % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)', borderLeft: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}
                        onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={() => { setDragOver(null); hol ? alert('🇵🇭 Cannot plot on a PH Holiday!') : handleDrop(day, time); }}>
                        {hol && !cs.length && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 7, color: '#78350f', fontWeight: 700 }}>HOLIDAY</span></div>}
                        {cs.map(sc => (
                          <div key={sc.id} className="sched-pill"
                            style={{ background: `${sc.subjectColor || '#6366f1'}20`, borderLeft: `3px solid ${sc.subjectColor || '#6366f1'}` }}
                            onClick={() => removeSchedule(sc.id)}
                            title={`${sc.subjectName}\n${formatTime(sc.startTime)}–${formatTime(sc.endTime)}\nClick to remove`}>
                            <div style={{ color: sc.subjectColor || '#818cf8', fontWeight: 800, fontSize: 9 }}>{sc.subjectCode}</div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
