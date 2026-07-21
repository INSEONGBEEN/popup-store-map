import type { PopupStore } from '../types/popupStore'

interface PopupStoreDetailsProps {
  popupStore: PopupStore
  onClose: () => void
}

const categoryLabels = {
  FASHION: '패션', BEAUTY: '뷰티', FOOD: '푸드', CHARACTER: '캐릭터',
  LIFESTYLE: '라이프스타일', ETC: '기타',
} as const

const statusLabels = {
  UPCOMING: '운영 예정', OPEN: '운영 중', CLOSED: '운영 종료',
} as const

export function PopupStoreDetails({ popupStore, onClose }: PopupStoreDetailsProps) {
  return (
    <aside className="details-panel" aria-live="polite">
      <button type="button" className="close-button" onClick={onClose} aria-label="상세정보 닫기">×</button>
      <p className="eyebrow">선택한 팝업스토어</p>
      <h2>{popupStore.name}</h2>
      <dl>
        <div><dt>주소</dt><dd>{popupStore.address}</dd></div>
        <div><dt>카테고리</dt><dd>{popupStore.category ? categoryLabels[popupStore.category] : '미지정'}</dd></div>
        <div><dt>운영 상태</dt><dd>{popupStore.status ? statusLabels[popupStore.status] : '미지정'}</dd></div>
        <div><dt>운영 기간</dt><dd>{popupStore.startDate} – {popupStore.endDate}</dd></div>
      </dl>
    </aside>
  )
}
