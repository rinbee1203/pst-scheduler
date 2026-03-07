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
  const lc = loadPct >= 100 ? '#ef4444' : loadPct >= 75 ? '#f59e0b' : '#10b981';
  const isHol = d => weekHolidays.some(h => h.day === d);

  // Filter schedules by selected section
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

  // Group sections by grade level
  const sectionsByGrade = GRADE_LEVELS.reduce((acc, g) => {
    const list = (sections || []).filter(s => s.grade === g);
    if (list.length > 0) acc[g] = list;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 220px)' }}>

      {/* ── LEFT PALETTE ── */}
      <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Sections panel */}
        <div style={{ background: 'rgba(6,9,16,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 11, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 8, fontWeight: 800, color: '#334155', letterSpacing: '0.12em' }}>SECTIONS</div>
            {isAdmin && (
              <button onClick={() => setShowSectionForm(p => !p)}
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 5, color: '#818cf8', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '1px 6px', lineHeight: 1.4 }}>
                {showSectionForm ? '✕' : '+'}
              </button>
            )}
          </div>

          {/* Add section form */}
          {showSectionForm && isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '7px 6px', background: 'rgba(99,102,241,0.07)', borderRadius: 9, border: '1px solid rgba(99,102,241,0.15)', marginBottom: 4 }}>
              <select value={newGrade} onChange={e => setNewGrade(e.target.value)}
                style={{ background: '#0a1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#e2e8f0', padding: '4px 6px', fontSize: 10, fontFamily: "'Plus Jakarta Sans'", outline: 'none' }}>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input
                value={newSection}
                onChange={e => setNewSection(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSection()}
                placeholder="Section name (e.g. STEM-A)"
                style={{ background: '#0a1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#e2e8f0', padding: '4px 6px', fontSize: 10, fontFamily: "'Plus Jakarta Sans'", outline: 'none' }}
              />
              <button onClick={handleAddSection}
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: '4px 0', fontFamily: "'Plus Jakarta Sans'" }}>
                Add Section
              </button>
            </div>
          )}

          {/* All sections button */}
          <div onClick={() => setSelectedSection(null)}
            style={{ padding: '5px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 10, fontWeight: 700, transition: 'all 0.15s', background: !selectedSection ? 'rgba(99,102,241,0.15)' : 'transparent', color: !selectedSection ? '#818cf8' : '#64748b', border: `1px solid ${!selectedSection ? 'rgba(99,102,241,0.3)' : 'transparent'}` }}>
            📋 All Sections
          </div>

          {/* Sections grouped by grade */}
          {Object.keys(sectionsByGrade).length === 0 && (
            <div style={{ fontSize: 9, color: '#334155', textAlign: 'center', padding: '8px 0' }}>
              {isAdmin ? 'Click + to add sections' : 'No sections yet'}
            </div>
          )}
          {Object.entries(sectionsByGrade).map(([grade, list]) => (
            <div key={grade}>
              <div style={{ fontSize: 8, fontWeight: 800, color: '#475569', letterSpacing: '0.1em', padding: '5px 4px 3px', textTransform: 'uppercase' }}>{grade}</div>
              {list.map(sec => (
                <div key={sec.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s', background: selectedSection === sec.id ? 'rgba(16,185,129,0.12)' : 'transparent', border: `1px solid ${selectedSection === sec.id ? 'rgba(16,185,129,0.25)' : 'transparent'}` }}
                  onClick={() => setSelectedSection(selectedSection === sec.id ? null : sec.id)}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: selectedSection === sec.id ? '#34d399' : '#334155', flexShrink: 0, transition: 'background 0.15s' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: selectedSection === sec.id ? '#34d399' : '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.name}</span>
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); onRemoveSection(sec.id); }}
                      style={{ background: 'none', border: 'none', color: '#475569', fontSize: 9, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                      title="Remove section">✕</button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Subjects palette */}
        <div style={{ flex: 1, background: 'rgba(6,9,16,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 11, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: '#334155', letterSpacing: '0.12em', marginBottom: 2 }}>DRAG TO PLOT</div>
          {subjects.map(sub => (
            <div key={sub.id} className="subject-drag-card" draggable
              onDragStart={() => setDragSubject(sub)} onDragEnd={() => setDragSubject(null)}
              style={{ background: `${sub.color}14`, border: `1px solid ${sub.color}33`, borderLeft: `3px solid ${sub.color}`, borderRadius: 9, padding: '6px 8px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: sub.color }}>{sub.code}</div>
              <div style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>{sub.grade} · {sub.name.slice(0, 14)}{sub.name.length > 14 ? '…' : ''}</div>
            </div>
          ))}

          {/* Teacher selector */}
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
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>

        {/* Teacher + section info bar */}
        {teacher && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: teacher.color || '#818cf8' }} />
            <span style={{ fontWeight: 800, fontSize: 13 }}>{teacher.name}</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>{teacher.dept} · {teacher.employeeId}</span>
            {selectedSection && (() => {
              const sec = (sections || []).find(s => s.id === selectedSection);
              return sec ? (
                <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                  {sec.grade} — {sec.name}
                </span>
              ) : null;
            })()}
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

        {/* Section prompt if none selected */}
        {!selectedSection && (sections || []).length > 0 && (
          <div style={{ padding: '7px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 9, fontSize: 11, color: '#d97706', flexShrink: 0 }}>
            💡 Select a section from the left panel to filter the grid, or view all plots below.
          </div>
        )}

        {/* Grid */}
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
                      <td key={day}
                        className={`grid-cell ${dragSubject && !hol ? 'droppable' : ''} ${dragOver === key ? 'drag-over' : ''}`}
                        style={{ background: hol ? 'rgba(245,158,11,0.03)' : ti % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)', borderLeft: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}
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
                            <span style={{ fontSize: 7, color: '#78350f', fontWeight: 700 }}>HOLIDAY</span>
                          </div>
                        )}
                        {cs.map(sc => (
                          <div key={sc.id} className="sched-pill"
                            style={{ background: `${sc.subjectColor || '#6366f1'}20`, borderLeft: `3px solid ${sc.subjectColor || '#6366f1'}` }}
                            onClick={() => removeSchedule(sc.id)}
                            title={`${sc.subjectName}\n${formatTime(sc.startTime)}–${formatTime(sc.endTime)}\n${sc.sectionName || ''}\nClick to remove`}>
                            <div style={{ color: sc.subjectColor || '#818cf8', fontWeight: 800, fontSize: 9 }}>{sc.subjectCode}</div>
                            {sc.sectionName && <div style={{ fontSize: 7, color: '#64748b', marginTop: 1 }}>{sc.sectionName}</div>}
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
