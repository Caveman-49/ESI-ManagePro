// ── API Helper ──────────────────────────────────────────────
// Centralized fetch calls to the Express backend API.
// In dev mode, Vite proxies /api to http://localhost:3001

const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const res = await fetch(BASE + path, {
    headers,
    ...options
  });

  // Si 401, le token a expire -> deconnexion
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/';
    throw new Error('Session expiree. Veuillez vous reconnecter.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur reseau' }));
    throw new Error(err.error || 'HTTP ' + res.status);
  }
  return res.json();
}

const api = {
  // ── Auth ──
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  checkSession: () => request('/auth/me'),

  // ── Academic Years ──
  getAcademicYears: () => request('/academic-years'),

  // ── Dashboard ──
  getDashboardStats: () => request('/dashboard/stats'),
  getTodaySchedule: () => request('/dashboard/today-schedule'),
  getClassPerformance: () => request('/dashboard/class-performance'),
  getEvalStats: () => request('/dashboard/eval-stats'),

  // ── Classes ──
  getClasses: () => request('/classes'),
  createClass: (data) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id, data) => request('/classes/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id) => request('/classes/' + id, { method: 'DELETE' }),

  // ── Professors ──
  getProfessors: () => request('/professors'),
  createProfessor: (data) => request('/professors', { method: 'POST', body: JSON.stringify(data) }),
  updateProfessor: (id, data) => request('/professors/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProfessor: (id) => request('/professors/' + id, { method: 'DELETE' }),

  // ── Rooms ──
  getRooms: () => request('/rooms'),
  createRoom: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id, data) => request('/rooms/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id) => request('/rooms/' + id, { method: 'DELETE' }),

  // ── Modules ──
  getModules: () => request('/modules'),
  createModule: (data) => request('/modules', { method: 'POST', body: JSON.stringify(data) }),
  updateModule: (id, data) => request('/modules/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteModule: (id) => request('/modules/' + id, { method: 'DELETE' }),
  recalcModuleProgress: () => request('/modules/recalc-progress', { method: 'POST' }),

  // ── Evaluations ──
  getEvaluations: () => request('/evaluations'),
  createEvaluation: (data) => request('/evaluations', { method: 'POST', body: JSON.stringify(data) }),
  updateEvaluation: (id, data) => request('/evaluations/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  updateEvaluationStatus: (id, status) => request('/evaluations/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteEvaluation: (id) => request('/evaluations/' + id, { method: 'DELETE' }),

  // ── Timetables ──
  getTimetables: () => request('/timetables'),
  createTimetable: (data) => request('/timetables', { method: 'POST', body: JSON.stringify(data) }),
  updateTimetable: (id, data) => request('/timetables/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimetable: (id) => request('/timetables/' + id, { method: 'DELETE' }),
};

export default api;
