const VISITOR_KEY = 'popup-store-map.visitor-id'
const SESSION_KEY = 'popup-store-map.session-id'

function createAnonymousId() {
  return globalThis.crypto?.randomUUID?.() ?? `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getOrCreate(storage: Storage, key: string) {
  const existing = storage.getItem(key)
  if (existing) return existing
  const value = createAnonymousId()
  storage.setItem(key, value)
  return value
}

export function getEngagementIdentity() {
  return {
    anonymousVisitorId: getOrCreate(window.localStorage, VISITOR_KEY),
    sessionId: getOrCreate(window.sessionStorage, SESSION_KEY),
  }
}
