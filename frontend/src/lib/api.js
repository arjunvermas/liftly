import axios from 'axios'

const AUTH_TOKEN_KEY = 'auth_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => {
    if (response.data?.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token)
    }
    return response
  },
  (error) => {
    if (error.config?.url?.endsWith('/auth/logout')) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
    return Promise.reject(error)
  }
)

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export default api
