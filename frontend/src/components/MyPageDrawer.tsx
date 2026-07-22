import { useEffect, useRef } from 'react'
import type { FavoriteItem } from '../api/favorites'
import type { AuthUser } from '../api/auth'
import type { PopupStore } from '../types/popupStore'

interface Props {
  open: boolean
  user: AuthUser | null
  favorites: FavoriteItem[]
  isLoading: boolean
  onClose: () => void
  onOpenDetails: (store: PopupStore) => void
  onRemoveFavorite: (store: PopupStore) => void
  onAddToSchedule: (store: PopupStore) => void
  onLogout: () => void
}

export function MyPageDrawer(props: Props) {
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
      <nav className="mypage-tabs" aria-label="마이페이지 메뉴"><button type="button" className="active">즐겨찾기</button>
        <button type="button" disabled>방문 기록</button><button type="button" disabled>내 리뷰</button></nav>
      <section className="mypage-content" aria-label="즐겨찾기 목록">
        {props.isLoading ? <p className="mypage-empty">즐겨찾기를 불러오는 중입니다…</p> : props.favorites.length === 0
          ? <p className="mypage-empty">저장한 팝업이 없습니다.<br />카드의 북마크 버튼으로 관심 팝업을 모아보세요.</p>
          : <ul>{props.favorites.map(({ popupStore }) => <li key={popupStore.id}>
            <button type="button" className="mypage-favorite-main" onClick={() => props.onOpenDetails(popupStore)}>
              <strong>{popupStore.name}</strong><span>{popupStore.address}</span></button>
            <div><button type="button" onClick={() => props.onAddToSchedule(popupStore)}>+ 일정</button>
              <button type="button" onClick={() => props.onRemoveFavorite(popupStore)} aria-label={`${popupStore.name} 즐겨찾기 해제`}>해제</button></div>
          </li>)}</ul>}
      </section>
      <button type="button" className="mypage-logout" onClick={props.onLogout}>로그아웃</button>
    </aside>
  </div>
}
