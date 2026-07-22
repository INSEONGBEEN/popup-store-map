import axios from 'axios'

export const httpClient = axios.create({
  // The browser always calls its current origin. Vite proxies /api in development.
  baseURL: '/',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
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
