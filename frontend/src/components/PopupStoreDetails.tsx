import { useEffect, useRef, useState, type RefObject } from 'react'
import { formatMetricCount } from '../features/popupstore/popupDiscoveryUtils'
import type { PopupStore } from '../types/popupStore'
import { PopupReviews } from './PopupReviews'
import type { Review } from '../api/reviews'

export interface PopupStoreDetailsActions {
  popupStore: PopupStore
  isRouteSelected: boolean
  routeSelectionFull: boolean
  onToggleRoute: (popupStore: PopupStore) => void
  onToggleLike: (popupStore: PopupStore) => void
  isFavorited: boolean
  onToggleFavorite: (popupStore: PopupStore) => void
  visited: boolean
  onConfirmVisit: (popupStore: PopupStore) => void
  onRequireLogin: () => void
  onReviewsChanged: (popupStoreId: number, summary: PopupStore['reviewSummary']) => void
  myReview?: Review
  onViewOnMap: () => void
  onClose: () => void
}

const categoryLabels = {
  FASHION: '패션', BEAUTY: '뷰티', FOOD: '푸드', CHARACTER: '캐릭터',
  LIFESTYLE: '라이프스타일', ETC: '기타',
} as const

const statusLabels = {
  UPCOMING: '운영 예정', OPEN: '운영 중', CLOSED: '운영 종료',
} as const

export function PopupStoreDetailsContent({
  popupStore,
  isRouteSelected,
  routeSelectionFull,
  onToggleRoute,
  onToggleLike,
  isFavorited,
  onToggleFavorite,
  visited,
  onConfirmVisit,
  onRequireLogin,
  onReviewsChanged,
  myReview,
  onViewOnMap,
}: Omit<PopupStoreDetailsActions, 'onClose'>) {
  const [tab, setTab] = useState<'info' | 'hours' | 'intro' | 'reviews'>('info')

  useEffect(() => setTab('info'), [popupStore.id])

  return <>
    <div className={`details-hero category-${popupStore.category?.toLowerCase() ?? 'etc'}`}>
      {popupStore.imageUrl
        ? <img src={popupStore.imageUrl} alt="" />
        : <div><span>{popupStore.category ? categoryLabels[popupStore.category] : '팝업'}</span><b>SEONGSU POP-UP</b></div>}
    </div>
    <div className="details-title">
      <p className="eyebrow">{popupStore.status ? statusLabels[popupStore.status] : '상태 미정'}</p>
      <h2 id={`popup-details-title-${popupStore.id}`}>{popupStore.name}</h2>
      <span>{popupStore.startDate} – {popupStore.endDate}</span>
    </div>
    <div className="details-engagement" aria-label="팝업 참여 지표">
      <span>조회 {formatMetricCount(popupStore.engagement.viewCount)}</span>
      <span>좋아요 {formatMetricCount(popupStore.engagement.likeCount)}</span>
      <span>일정 {formatMetricCount(popupStore.engagement.planAddCount)}</span>
      <span>평점 {popupStore.reviewSummary.averageRating.toFixed(1)} · 리뷰 {popupStore.reviewSummary.reviewCount}</span>
    </div>
    <div className="details-tabs" role="tablist" aria-label="상세정보 항목">
      {([['info', '정보'], ['hours', '운영시간'], ['intro', '소개'], ['reviews', '후기']] as const).map(([value, label]) =>
        <button key={value} type="button" role="tab" aria-selected={tab === value}
          onClick={() => setTab(value)}>{label}</button>)}
    </div>
    <div className="details-tab-content" role="tabpanel">
      {tab === 'info' && <dl><div><dt>카테고리</dt><dd>{popupStore.category ? categoryLabels[popupStore.category] : '미지정'}</dd></div>
        <div><dt>전체 주소</dt><dd>{popupStore.address}</dd></div></dl>}
      {tab === 'hours' && <p className="details-empty">등록된 운영시간 정보가 없습니다.</p>}
      {tab === 'intro' && <p>{popupStore.description || '등록된 팝업스토어 소개가 없습니다.'}</p>}
      {tab === 'reviews' && <PopupReviews popupStoreId={popupStore.id} initialSummary={popupStore.reviewSummary}
        visited={visited} onRequireLogin={onRequireLogin}
        myReview={myReview} onChanged={(summary) => onReviewsChanged(popupStore.id, summary)} />}
    </div>
    <div className="details-actions">
      <button type="button" className={`details-like${popupStore.engagement.likedByCurrentVisitor ? ' liked' : ''}`}
        aria-label={`${popupStore.name} ${popupStore.engagement.likedByCurrentVisitor ? '좋아요 취소' : '좋아요'}`}
        onClick={() => onToggleLike(popupStore)}>{popupStore.engagement.likedByCurrentVisitor ? '♥ 좋아요 취소' : '♡ 좋아요'}</button>
      <button type="button" className={`details-favorite${isFavorited ? ' favorited' : ''}`}
        aria-label={`${popupStore.name} ${isFavorited ? '즐겨찾기 해제' : '즐겨찾기'}`}
        onClick={() => onToggleFavorite(popupStore)}>{isFavorited ? '🔖 저장됨' : '♧ 즐겨찾기'}</button>
      <button type="button" className={visited ? 'visit-confirmed' : ''} onClick={() => onConfirmVisit(popupStore)}>
        {visited ? '✓ 방문 완료' : '방문 완료 기록'}</button>
      <button type="button" onClick={onViewOnMap}>지도에서 위치 보기</button>
      <button type="button" className="add-route-button" disabled={!isRouteSelected && routeSelectionFull}
        onClick={() => onToggleRoute(popupStore)}>{isRouteSelected ? '오늘 일정에서 제거' : '오늘 일정에 추가'}</button>
    </div>
  </>
}

