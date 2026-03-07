// src/components/ScheduleGrid.jsx
import { useState } from 'react';
import { formatTime } from '../pages/MainApp.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [];
for (let h = 7; h < 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export default function ScheduleGrid({
  subjects, schedules, teachers, currentUser,
  effectiveTid, setSelectedTeacherId,
  dragSubject, setDragSubject, dragOver, setDragOver,
  handleDrop, removeSchedule, weekHolidays, isAdmin,
  sections, onAddSection, onRemoveSection,
  selectedSection, setSelectedSection,
}) {
  const [newGrade, setNewGrade] = useState('Grade 11');
  const [newSection, setNewSection] = useState('');
  const [showSectionForm, setShowSectionForm] = useState(false);

  const teacher = [...teachers].find(t => t.id === effectiveTid) || (!isAdmin ? currentUser : null);
  const load = schedules.filter(s => s.teacherId === effectiveTid).length;
  const maxLoad = teacher?.maxLoad || 6;
  const loadPct = Math.min((load / maxLoad) * 100, 100);
  const lc = loadPct >= 100 ? '#dc2626' : loadPct >= 75 ? '#d97706' : '#4d7c0f';
  const isHol = d => weekHolidays.some(h => h.day === d);

  const filteredSchedules = selectedSection
    ? schedules.filter(s => s.teacherId === effectiveTid && s.section === selectedSection)
    : schedules.filter(s => s.teacherId === effectiveTid);

  const cellS = (day, time) =>
    filteredSchedules.filter(s => s.day === day && s.startTime === time);

  const handleAddSection = () => {
    if (!newSection.trim()) return;
    onAddSection({ grade: newGrade, name: newSection.trim() });
    setNewSection('');
    setShowSectionForm(false);
  };

  const sectionsByGrade = GRADE_LEVELS.reduce((acc, g) => {
    const list = (sections || []).filter(s => s.grade === g);
    if (list.length > 0) acc[g] = list;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 220px)' }}>

      {/* LEFT PALETTE */}
      <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Sections panel */}
        <div style={{ background: '#fff', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 14, padding: 11, display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#9d9590', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Sections</div>
            {isAdmin && (
              <button onClick={() => setShowSectionForm(p => !p)}
                style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.3)', borderRadius: 5, color: '#b8860b', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '1px 6px', lineHeight: 1.4 }}>
                {showSectionForm ? '✕' : '+'}
              </button>
            )}
          </div>

          {showSectionForm && isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '7px 6px', background: 'rgba(184,134,11,0.05)', borderRadius: 9, border: '1px solid rgba(184,134,11,0.15)', marginBottom: 4 }}>
              <select value={newGrade} onChange={e => setNewGrade(e.target.value)}
                style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 6, color: '#1a1612', padding: '4px 6px', fontSize: 10, fontFamily: "'DM Sans'", outline: 'none' }}>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input value={newSection} onChange={e => setNewSection(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSection()}
                placeholder="e.g. STEM-A, Rizal"
                style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 6, color: '#1a1612', padding: '4px 6px', fontSize: 10, fontFamily: "'DM Sans'", outline: 'none' }} />
              <button onClick={handleAddSection}
                style={{ background: '#1a1612', border: 'none', borderRadius: 6, color: '#f5f3ef', fontSize: 10, fontWeight: 600, cursor: 'pointer', padding: '4px 0', fontFamily: "'DM Sans'" }}>
                Add Section
              </button>
            </div>
          )}

          <div onClick={() => setSelectedSection(null)}
            style={{ padding: '5px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 10, fontWeight: 600, transition: 'all 0.15s', background: !selectedSection ? 'rgba(184,134,11,0.1)' : 'transparent', color: !selectedSection ? '#92400e' : '#7a6f63', border: `1px solid ${!selectedSection ? 'rgba(184,134,11,0.25)' : 'transparent'}` }}>
            📋 All Sections
          </div>

          {Object.keys(sectionsByGrade).length === 0 && (
            <div style={{ fontSize: 9, color: '#b8b0a4', textAlign: 'center', padding: '8px 0' }}>
              {isAdmin ? 'Click + to add sections' : 'No sections yet'}
            </div>
          )}

          {Object.entries(sectionsByGrade).map(([grade, list]) => (
            <div key={grade}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#b8860b', letterSpacing: '0.1em', padding: '5px 4px 3px', textTransform: 'uppercase' }}>{grade}</div>
              {list.map(sec => (
                <div key={sec.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s', background: selectedSection === sec.id ? 'rgba(77,124,15,0.1)' : 'transparent', border: `1px solid ${selectedSection === sec.id ? 'rgba(77,124,15,0.25)' : 'transparent'}` }}
                  onClick={() => setSelectedSection(selectedSection === sec.id ? null : sec.id)}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: selectedSection === sec.id ? '#4d7c0f' : '#c9b99a', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: selectedSection === sec.id ? '#4d7c0f' : '#5a4f3f', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.name}</span>
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); onRemoveSection(sec.id); }}
                      style={{ background: 'none', border: 'none', color: '#c9b99a', fontSize: 9, cursor: 'pointer', padding: '0 2px' }}
                      title="Remove">✕</button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Subjects palette */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 14, padding: 11, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#9d9590', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>Drag to Plot</div>
          {subjects.map(sub => (
            <div key={sub.id} className="subject-drag-card" draggable
              onDragStart={() => setDragSubject(sub)} onDragEnd={() => setDragSubject(null)}
              style={{ background: `${sub.color}18`, border: `1px solid ${sub.color}44`, borderLeft: `3px solid ${sub.color}`, borderRadius: 9, padding: '6px 8px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: sub.color }}>{sub.code}</div>
              <div style={{ fontSize: 8, color: '#9d9590', marginTop: 1 }}>{sub.grade} · {sub.name.slice(0, 14)}{sub.name.length > 14 ? '…' : ''}</div>
            </div>
          ))}

          {isAdmin && teachers.length > 0 && (
            <div style={{ marginTop: 6, borderTop: '1px solid #e5e0d8', paddingTop: 8 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#9d9590', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Assign To</div>
              {teachers.map(t => (
                <div key={t.id} onClick={() => setSelectedTeacherId?.(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 9, cursor: 'pointer', marginBottom: 2, border: '1px solid transparent', transition: 'all 0.15s', background: effectiveTid === t.id ? 'rgba(184,134,11,0.08)' : 'transparent', borderColor: effectiveTid === t.id ? 'rgba(184,134,11,0.22)' : 'transparent' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: effectiveTid === t.id ? '#92400e' : '#5a4f3f' }}>{t.name}</div>
                    <div style={{ fontSize: 8, color: '#b8b0a4' }}>{t.dept}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>

        {teacher && (
          <div style={{ background: '#fff', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: teacher.color || '#b8860b' }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1612' }}>{teacher.name}</span>
            <span style={{ fontSize: 11, color: '#9d9590' }}>{teacher.dept} · {teacher.employeeId}</span>
            {selectedSection && (() => {
              const sec = (sections || []).find(s => s.id === selectedSection);
              return sec ? (
                <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(77,124,15,0.1)', color: '#4d7c0f', border: '1px solid rgba(77,124,15,0.25)' }}>
                  {sec.grade} — {sec.name}
                </span>
              ) : null;
            })()}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: '#9d9590', fontWeight: 500 }}>Teaching Load</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: lc, fontFamily: "'DM Mono'" }}>{load}/{maxLoad}h</span>
              </div>
              <div style={{ background: '#e5e0d8', borderRadius: 999, height: 5 }}>
                <div style={{ width: `${loadPct}%`, background: lc, borderRadius: 999, height: '100%', transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>
        )}

        {!selectedSection && (sections || []).length > 0 && (
          <div style={{ padding: '7px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, fontSize: 11, color: '#92400e', flexShrink: 0 }}>
            💡 Select a section from the left to filter the grid, or view all plots.
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', borderRadius: 12, border: '1px solid rgba(184,134,11,0.18)', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ width: 70, padding: 8, fontSize: 8, fontWeight: 700, color: '#9d9590', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#faf8f4', position: 'sticky', top: 0, left: 0, zIndex: 10, borderBottom: '2px solid #e5e0d8', borderRight: '1px solid #e5e0d8' }}>TIME PST</th>
                {DAYS.map(day => {
                  const hol = weekHolidays.find(h => h.day === day);
                  return (
                    <th key={day} style={{ padding: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', background: hol ? '#fffbeb' : '#faf8f4', color: hol ? '#b8860b' : '#1a1612', borderBottom: '2px solid #e5e0d8', borderLeft: '1px solid #e5e0d8', position: 'sticky', top: 0, zIndex: 9 }}>
                      {day}{hol && <div style={{ fontSize: 7, color: '#92400e', fontWeight: 600, marginTop: 1 }}>🇵🇭 {hol.name.slice(0, 13)}</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((time, ti) => (
                <tr key={time} style={{ height: 34 }}>
                  <td style={{ padding: '0 8px', fontFamily: "'DM Mono'", fontSize: 9, fontWeight: 500, color: '#b8b0a4', background: '#faf8f4', position: 'sticky', left: 0, zIndex: 5, borderRight: '1px solid #e5e0d8', borderBottom: '1px solid #f0ebe3', whiteSpace: 'nowrap' }}>{formatTime(time)}</td>
                  {DAYS.map(day => {
                    const hol = isHol(day);
                    const cs = cellS(day, time);
                    const key = `${day}-${time}`;
                    return (
                      <td key={day}
                        className={`grid-cell ${dragSubject && !hol ? 'droppable' : ''} ${dragOver === key ? 'drag-over' : ''}`}
                        style={{ background: hol ? '#fffbeb' : ti % 2 === 0 ? '#fff' : '#faf8f4', borderBottom: '1px solid #f0ebe3', borderLeft: '1px solid #f0ebe3', position: 'relative' }}
                        onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={() => {
                          setDragOver(null);
                          if (hol) { alert('🇵🇭 Cannot plot on a PH Holiday!'); return; }
                          if (!selectedSection && (sections || []).length > 0) {
                            alert('Please select a section first before plotting.'); return;
                          }
                          handleDrop(day, time);
                        }}>
                        {hol && !cs.length && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 7, color: '#d97706', fontWeight: 700 }}>HOLIDAY</span>
                          </div>
                        )}
                        {cs.map(sc => (
                          <div key={sc.id} className="sched-pill"
                            style={{ background: `${sc.subjectColor || '#b8860b'}18`, borderLeft: `3px solid ${sc.subjectColor || '#b8860b'}` }}
                            onClick={() => removeSchedule(sc.id)}
                            title={`${sc.subjectName}\n${formatTime(sc.startTime)}–${formatTime(sc.endTime)}\n${sc.sectionName || ''}\nClick to remove`}>
                            <div style={{ color: sc.subjectColor || '#b8860b', fontWeight: 700, fontSize: 9 }}>{sc.subjectCode}</div>
                            {sc.sectionName && <div style={{ fontSize: 7, color: '#9d9590', marginTop: 1 }}>{sc.sectionName}</div>}
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
