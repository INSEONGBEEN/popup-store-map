import { httpClient } from './httpClient'

export interface AuthUser {
  id: number
  email: string
  nickname: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

export interface SignupInput {
  email: string
  password: string
  nickname: string
}

export interface LoginInput {
  email: string
  password: string
  anonymousVisitorId?: string
}

export async function signup(input: SignupInput) {
  return (await httpClient.post<AuthUser>('/api/auth/signup', input)).data
}

export async function login(input: LoginInput) {
  return (await httpClient.post<AuthResponse>('/api/auth/login', input)).data
}

export async function refreshSession() {
  return (await httpClient.post<AuthResponse>('/api/auth/refresh')).data
}

export async function logout() {
  await httpClient.post('/api/auth/logout')
}

export async function getMe() {
  return (await httpClient.get<AuthUser>('/api/auth/me')).data
}
