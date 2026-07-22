import { createContext, useContext } from 'react'
import type { AuthUser, LoginInput, SignupInput } from '../../api/auth'

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  authStatus: AuthStatus
  isAuthenticated: boolean
  login: (input: Omit<LoginInput, 'anonymousVisitorId'>) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
