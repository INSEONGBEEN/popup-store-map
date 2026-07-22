import { useEffect, useRef, useState } from 'react'
import type { FavoriteItem } from '../api/favorites'
import type { AuthUser } from '../api/auth'
import type { PopupStore } from '../types/popupStore'
import type { VisitItem } from '../api/visits'

interface Props {
  open: boolean
  user: AuthUser | null
  favorites: FavoriteItem[]
  isLoading: boolean
  visits: VisitItem[]
  visitsLoading: boolean
  onClose: () => void
  onOpenDetails: (store: PopupStore) => void
  onRemoveFavorite: (store: PopupStore) => void
  onAddToSchedule: (store: PopupStore) => void
  onLogout: () => void
}

export function MyPageDrawer(props: Props) {
  const [tab, setTab] = useState<'favorites' | 'visits'>('favorites')
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef(props.onClose)
  closeRef.current = props.onClose

  useEffect(() => {
    if (!props.open) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKeyDown)
    window.requestAnimationFrame(() => panelRef.current?.focus())
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [props.open])

  if (!props.open || !props.user) return null
  return <div className="mypage-backdrop" onPointerDown={(event) => {
    if (event.target === event.currentTarget) props.onClose()
  }}>
    <aside ref={panelRef} className="mypage-drawer" role="dialog" aria-modal="true" aria-labelledby="mypage-title" tabIndex={-1}>
      <button type="button" className="auth-close" onClick={props.onClose} aria-label="마이페이지 닫기">×</button>
      <p className="eyebrow">MY SEONGSU</p><h2 id="mypage-title">{props.user.nickname}님의 저장 목록</h2>
      <section className="mypage-profile"><span>{props.user.email}</span><small>가입일 {props.user.createdAt.slice(0, 10)}</small></section>
      <nav className="mypage-tabs" aria-label="마이페이지 메뉴"><button type="button" className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}>즐겨찾기</button>
        <button type="button" className={tab === 'visits' ? 'active' : ''} onClick={() => setTab('visits')}>방문 기록</button><button type="button" disabled>내 리뷰</button></nav>
      {tab === 'favorites' && <section className="mypage-content" aria-label="즐겨찾기 목록">
        {props.isLoading ? <p className="mypage-empty">즐겨찾기를 불러오는 중입니다…</p> : props.favorites.length === 0
          ? <p className="mypage-empty">저장한 팝업이 없습니다.<br />카드의 북마크 버튼으로 관심 팝업을 모아보세요.</p>
          : <ul>{props.favorites.map(({ popupStore }) => <li key={popupStore.id}>
            <button type="button" className="mypage-favorite-main" onClick={() => props.onOpenDetails(popupStore)}>
              <strong>{popupStore.name}</strong><span>{popupStore.address}</span></button>
            <div><button type="button" onClick={() => props.onAddToSchedule(popupStore)}>+ 일정</button>
              <button type="button" onClick={() => props.onRemoveFavorite(popupStore)} aria-label={`${popupStore.name} 즐겨찾기 해제`}>해제</button></div>
          </li>)}</ul>}
      </section>}
      {tab === 'visits' && <section className="mypage-content" aria-label="방문 기록 목록">
        {props.visitsLoading ? <p className="mypage-empty">방문 기록을 불러오는 중입니다…</p> : props.visits.length === 0
          ? <p className="mypage-empty">아직 방문 기록이 없습니다.<br />길안내 도착 또는 상세의 방문 완료로 기록할 수 있어요.</p>
          : <ul>{props.visits.map((visit) => <li key={visit.id}>
            <button type="button" className="mypage-favorite-main" onClick={() => props.onOpenDetails(visit.popupStore)}>
              <strong>{visit.popupStore.name}</strong><span>{visit.visitDate} · {visit.source === 'NAVIGATION_ARRIVAL' ? '길안내 도착' : '직접 완료'}</span></button>
            <div><button type="button" onClick={() => props.onAddToSchedule(visit.popupStore)}>다시 일정</button></div>
          </li>)}</ul>}
      </section>}
      <button type="button" className="mypage-logout" onClick={props.onLogout}>로그아웃</button>
    </aside>
  </div>
}
