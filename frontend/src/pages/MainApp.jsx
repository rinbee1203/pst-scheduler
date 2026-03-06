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
      });

      // Enrich with subject info for the UI
      const sub = subjects.find(s => s.id === newEntry.subjectId);
      const teacher = teachers.find(t => t.id === newEntry.teacherId);
      setSchedules(prev => [...prev, {
        ...newEntry,
        subjectName: sub?.name,
        subjectCode: sub?.code,
        subjectColor: sub?.color,
        teacherName: teacher?.name,
        teacherColor: teacher?.color,
      }]);
      showToast(`✅ ${dragSubject.name} plotted on ${day} ${formatTime(time)}`);
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
    ...(isAdmin ? [{ id: 'dashboard', icon: '◈', label: 'Dashboard' }] : []),
    { id: 'schedule', icon: '⊞', label: 'Schedule Grid' },
    { id: 'mySchedule', icon: '📋', label: isAdmin ? 'All Schedules' : 'My Schedule' },
    ...(isAdmin ? [{ id: 'teachers', icon: '👥', label: 'Teachers', badge: pendingCount }] : []),
    ...(isAdmin ? [{ id: 'subjects', icon: '📚', label: 'Subjects' }] : []),
    { id: 'holidays', icon: '🇵🇭', label: 'PH Holidays' },
  ];

  if (dataLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060910', color: '#818cf8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⊞</div>
          <div style={{ fontWeight: 700 }}>Loading schedule data…</div>
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

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#060910', color: '#e2e8f0' }}>
        {/* BG */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 15% -5%,rgba(99,102,241,0.13) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 85% 100%,rgba(139,92,246,0.09) 0%,transparent 60%)' }} />

        {/* SIDEBAR */}
        <div style={{ width: 228, background: 'rgba(6,9,16,0.97)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '16px 10px', gap: 3, position: 'relative', zIndex: 1, flexShrink: 0 }}>
          <div style={{ padding: '4px 8px 16px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PST Scheduler</div>
            <div style={{ fontSize: 9, color: '#334155', letterSpacing: '0.15em', fontFamily: "'Fira Code'", marginTop: 1 }}>PH STANDARD TIME</div>
          </div>

          {navItems.map(n => (
            <button key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999 }}>{n.badge}</span>}
            </button>
          ))}

          <div style={{ flex: 1 }} />
          <PSTClock />

          {/* User card */}
          <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${currentUser.color}22`, border: `1.5px solid ${currentUser.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: currentUser.color, flexShrink: 0 }}>{currentUser.name[0]}</div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
                <div style={{ display: 'inline-flex', marginTop: 2, padding: '1px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700, background: isAdmin ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', color: isAdmin ? '#f87171' : '#34d399', border: `1px solid ${isAdmin ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` }}>{isAdmin ? 'ADMIN' : 'TEACHER'}</div>
              </div>
            </div>
            <button onClick={() => { signOut(); }} style={{ width: '100%', padding: '6px 0', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", transition: 'all 0.2s' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          {/* Topbar */}
          <div style={{ height: 54, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 12, background: 'rgba(6,9,16,0.9)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>{navItems.find(n => n.id === view)?.icon} {navItems.find(n => n.id === view)?.label}</div>
            <div style={{ flex: 1 }} />
            {(view === 'schedule' || view === 'mySchedule') && (<>
              <span style={{ fontSize: 11, color: '#475569', fontFamily: "'Fira Code'" }}>Week of</span>
              <input type="date" value={weekDate} onChange={e => setWeekDate(e.target.value)} className="auth-input" style={{ width: 148, padding: '6px 10px', fontSize: 12, fontFamily: "'Fira Code'" }} />
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
                { label: 'Total Plots', value: schedules.length, color: '#818cf8' },
                { label: 'Active Teachers', value: teachers.length, color: '#34d399' },
                { label: 'Subjects', value: subjects.length, color: '#f59e0b' },
                { label: 'Holidays This Week', value: weekHolidays.length, color: '#f87171' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '11px 14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Fira Code'" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
            {view === 'dashboard' && isAdmin && <DashboardView teachers={teachers} subjects={subjects} schedules={schedules} pendingTeachers={pendingTeachers} setView={setView} />}
            {view === 'schedule' && <ScheduleGrid subjects={subjects} schedules={schedules} teachers={teachers} currentUser={currentUser} effectiveTid={effectiveTid} setSelectedTeacherId={isAdmin ? setSelectedTeacherId : undefined} dragSubject={dragSubject} setDragSubject={setDragSubject} dragOver={dragOver} setDragOver={setDragOver} handleDrop={handleDrop} removeSchedule={handleRemoveSchedule} weekHolidays={weekHolidays} isAdmin={isAdmin} />}
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
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      ::-webkit-scrollbar{width:5px;height:5px;}
      ::-webkit-scrollbar-track{background:#0a0f1e;}
      ::-webkit-scrollbar-thumb{background:#1e2d4a;border-radius:3px;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
      @keyframes slideRight{from{opacity:0;transform:translateX(-20px);}to{opacity:1;transform:translateX(0);}}
      @keyframes popIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
      @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
      .fade-up{animation:fadeUp 0.45s cubic-bezier(.22,1,.36,1) both;}
      .nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;font-weight:600;font-size:13px;color:#64748b;background:transparent;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
      .nav-item:hover{color:#e2e8f0;background:rgba(255,255,255,0.05);}
      .nav-item.active{color:#818cf8;background:rgba(99,102,241,0.14);border-color:rgba(99,102,241,0.25);}
      .card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;transition:all 0.2s;}
      .card:hover{border-color:rgba(255,255,255,0.12);}
      .auth-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#e2e8f0;padding:11px 14px;font-size:14px;outline:none;transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
      .auth-input:focus{border-color:#6366f1;background:rgba(99,102,241,0.08);box-shadow:0 0 0 3px rgba(99,102,241,0.15);}
      .auth-input::placeholder{color:#334155;}
      .btn-primary{background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border:none;border-radius:10px;color:#fff;padding:11px 22px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 16px rgba(99,102,241,0.35);}
      .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,0.5);}
      .btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
      .grid-cell{transition:background 0.1s;cursor:default;}
      .grid-cell.droppable{cursor:copy;}
      .grid-cell.drag-over{background:rgba(99,102,241,0.18)!important;outline:1.5px solid #6366f1;}
      .sched-pill{position:absolute;left:2px;right:2px;border-radius:6px;padding:3px 6px;font-size:9px;font-weight:700;cursor:pointer;overflow:hidden;z-index:2;transition:filter 0.15s;box-shadow:0 1px 6px rgba(0,0,0,0.4);}
      .sched-pill:hover{filter:brightness(1.2);}
      .subject-drag-card{cursor:grab;user-select:none;transition:transform 0.2s cubic-bezier(.34,1.56,.64,1);}
      .subject-drag-card:hover{transform:translateY(-2px) scale(1.02);}
      .subject-drag-card:active{cursor:grabbing;}
      .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:60;display:flex;align-items:center;justify-content:center;}
      .modal-box{background:#0d1628;border:1px solid rgba(99,102,241,0.25);border-radius:20px;padding:28px;width:460px;max-width:95vw;box-shadow:0 32px 80px rgba(0,0,0,0.7);animation:popIn 0.3s cubic-bezier(.34,1.56,.64,1);}
    `}</style>
  );
}
