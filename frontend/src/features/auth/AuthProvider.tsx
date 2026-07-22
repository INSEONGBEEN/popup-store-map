import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../../api/auth'
import type { AuthUser, LoginInput, SignupInput } from '../../api/auth'
import { getEngagementIdentity } from '../engagement/visitorIdentity'
import { refreshAccessTokenOnce, setAccessToken, setRefreshHandler } from './authSession'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')

  const applySession = useCallback((session: authApi.AuthResponse | null) => {
    const nextToken = session?.accessToken ?? null
    setAccessToken(nextToken)
    setToken(nextToken)
    setUser(session?.user ?? null)
    setAuthStatus(session ? 'authenticated' : 'anonymous')
    return nextToken
  }, [])

  const refresh = useCallback(async () => {
    try {
      return applySession(await authApi.refreshSession())
    } catch {
      return applySession(null)
    }
  }, [applySession])

  useEffect(() => {
    setRefreshHandler(refresh)
    void refreshAccessTokenOnce()
    return () => setRefreshHandler(null)
  }, [refresh])

  const login = useCallback(async (input: Omit<LoginInput, 'anonymousVisitorId'>) => {
    const identity = getEngagementIdentity()
    applySession(await authApi.login({ ...input, anonymousVisitorId: identity.anonymousVisitorId }))
  }, [applySession])

  const signup = useCallback(async (input: SignupInput) => {
    await authApi.signup(input)
    await login({ email: input.email, password: input.password })
  }, [login])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      applySession(null)
    }
  }, [applySession])

  const value = useMemo<AuthContextValue>(() => ({
    user, accessToken: token, authStatus, isAuthenticated: authStatus === 'authenticated',
    login, signup, logout, refresh,
  }), [authStatus, login, logout, refresh, signup, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
