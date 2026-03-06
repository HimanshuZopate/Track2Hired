import axios from 'axios'

const AUTH_TOKEN_KEY = 'track2hired_token'

const api = axios.create({
  baseURL: '/',
  timeout: 15000,
})

const isLikelyJwt = (value) =>
  typeof value === 'string' && value.startsWith('eyJ') && value.split('.').length === 3

const extractTokenDeep = (input) => {
  if (!input) return null

  if (typeof input === 'string') {
    if (isLikelyJwt(input)) return input
    try {
      return extractTokenDeep(JSON.parse(input))
    } catch {
      return null
    }
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const token = extractTokenDeep(item)
      if (token) return token
    }
    return null
  }

  if (typeof input === 'object') {
    const direct = input.token || input.jwt || input.authToken || input.accessToken
    if (direct && isLikelyJwt(direct)) return direct

    for (const value of Object.values(input)) {
      const token = extractTokenDeep(value)
      if (token) return token
    }
  }

  return null
}

export const getAuthToken = () => {
  const primary = localStorage.getItem(AUTH_TOKEN_KEY)
  if (primary) return primary

  const stores = [localStorage, sessionStorage]

  for (const store of stores) {
    const directKeys = ['token', 'jwt', 'authToken', 'accessToken']
    for (const key of directKeys) {
      const value = store.getItem(key)
      if (value) return value
    }

    const objectKeys = ['user', 'userInfo', 'auth']
    for (const key of objectKeys) {
      const raw = store.getItem(key)
      if (!raw) continue

      const token = extractTokenDeep(raw)
      if (token) return token
    }

    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i)
      if (!key) continue

      const raw = store.getItem(key)
      if (!raw) continue

      const token = extractTokenDeep(raw)
      if (token) return token
    }
  }

  return null
}

export const setAuthToken = (token) => {
  if (!token) return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
