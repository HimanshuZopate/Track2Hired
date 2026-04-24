import axios from 'axios'

// ─── Token key ────────────────────────────────────────────────────────────────
// Stored in sessionStorage so it is automatically cleared when the tab/browser
// is closed or the page is refreshed — session-only authentication.
const AUTH_TOKEN_KEY = 'track2hired_token'

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/',
  timeout: 15000,
})

// ─── JWT helpers ──────────────────────────────────────────────────────────────
const isLikelyJwt = (value) =>
  typeof value === 'string' && value.startsWith('eyJ') && value.split('.').length === 3

const isJwtActive = (token) => {
  if (!isLikelyJwt(token)) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = Number(payload?.exp || 0)
    // No exp claim → treat as non-expiring (server controls it)
    if (!exp) return true
    return Date.now() < exp * 1000
  } catch {
    return false
  }
}

// ─── Public token API ─────────────────────────────────────────────────────────

/**
 * Returns the active JWT from sessionStorage, or null if absent / expired.
 * Uses ONLY sessionStorage — nothing persists across tabs or page refreshes.
 */
export const getAuthToken = () => {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
  if (!token) return null

  if (isJwtActive(token)) return token

  // Token present but expired — clear it immediately
  clearAuthToken()
  return null
}

/**
 * Stores the JWT in sessionStorage (session-scoped, cleared on refresh/close).
 * Also clears any legacy localStorage token so old persistent sessions are
 * invalidated the first time a user visits after this update.
 */
export const setAuthToken = (token) => {
  if (!token) return
  // Remove any legacy localStorage token on the first login after migration
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem('token')
  sessionStorage.setItem(AUTH_TOKEN_KEY, token)
}

/**
 * Removes the JWT from sessionStorage and clears any localStorage remnants.
 */
export const clearAuthToken = () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  // Belt-and-suspenders: remove legacy keys so old persistent sessions die
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem('token')
}

// ─── Dashboard API shortcuts ──────────────────────────────────────────────────
export const dashboardApi = {
  getProfile:         () => api.get('/api/users/profile'),
  getStreak:          () => api.get('/api/streak'),
  getStreakDashboard: () => api.get('/api/streak/dashboard'),
  getStreakHeatmap:   () => api.get('/api/streak/heatmap'),
  getLeaderboard:     () => api.get('/api/leaderboard'),
  getStreakNotifications: () => api.get('/api/streak/notifications'),
  getStreakSuggestions:   () => api.get('/api/streak/suggestions'),
  getReadiness:       () => api.get('/api/readiness'),
  getSkills:          () => api.get('/api/skills'),
  getTasks:           () => api.get('/api/tasks'),
  getAnalyticsSummary:    () => api.get('/api/analytics/summary'),
  getAnalyticsSkills:     () => api.get('/api/analytics/skills'),
  getReadinessTrend:      (days = 30) => api.get(`/api/analytics/readiness-trend?days=${days}`),
  getAnalyticsPerformance:() => api.get('/api/analytics/performance'),
  getAnalyticsSuggestions:() => api.get('/api/analytics/suggestions'),
  getSuggestions:         () => api.get('/api/suggestions'),
  getTodaySuggestion:     () => api.get('/api/suggestions/today'),
  getTrends:              () => api.get('/api/analytics/trends'),
  getStreakHistory:        () => api.get('/api/streak/history'),
}

// ─── Practice API shortcuts (DB Driven) ───────────────────────────────────────
export const practiceApi = {
  searchTopics:       (query) => api.get(`/api/topics/search?q=${encodeURIComponent(query)}`),
  getTopics:          () => api.get('/api/topics'),
  generateQuestions:  (data) => api.post('/api/questions/generate', data),
  attemptQuestion:    (data) => api.post('/api/questions/attempt', data),
  validateAnswer:     (data) => api.post('/api/questions/attempt', data),
  getStats:           () => api.get('/api/questions/stats'),
}

export const resumeApi = {
  getWorkspace: () => api.get('/api/resume/workspace'),
  getTemplates: () => api.get('/api/resume/templates'),
  saveProfile: (data) => api.post('/api/resume/profile', data),
  generateResume: (data) => api.post('/api/resume/generate', data),
  analyzeResume: (data, config = {}) => api.post('/api/resume/analyze', data, config),
  downloadResume: (id) => api.get(`/api/resume/download/${id}`),
}

// ─── Request interceptor — attach Bearer token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor — handle 401 (expired / invalid token) ──────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthToken()
      const isAuthRoute = ['/login', '/register'].includes(window.location.pathname)
      if (!isAuthRoute) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
