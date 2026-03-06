// src/api.js — Central API module
// All communication with the backend goes through here.
// Import individual functions in your components as needed.
//
// Usage example:
//   import { login, getSchedules, plotSchedule } from '../api.js';

const BASE = import.meta.env.VITE_API_URL || '';

// ── Helper ────────────────────────────────────────────────────
async function request(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    // Throw the server's error message so components can display it
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────

/** Register a new teacher account (pending approval) */
export function register(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Log in and receive a JWT token + user object */
export function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** Get the current logged-in user's data (validates token) */
export function getMe(token) {
  return request('/api/auth/me', {}, token);
}

// ── Teachers ──────────────────────────────────────────────────

/** Get all approved teachers */
export function getTeachers(token) {
  return request('/api/teachers', {}, token);
}

/** Get pending (unapproved) teacher registrations — admin only */
export function getPendingTeachers(token) {
  return request('/api/teachers/pending', {}, token);
}

/** Admin registers a teacher directly (auto-approved) */
export function addTeacher(token, payload) {
  return request('/api/teachers', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

/** Approve a pending teacher — admin only */
export function approveTeacher(token, id) {
  return request(`/api/teachers/${id}/approve`, { method: 'PATCH' }, token);
}

/** Update a teacher's details — admin only */
export function updateTeacher(token, id, payload) {
  return request(`/api/teachers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token);
}

/** Remove a teacher — admin only */
export function removeTeacher(token, id) {
  return request(`/api/teachers/${id}`, { method: 'DELETE' }, token);
}

// ── Schedules ─────────────────────────────────────────────────

/**
 * Get schedules.
 * Admin → all teachers' schedules.
 * Teacher → only their own schedules.
 */
export function getSchedules(token) {
  return request('/api/schedules', {}, token);
}

/** Get one specific teacher's schedule (for "view all" mode) */
export function getTeacherSchedule(token, teacherId) {
  return request(`/api/schedules/teacher/${teacherId}`, {}, token);
}

/**
 * Plot (create) a new schedule entry.
 * Backend validates conflicts and max load.
 */
export function plotSchedule(token, payload) {
  return request('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

/** Remove a schedule entry */
export function removeSchedule(token, id) {
  return request(`/api/schedules/${id}`, { method: 'DELETE' }, token);
}

// ── Subjects ──────────────────────────────────────────────────

/** Get all subjects */
export function getSubjects(token) {
  return request('/api/subjects', {}, token);
}

/** Add a new subject — admin only */
export function addSubject(token, payload) {
  return request('/api/subjects', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

/** Remove a subject — admin only */
export function removeSubject(token, id) {
  return request(`/api/subjects/${id}`, { method: 'DELETE' }, token);
}

// ── Holidays ──────────────────────────────────────────────────

/** Get all PH holidays */
export function getHolidays(token) {
  return request('/api/holidays', {}, token);
}

/** Add a holiday — admin only */
export function addHoliday(token, payload) {
  return request('/api/holidays', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

/** Remove a holiday — admin only */
export function removeHoliday(token, id) {
  return request(`/api/holidays/${id}`, { method: 'DELETE' }, token);
}
