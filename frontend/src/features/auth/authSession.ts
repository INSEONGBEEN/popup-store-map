let accessToken: string | null = null
let refreshHandler: (() => Promise<string | null>) | null = null
let refreshFlight: Promise<string | null> | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null) {
  refreshHandler = handler
}

export function refreshAccessTokenOnce() {
  if (!refreshHandler) return Promise.resolve(null)
  if (!refreshFlight) {
    refreshFlight = refreshHandler().finally(() => { refreshFlight = null })
  }
  return refreshFlight
}

export function resetAuthSessionForTest() {
  accessToken = null
  refreshHandler = null
  refreshFlight = null
}