export function HomepagePopupDetailsModal(props: PopupStoreDetailsActions) {
  const dialogRef = useRef<HTMLElement>(null)
  useDialogKeyboard(dialogRef, props.onClose, true)

  return <div className="home-details-backdrop" onPointerDown={(event) => {
    if (event.target === event.currentTarget) props.onClose()
  }}>
    <section ref={dialogRef} className="home-details-modal" role="dialog" aria-modal="true"
      aria-labelledby={`popup-details-title-${props.popupStore.id}`} tabIndex={-1}>
      <button type="button" className="close-button" onClick={props.onClose} aria-label="팝업 상세 닫기">×</button>
      <PopupStoreDetailsContent {...props} />
    </section>
  </div>
}

export function MapPopupDetailsDrawer(props: PopupStoreDetailsActions) {
  const [sheetSize, setSheetSize] = useState<'compact' | 'medium' | 'expanded'>('medium')
  const dragStartY = useRef<number | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  useDialogKeyboard(panelRef, props.onClose, false)

  useEffect(() => setSheetSize('medium'), [props.popupStore.id])

  const resizeSheet = (direction: 'up' | 'down') => {
    const sizes = ['compact', 'medium', 'expanded'] as const
    const index = sizes.indexOf(sheetSize)
    setSheetSize(sizes[Math.max(0, Math.min(sizes.length - 1, index + (direction === 'up' ? 1 : -1)))])
  }

  return <aside ref={panelRef} className={`details-panel map-details-drawer bottom-sheet ${sheetSize}`}
    role="dialog" aria-modal="true" aria-labelledby={`popup-details-title-${props.popupStore.id}`} tabIndex={-1}>
    <button type="button" className="sheet-handle"
      aria-label={sheetSize === 'expanded' ? '상세정보 축소' : '상세정보 확장'}
      onClick={() => resizeSheet(sheetSize === 'expanded' ? 'down' : 'up')}
      onPointerDown={(event) => { dragStartY.current = event.clientY }}
      onPointerUp={(event) => {
        if (dragStartY.current == null) return
        if (dragStartY.current - event.clientY > 20) resizeSheet('up')
        if (event.clientY - dragStartY.current > 20) resizeSheet('down')
        dragStartY.current = null
      }}><span /></button>
    <button type="button" className="close-button" onClick={props.onClose} aria-label="지도 상세 닫기">×</button>
    <PopupStoreDetailsContent {...props} />
  </aside>
}

function useDialogKeyboard(
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  lockScroll: boolean,
) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    if (lockScroll) document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => dialogRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )]
      if (focusable.length === 0) { event.preventDefault(); dialogRef.current.focus(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (lockScroll) document.body.style.overflow = previousOverflow
      returnFocus?.focus()
    }
  }, [dialogRef, lockScroll])
}
