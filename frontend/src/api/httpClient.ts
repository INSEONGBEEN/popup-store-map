import axios from 'axios'

export const httpClient = axios.create({
  // The browser always calls its current origin. Vite proxies /api in development.
  baseURL: '/',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})
