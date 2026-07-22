import { memo, useEffect, useRef, useState } from 'react'
import type { PopupStore } from '../types/popupStore'
import { FloatingSearch } from './FloatingSearch'
import type { AuthStatus } from '../features/auth/authContext'
import type { AuthUser } from '../api/auth'

interface Props {
  popupStores: PopupStore[]
  draftQuery: string
  scheduleCount: number
  theme: 'light' | 'dark'
  onDraftQueryChange: (query: string) => void
  onSearch: (query: string) => void
  onSelect: (store: PopupStore) => void
  onCategory: (category: string) => void
  onHome: () => void
  onOpenSchedule: () => void
  onOptimize: () => void
  onToggleTheme: () => void
  authStatus: AuthStatus
  user: AuthUser | null
  onOpenAuth: (mode: 'login' | 'signup') => void
  onLogout: () => void
}

export const IntegratedHeader = memo(function IntegratedHeader(props: Props) {
  const [openMenu, setOpenMenu] = useState<'profile' | 'menu' | null>(null)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenMenu(null)
    }
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenMenu(null) }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [])

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setOpenMenu(null)
  }

  return <header className="integrated-header" ref={rootRef}>
    <button type="button" className="brand-lockup" onClick={props.onHome} aria-label="성수팝 홈 상단으로 이동">
      <strong>SEONGSU<span>POP</span></strong><small>POP-UP WALK GUIDE</small>
    </button>
    <FloatingSearch popupStores={props.popupStores} draftQuery={props.draftQuery}
      onDraftQueryChange={props.onDraftQueryChange} onSearch={props.onSearch}
      onSelect={props.onSelect} onCategory={props.onCategory} />
    <div className="header-actions">
      <button type="button" className="header-icon" aria-label="마이페이지 메뉴" aria-expanded={openMenu === 'profile'}
        onClick={() => setOpenMenu((current) => current === 'profile' ? null : 'profile')}><span aria-hidden="true">♙</span></button>
      <button type="button" className="header-icon" aria-label="바로가기 메뉴" aria-expanded={openMenu === 'menu'}
        onClick={() => setOpenMenu((current) => current === 'menu' ? null : 'menu')}><span aria-hidden="true">☰</span></button>
    </div>
    {openMenu === 'profile' && <div className="header-popover profile-popover" role="menu">
      <strong>{props.user ? `${props.user.nickname}님` : '마이페이지'}</strong>
      {props.authStatus === 'checking' ? <p>로그인 상태를 확인하고 있습니다…</p> : props.user ? <>
        <p>{props.user.email}</p>
        {['즐겨찾기', '방문 기록', '내 리뷰'].map((label) => <button key={label} type="button" disabled>{label}<small>다음 단계</small></button>)}
        <button type="button" onClick={() => { props.onLogout(); setOpenMenu(null) }}>로그아웃</button>
      </> : <>
        <p>로그인하면 즐겨찾기와 방문 기록을 이용할 수 있어요.</p>
        <button type="button" onClick={() => { props.onOpenAuth('login'); setOpenMenu(null) }}>로그인</button>
        <button type="button" onClick={() => { props.onOpenAuth('signup'); setOpenMenu(null) }}>회원가입</button>
      </>}
      <button type="button" onClick={() => { props.onToggleTheme(); setOpenMenu(null) }}>화면 테마<small>{props.theme === 'light' ? '다크 모드' : '라이트 모드'}로</small></button>
    </div>}
    {openMenu === 'menu' && <div className="header-popover mega-menu" role="menu">
      <section><strong>팝업 둘러보기</strong>
        <button type="button" onClick={() => jump('featured-popups')}>주목할 팝업</button>
        <button type="button" onClick={() => jump('open-popups')}>오늘 운영</button>
        <button type="button" onClick={() => jump('upcoming-popups')}>오픈 예정</button>
        <button type="button" onClick={() => jump('explore-map')}>내 주변·지도</button></section>
      <section><strong>방문 준비</strong>
        <button type="button" onClick={() => { props.onOpenSchedule(); setOpenMenu(null) }}>오늘 방문할 곳 <em>{props.scheduleCount}</em></button>
        <button type="button" disabled={props.scheduleCount < 2} onClick={() => { props.onOptimize(); setOpenMenu(null) }}>최적 동선 확인</button></section>
      <section><strong>서비스</strong><button type="button" disabled>팝업 등록 <small>준비 중</small></button>
        <button type="button" onClick={() => jump('service-guide')}>서비스 소개</button></section>
    </div>}
  </header>
})
