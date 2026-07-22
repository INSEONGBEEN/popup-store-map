import axios from 'axios'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../features/auth/authContext'

type AuthMode = 'login' | 'signup'

interface Props {
  open: boolean
  initialMode?: AuthMode
  onClose: () => void
}

interface ApiError { message?: string }

export function AuthModal({ open, initialMode = 'login', onClose }: Props) {
  const auth = useAuth()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const submittingRef = useRef(submitting)
  onCloseRef.current = onClose
  submittingRef.current = submitting

  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement as HTMLElement | null
    setMode(initialMode)
    setError(null)
    window.setTimeout(() => emailRef.current?.focus(), 0)
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submittingRef.current) onCloseRef.current()
    }
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('keydown', closeEscape)
      returnFocusRef.current?.focus()
    }
  }, [initialMode, open])

  if (!open) return null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const normalizedEmail = email.trim()
    if (!normalizedEmail || password.length < 8) {
      setError('이메일과 8자 이상의 비밀번호를 확인해 주세요.')
      return
    }
    if (mode === 'signup' && (nickname.trim().length < 2 || password !== confirmPassword)) {
      setError(password !== confirmPassword ? '비밀번호 확인이 일치하지 않습니다.' : '닉네임은 2자 이상 입력해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'signup') await auth.signup({ email: normalizedEmail, nickname: nickname.trim(), password })
      else await auth.login({ email: normalizedEmail, password })
      onClose()
    } catch (caught) {
      const message = axios.isAxiosError<ApiError>(caught) ? caught.response?.data?.message : null
      setError(message ?? '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const changeMode = (next: AuthMode) => {
    setMode(next); setError(null); setPassword(''); setConfirmPassword('')
  }

  return <div className="auth-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !submitting) onClose()
  }}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button type="button" className="auth-close" onClick={onClose} disabled={submitting} aria-label="로그인 창 닫기">×</button>
      <p className="eyebrow">MEMBER</p>
      <h2 id="auth-title">{mode === 'login' ? '다시 만나 반가워요' : '성수 팝업 산책을 시작해요'}</h2>
      <p className="auth-lead">로그인하면 즐겨찾기, 방문 기록과 리뷰를 여러 기기에서 이어갈 수 있어요.</p>
      <div className="auth-mode-tabs" role="tablist" aria-label="인증 방식">
        <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => changeMode('login')}>로그인</button>
        <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => changeMode('signup')}>회원가입</button>
      </div>
      <form onSubmit={submit}>
        <label>이메일<input ref={emailRef} type="email" value={email} onChange={(event) => setEmail(event.target.value)}
          autoComplete={mode === 'login' ? 'email' : 'username'} required maxLength={254} /></label>
        {mode === 'signup' && <label>닉네임<input value={nickname} onChange={(event) => setNickname(event.target.value)}
          autoComplete="nickname" required minLength={2} maxLength={20} /></label>}
        <label>비밀번호<span className="password-field"><input type={showPassword ? 'text' : 'password'} value={password}
          onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required minLength={8} maxLength={72} /><button type="button" onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>{showPassword ? '숨김' : '보기'}</button></span></label>
        {mode === 'signup' && <label>비밀번호 확인<input type={showPassword ? 'text' : 'password'} value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} maxLength={72} /></label>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? '처리 중…' : mode === 'login' ? '로그인' : '가입하고 로그인'}</button>
      </form>
    </section>
  </div>
}
