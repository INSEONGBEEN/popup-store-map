import axios from 'axios'
import { getAccessToken, refreshAccessTokenOnce, setAccessToken } from '../features/auth/authSession'

export const httpClient = axios.create({
  // The browser always calls its current origin. Vite proxies /api in development.
  baseURL: '/',
  timeout: 10_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

httpClient.interceptors.response.use(undefined, async (error) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
    return Promise.reject(error)
  }
  const config = error.config as typeof error.config & { _authRetried?: boolean }
  const url = config.url ?? ''
  if (config._authRetried || ['/api/auth/login', '/api/auth/signup', '/api/auth/refresh'].includes(url)) {
    return Promise.reject(error)
  }
  config._authRetried = true
  const token = await refreshAccessTokenOnce()
  if (!token) {
    setAccessToken(null)
    return Promise.reject(error)
  }
  config.headers.Authorization = `Bearer ${token}`
  return httpClient.request(config)
})

if (import.meta.env?.DEV) {
  httpClient.interceptors.request.use((config) => {
    console.debug('[api-request]', JSON.stringify({
      origin: window.location.origin,
      method: config.method?.toUpperCase(),
      url: config.url,
    }))
    return config
  })
  httpClient.interceptors.response.use(
    (response) => {
      console.debug('[api-response]', JSON.stringify({
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        contentType: response.headers['content-type'],
      }))
      return response
    },
    (error) => {
      if (axios.isAxiosError(error) && !axios.isCancel(error)) {
        console.debug('[api-error]', JSON.stringify({
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          status: error.response?.status ?? null,
          contentType: error.response?.headers?.['content-type'] ?? null,
          kind: error.code === 'ERR_NETWORK' ? 'network' : 'http',
        }))
      }
      return Promise.reject(error)
    },
  )
}
