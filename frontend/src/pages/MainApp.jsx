// src/pages/MainApp.jsx
// The main authenticated application shell.
// Loads all data from the API on mount and passes it down to child views.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import * as api from '../api.js';

// ── Views (you can split these into separate files later) ─────
import ScheduleGrid from '../components/ScheduleGrid.jsx';
import ScheduleList from '../components/ScheduleList.jsx';
import TeachersView from '../components/TeachersView.jsx';
import SubjectsView from '../components/SubjectsView.jsx';
import HolidaysView from '../components/HolidaysView.jsx';
import DashboardView from '../components/DashboardView.jsx';
import Toast from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import PSTClock from '../components/PSTClock.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function MainApp() {
  const { currentUser, token, signOut } = useAuth();
  const isAdmin = currentUser.role === 'admin';

  // ── App state ────────────────────────────────────────────────
  const [view, setView] = useState(isAdmin ? 'dashboard' : 'schedule');
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [weekDate, setWeekDate] = useState('2026-06-15');
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [dragSubject, setDragSubject] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [sections, setSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pst_sections') || '[]'); } catch { return []; }
  });
  const [selectedSection, setSelectedSection] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3800);
  };

  // ── Load all data on mount ───────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [t, s, sc, h] = await Promise.all([
        api.getTeachers(token),
        api.getSubjects(token),
        api.getSchedules(token),
        api.getHolidays(token),
      ]);
      setTeachers(t);
      setSubjects(s);
      setSchedules(sc);
      setHolidays(h);

      // Set default selected teacher for the grid
      if (isAdmin && t.length > 0) setSelectedTeacherId(t[0].id);
      if (!isAdmin) setSelectedTeacherId(currentUser.id);

      // Admin also loads pending teachers
      if (isAdmin) {
        const pending = await api.getPendingTeachers(token);
        setPendingTeachers(pending);
      }
    } catch (err) {
      showToast('Failed to load data: ' + err.message, 'error');
    } finally {
      setDataLoading(false);
    }
  }, [token, isAdmin, currentUser.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Schedule actions ─────────────────────────────────────────
  const handleDrop = async (day, time) => {
    if (!dragSubject || !selectedTeacherId) return;

    const endTime = addMinutes(time, 60);

    try {
      const newEntry = await api.plotSchedule(token, {
        teacherId: selectedTeacherId,
        subjectId: dragSubject.id,
        day,
        startTime: time,
        endTime,
        room: null,
        weekDate,
        section: selectedSection || null,
      });

      // Enrich with subject info for the UI
      const sub = subjects.find(s => s.id === newEntry.subjectId);
      const teacher = teachers.find(t => t.id === newEntry.teacherId);
      const sec = sections.find(s => s.id === selectedSection);
      setSchedules(prev => [...prev, {
        ...newEntry,
        subjectName: sub?.name,
        subjectCode: sub?.code,
        subjectColor: sub?.color,
        teacherName: teacher?.name,
        teacherColor: teacher?.color,
        sectionName: sec ? `${sec.grade} – ${sec.name}` : null,
      }]);
      showToast(`✅ ${dragSubject.name} plotted on ${day} ${formatTime(time)}${sec ? ` · ${sec.name}` : ''}`);
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
    setDragSubject(null);
    setDragOver(null);
  };

  const handleRemoveSchedule = async (id) => {
    try {
      await api.removeSchedule(token, id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      showToast('🗑️ Entry removed.', 'info');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  // ── Section actions (stored in localStorage) ─────────────────
  const handleAddSection = ({ grade, name }) => {
    const newSec = { id: `sec_${Date.now()}`, grade, name };
    const updated = [...sections, newSec];
    setSections(updated);
    localStorage.setItem('pst_sections', JSON.stringify(updated));
    showToast(`✅ Section "${name}" added!`);
  };

  const handleRemoveSection = (id) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    localStorage.setItem('pst_sections', JSON.stringify(updated));
    if (selectedSection === id) setSelectedSection(null);
    showToast('Section removed.', 'info');
  };

  // ── Teacher actions ──────────────────────────────────────────
  const handleApproveTeacher = async (id) => {
    try {
      await api.approveTeacher(token, id);
      const approved = pendingTeachers.find(t => t.id === id);
      setPendingTeachers(prev => prev.filter(t => t.id !== id));
      if (approved) setTeachers(prev => [...prev, { ...approved, maxLoad: 6, color: '#6366f1' }]);
      showToast('✅ Teacher approved!');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const handleRejectTeacher = async (id) => {
    try {
      await api.removeTeacher(token, id);
      setPendingTeachers(prev => prev.filter(t => t.id !== id));
      showToast('Teacher registration rejected.', 'warn');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const handleRemoveTeacher = async (id) => {
    try {
      await api.removeTeacher(token, id);
      setTeachers(prev => prev.filter(t => t.id !== id));
      setSchedules(prev => prev.filter(s => s.teacherId !== id));
      showToast('Teacher removed.', 'info');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const handleAddTeacher = async (payload) => {
    try {
      const newTeacher = await api.addTeacher(token, payload);
      setTeachers(prev => [...prev, newTeacher]);
      showToast(`✅ ${newTeacher.name} registered!`);
      setModal(null);
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  // ── Subject actions ──────────────────────────────────────────
  const handleAddSubject = async (payload) => {
    try {
      const newSubject = await api.addSubject(token, payload);
      setSubjects(prev => [...prev, newSubject]);
      showToast(`✅ ${newSubject.name} added!`);
      setModal(null);
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const handleRemoveSubject = async (id) => {
    try {
      await api.removeSubject(token, id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      showToast('Subject removed.', 'info');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  // ── Week holiday detection ───────────────────────────────────
  const base = new Date(weekDate);
  const weekHolidays = DAYS.map((day, i) => {
    const dt = new Date(base);
    dt.setDate(base.getDate() + i);
    const k = dt.toISOString().split('T')[0];
    const hol = holidays.find(h => {
      const d = typeof h.date === 'string' ? h.date : h.date?.toISOString?.().split('T')[0];
      return d === k;
    });
    return hol ? { day, name: hol.name, date: k } : null;
  }).filter(Boolean);

  const pendingCount = pendingTeachers.length;
  const effectiveTid = isAdmin ? selectedTeacherId : currentUser.id;

  const navItems = [
    ...(isAdmin ? [{ id: 'dashboard', icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    ), label: 'Dashboard' }] : []),
    { id: 'schedule', icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/><rect x="14" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/></svg>
    ), label: 'Schedule Grid' },
    { id: 'mySchedule', icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
    ), label: isAdmin ? 'All Schedules' : 'My Schedule' },
    ...(isAdmin ? [{ id: 'teachers', icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ), label: 'Teachers', badge: pendingCount }] : []),
    ...(isAdmin ? [{ id: 'subjects', icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    ), label: 'Subjects' }] : []),
    { id: 'holidays', icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
    ), label: 'PH Holidays' },
  ];

  if (dataLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', color: '#1a1612', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⊞</div>
          <div style={{ fontWeight: 600, color: '#b8860b' }}>Loading schedule data…</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalStyles />
      {toast && <Toast toast={toast} />}
      {modal && (
        <Modal modal={modal} setModal={setModal}
          onAddTeacher={handleAddTeacher}
          onAddSubject={handleAddSubject}
          schedules={schedules} teachers={teachers} subjects={subjects}
          showToast={showToast}
        />
      )}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", background: '#f5f3ef', color: '#1a1612' }}>
        {/* BG */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 15% -5%,rgba(184,134,11,0.08) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 85% 100%,rgba(101,67,33,0.06) 0%,transparent 60%)' }} />

        {/* SIDEBAR */}
        <div style={{ width: 228, background: 'linear-gradient(160deg,#faf8f4,#ede8df)', borderRight: '1px solid rgba(184,134,11,0.18)', display: 'flex', flexDirection: 'column', padding: '16px 10px', gap: 3, position: 'relative', zIndex: 1, flexShrink: 0, boxShadow: '2px 0 12px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '4px 8px 16px', borderBottom: '1px solid rgba(184,134,11,0.15)', marginBottom: 6 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: '#1a1612', letterSpacing: '-0.01em' }}>PST Scheduler</div>
            <div style={{ fontSize: 9, color: '#b8860b', letterSpacing: '0.15em', fontFamily: "'DM Mono'", marginTop: 2, fontWeight: 600 }}>PH STANDARD TIME</div>
          </div>

          {navItems.map(n => (
            <button key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge > 0 && <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>{n.badge}</span>}
            </button>
          ))}

          {/* Grade & Section panel in sidebar */}
          {sections.length > 0 && (
            <div style={{ margin: '8px 2px 0', padding: '10px 10px', background: 'rgba(255,255,255,0.6)', borderRadius: 12, border: '1px solid rgba(184,134,11,0.18)' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#b8860b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>Grade & Section</div>
              <div onClick={() => setSelectedSection(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 3, transition: 'all 0.15s', background: !selectedSection ? 'rgba(184,134,11,0.1)' : 'transparent', border: `1px solid ${!selectedSection ? 'rgba(184,134,11,0.22)' : 'transparent'}` }}>
                <svg width="12" height="12" fill="none" stroke={!selectedSection ? '#92400e' : '#9d9590'} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: !selectedSection ? '#92400e' : '#7a6f63' }}>All Sections</span>
              </div>
              {['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(grade => {
                const gradeSections = sections.filter(s => s.grade === grade);
                if (!gradeSections.length) return null;
                return (
                  <div key={grade}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#b8860b', letterSpacing: '0.08em', padding: '6px 8px 3px', textTransform: 'uppercase' }}>{grade}</div>
                    {gradeSections.map(sec => (
                      <div key={sec.id}
                        onClick={() => { setSelectedSection(selectedSection === sec.id ? null : sec.id); if (view !== 'schedule') setView('schedule'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s', background: selectedSection === sec.id ? 'rgba(77,124,15,0.1)' : 'transparent', border: `1px solid ${selectedSection === sec.id ? 'rgba(77,124,15,0.22)' : 'transparent'}` }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: selectedSection === sec.id ? '#4d7c0f' : '#c9b99a', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: selectedSection === sec.id ? '#4d7c0f' : '#5a4f3f', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ flex: 1 }} />
          <PSTClock />

          {/* User card */}
          <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 12, border: '1px solid rgba(184,134,11,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#1a1612', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#f5f3ef', flexShrink: 0 }}>{currentUser.name[0]}</div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#1a1612', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
                <div style={{ display: 'inline-flex', marginTop: 2, padding: '1px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700, background: isAdmin ? 'rgba(184,134,11,0.15)' : 'rgba(101,163,13,0.12)', color: isAdmin ? '#b8860b' : '#4d7c0f', border: `1px solid ${isAdmin ? 'rgba(184,134,11,0.3)' : 'rgba(101,163,13,0.25)'}` }}>{isAdmin ? 'ADMIN' : 'TEACHER'}</div>
              </div>
            </div>
            <button onClick={() => { signOut(); }} style={{ width: '100%', padding: '6px 0', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans'", transition: 'all 0.2s' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          {/* Topbar */}
          <div style={{ height: 54, borderBottom: '1px solid rgba(184,134,11,0.15)', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 12, background: 'rgba(245,243,239,0.95)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1612' }}>{navItems.find(n => n.id === view)?.label}</div>
            <div style={{ flex: 1 }} />
            {(view === 'schedule' || view === 'mySchedule') && (<>
              <span style={{ fontSize: 11, color: '#9d9590', fontFamily: "'DM Mono'" }}>Week of</span>
              <input type="date" value={weekDate} onChange={e => setWeekDate(e.target.value)} className="auth-input" style={{ width: 148, padding: '6px 10px', fontSize: 12, fontFamily: "'DM Mono'" }} />
              <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => setModal({ type: 'export', data: { schedules, teachers, subjects } })}>↗ Form 7</button>
            </>)}
            {view === 'teachers' && isAdmin && <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => setModal({ type: 'addTeacher' })}>+ Register Teacher</button>}
            {view === 'subjects' && isAdmin && <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => setModal({ type: 'addSubject' })}>+ Add Subject</button>}
          </div>

          {/* Holiday banner */}
          {weekHolidays.length > 0 && (view === 'schedule' || view === 'mySchedule') && (
            <div style={{ margin: '10px 18px 0', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, flexShrink: 0 }}>
              <span>🇵🇭</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>Holiday this week:</span>
              {weekHolidays.map(h => <span key={h.day} style={{ color: '#d97706', marginRight: 8 }}>{h.day} — <b>{h.name}</b></span>)}
            </div>
          )}

          {/* Stats row */}
          {view === 'schedule' && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 18px 0', flexShrink: 0 }}>
              {[
                { label: 'Total Plots', value: schedules.length, color: '#b8860b' },
                { label: 'Active Teachers', value: teachers.length, color: '#4d7c0f' },
                { label: 'Subjects', value: subjects.length, color: '#7c3aed' },
                { label: 'Holidays This Week', value: weekHolidays.length, color: '#dc2626' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(184,134,11,0.15)', borderRadius: 12, padding: '11px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'DM Mono'" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#9d9590', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
            {view === 'dashboard' && isAdmin && <DashboardView teachers={teachers} subjects={subjects} schedules={schedules} pendingTeachers={pendingTeachers} setView={setView} />}
            {view === 'schedule' && <ScheduleGrid subjects={subjects} schedules={schedules} teachers={teachers} currentUser={currentUser} effectiveTid={effectiveTid} setSelectedTeacherId={isAdmin ? setSelectedTeacherId : undefined} dragSubject={dragSubject} setDragSubject={setDragSubject} dragOver={dragOver} setDragOver={setDragOver} handleDrop={handleDrop} removeSchedule={handleRemoveSchedule} weekHolidays={weekHolidays} isAdmin={isAdmin} sections={sections} onAddSection={handleAddSection} onRemoveSection={handleRemoveSection} selectedSection={selectedSection} setSelectedSection={setSelectedSection} />}
            {view === 'mySchedule' && <ScheduleList schedules={schedules} subjects={subjects} teachers={teachers} currentUser={currentUser} isAdmin={isAdmin} weekHolidays={weekHolidays} />}
            {view === 'teachers' && isAdmin && <TeachersView teachers={teachers} pendingTeachers={pendingTeachers} schedules={schedules} onApprove={handleApproveTeacher} onReject={handleRejectTeacher} onRemove={handleRemoveTeacher} showToast={showToast} />}
            {view === 'subjects' && isAdmin && <SubjectsView subjects={subjects} onRemove={handleRemoveSubject} />}
            {view === 'holidays' && <HolidaysView holidays={holidays} />}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Shared helpers ────────────────────────────────────────────
function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ap}`;
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      ::-webkit-scrollbar{width:5px;height:5px;}
      ::-webkit-scrollbar-track{background:#ede8df;}
      ::-webkit-scrollbar-thumb{background:#c9b99a;border-radius:3px;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
      @keyframes slideRight{from{opacity:0;transform:translateX(-20px);}to{opacity:1;transform:translateX(0);}}
      @keyframes popIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
      @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
      .fade-up{animation:fadeUp 0.45s cubic-bezier(.22,1,.36,1) both;}
      .nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;font-weight:500;font-size:13px;color:#7a6f63;background:transparent;width:100%;text-align:left;font-family:'DM Sans',sans-serif;}
      .nav-item:hover{color:#1a1612;background:rgba(184,134,11,0.08);}
      .nav-item.active{color:#92400e;background:rgba(184,134,11,0.12);border-color:rgba(184,134,11,0.25);font-weight:600;}
      .card{background:rgba(255,255,255,0.7);border:1px solid rgba(184,134,11,0.15);border-radius:16px;transition:all 0.2s;}
      .card:hover{border-color:rgba(184,134,11,0.28);box-shadow:0 2px 12px rgba(0,0,0,0.06);}
      .auth-input{width:100%;background:#fff;border:1.5px solid #e5e0d8;border-radius:10px;color:#1a1612;padding:11px 14px;font-size:14px;outline:none;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
      .auth-input:focus{border-color:#b8860b;box-shadow:0 0 0 3px rgba(184,134,11,0.12);}
      .auth-input::placeholder{color:#b8b0a4;}
      .btn-primary{background:#1a1612;border:none;border-radius:10px;color:#f5f3ef;padding:11px 22px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;letter-spacing:0.01em;}
      .btn-primary:hover{background:#2d2520;transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,0.15);}
      .btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
      .grid-cell{transition:background 0.1s;cursor:default;}
      .grid-cell.droppable{cursor:copy;}
      .grid-cell.drag-over{background:rgba(184,134,11,0.12)!important;outline:1.5px solid #b8860b;}
      .sched-pill{position:absolute;left:2px;right:2px;border-radius:6px;padding:3px 6px;font-size:9px;font-weight:700;cursor:pointer;overflow:hidden;z-index:2;transition:filter 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.12);}
      .sched-pill:hover{filter:brightness(0.92);}
      .subject-drag-card{cursor:grab;user-select:none;transition:transform 0.2s cubic-bezier(.34,1.56,.64,1);}
      .subject-drag-card:hover{transform:translateY(-2px) scale(1.02);}
      .subject-drag-card:active{cursor:grabbing;}
      .modal-overlay{position:fixed;inset:0;background:rgba(26,22,18,0.5);backdrop-filter:blur(8px);z-index:60;display:flex;align-items:center;justify-content:center;}
      .modal-box{background:#fff;border:1px solid rgba(184,134,11,0.2);border-radius:20px;padding:28px;width:460px;max-width:95vw;box-shadow:0 24px 60px rgba(0,0,0,0.15);animation:popIn 0.3s cubic-bezier(.34,1.56,.64,1);}
    `}</style>
  );
}
