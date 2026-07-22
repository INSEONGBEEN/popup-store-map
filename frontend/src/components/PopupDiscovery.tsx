import { memo, type ReactNode, useMemo } from 'react'
import type { PopupStore } from '../types/popupStore'
import { categoryLabel, filterPopupStores, formatMetricCount } from '../features/popupstore/popupDiscoveryUtils'

interface Props {
  popupStores: PopupStore[]
  featuredStores: PopupStore[]
  selectedStores: PopupStore[]
  activeStoreId: number | null
  category: string
  query: string
  mapContent: ReactNode
  onCategoryChange: (category: string) => void
  onOpenDetails: (store: PopupStore) => void
  onOpenMapDetails: (store: PopupStore) => void
  onAddToSchedule: (store: PopupStore) => void
  onToggleLike: (store: PopupStore) => void
  onHighlight: (store: PopupStore | null) => void
}

const statusLabel = { OPEN: '오늘 운영', UPCOMING: '오픈 예정', CLOSED: '운영 종료' } as const

export const PopupDiscovery = memo(function PopupDiscovery(props: Props) {
  const filtered = useMemo(() => filterPopupStores(props.popupStores, props.category, props.query),
    [props.category, props.popupStores, props.query])
  const openStores = filtered.filter((store) => store.status === 'OPEN')
  const upcomingStores = filtered.filter((store) => store.status === 'UPCOMING')
  const featured = useMemo(
    () => filterPopupStores(props.featuredStores, props.category, props.query),
    [props.category, props.featuredStores, props.query],
  )

  const cardProps = {
    selectedStores: props.selectedStores,
    activeStoreId: props.activeStoreId,
    onOpenDetails: props.onOpenDetails,
    onAddToSchedule: props.onAddToSchedule,
    onToggleLike: props.onToggleLike,
    onHighlight: props.onHighlight,
  }
  const mapCardProps = { ...cardProps, onOpenDetails: props.onOpenMapDetails }

  return <div className="integrated-home">
    <section className="home-intro" id="service-guide" aria-labelledby="home-intro-title">
      <div><p className="eyebrow">DISCOVER · PLAN · WALK</p>
        <h1 id="home-intro-title">오늘의 팝업을 발견하고,<br />가장 좋은 순서로 걸어보세요.</h1>
        <p>팝업 상세 확인부터 일정 구성, 최적 동선과 실시간 도보 안내까지 한 화면에서 이어집니다.</p></div>
      <a href="#explore-map">지도와 함께 둘러보기 <span aria-hidden="true">↓</span></a>
    </section>

    <nav className="home-category-bar" aria-label="팝업 카테고리">
      {['ALL', ...Object.keys(categoryLabel)].map((value) => <button key={value} type="button"
        aria-pressed={props.category === value} className={props.category === value ? 'active' : ''}
        onClick={() => props.onCategoryChange(value)}>
        {value === 'ALL' ? '전체' : categoryLabel[value as keyof typeof categoryLabel]}
      </button>)}
      <span className="filter-result-count">검색 결과 <strong>{filtered.length}</strong>곳</span>
    </nav>

    <PopupSection id="featured-popups" title="지금 주목할 팝업" subtitle="성수에서 먼저 만나볼 만한 팝업이에요"
      stores={featured} layout="featured" {...cardProps} />
    <PopupSection id="open-popups" title="오늘 바로 방문할 수 있어요" subtitle={`오늘 운영 중 ${openStores.length}곳`}
      stores={openStores.slice(0, 8)} layout="row" {...cardProps} />

    <section className="map-explore-section" id="explore-map" aria-labelledby="map-explore-title">
      <header className="section-heading"><div><p className="eyebrow">EXPLORE THE MAP</p><h2 id="map-explore-title">카드와 지도를 함께 둘러보세요</h2>
        <p>카드와 마커는 같은 선택 상태를 공유합니다.</p></div><span>이 지역 팝업 {filtered.length}곳</span></header>
      <div className="map-explore-layout">
        <div className="map-result-list" aria-label="지도 검색 결과 카드">
          {filtered.length === 0 ? <p className="empty-result">조건에 맞는 팝업이 없습니다.</p> : filtered.map((store, index) =>
            <PopupCard key={store.id} store={store} index={index} compact {...mapCardProps} />)}
        </div>
        <div className="embedded-map">{props.mapContent}</div>
      </div>
    </section>

    <PopupSection id="upcoming-popups" title="곧 만나요" subtitle="오픈 예정 팝업을 미리 확인해 보세요"
      stores={upcomingStores.slice(0, 8)} layout="row" {...cardProps} />
  </div>
})

interface CardActions {
  selectedStores: PopupStore[]
  activeStoreId: number | null
  onOpenDetails: (store: PopupStore) => void
  onAddToSchedule: (store: PopupStore) => void
  onToggleLike: (store: PopupStore) => void
  onHighlight: (store: PopupStore | null) => void
}

function PopupSection({ id, title, subtitle, stores, layout, ...actions }: CardActions & {
  id: string; title: string; subtitle: string; stores: PopupStore[]; layout: 'featured' | 'row'
}) {
  if (stores.length === 0) return null
  return <section className="home-popup-section" id={id}>
    <header className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><span>{stores.length}곳</span></header>
    <div className={layout === 'featured' ? 'featured-popup-grid' : 'popup-horizontal-list'}>
      {stores.map((store, index) => <PopupCard key={store.id} store={store} index={index} {...actions} />)}
    </div>
  </section>
}

function PopupCard({ store, index, compact = false, selectedStores, activeStoreId, onOpenDetails,
  onAddToSchedule, onToggleLike, onHighlight }: CardActions & { store: PopupStore; index: number; compact?: boolean }) {
  const selectedIndex = selectedStores.findIndex(({ id }) => id === store.id)
  const selected = selectedIndex >= 0
  return <article className={`popup-service-card category-${store.category?.toLowerCase() ?? 'etc'}${compact ? ' compact' : ''}${selected ? ' selected' : ''}${activeStoreId === store.id ? ' highlighted' : ''}`}
    onMouseEnter={() => onHighlight(store)} onMouseLeave={() => onHighlight(null)}
    onFocus={() => onHighlight(store)} onBlur={() => onHighlight(null)}>
    <button type="button" className="popup-card-main" onClick={() => onOpenDetails(store)} aria-label={`${store.name} 상세 보기`}>
      <div className="popup-card-visual">
        {store.imageUrl ? <img src={store.imageUrl} alt="" /> : <><span>{String(index + 1).padStart(2, '0')}</span><b>{store.category ? categoryLabel[store.category] : '팝업'}</b><i>SEONGSU<br />POP-UP</i></>}
        <em className={`popup-status status-${store.status?.toLowerCase()}`}>{store.status ? statusLabel[store.status] : '상태 미정'}</em>
        {selected && <span className="selected-order" aria-label={`오늘 일정 ${selectedIndex + 1}번째`}>{selectedIndex + 1}</span>}
      </div>
      <div className="popup-card-copy"><strong>{store.name}</strong><span>{regionName(store.address)} · {store.startDate} – {store.endDate}</span>
        <small>{store.address}</small></div>
    </button>
    <div className="popup-card-actions">
      <EngagementMetric label="조회수" icon="◉" value={store.engagement.viewCount} />
      <button type="button" className={`metric-button${store.engagement.likedByCurrentVisitor ? ' liked' : ''}`}
        aria-label={`${store.name} ${store.engagement.likedByCurrentVisitor ? '좋아요 취소' : '좋아요'}`}
        title={store.engagement.likedByCurrentVisitor ? '좋아요 취소' : '좋아요'}
        onClick={(event) => { event.stopPropagation(); onToggleLike(store) }}>♥ {formatMetricCount(store.engagement.likeCount)}</button>
      <EngagementMetric label="오늘 일정 담기" icon="⌖" value={store.engagement.planAddCount} />
      <button type="button" className={`schedule-add${selected ? ' selected' : ''}`}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAddToSchedule(store) }}
        aria-label={`${store.name} ${selected ? '오늘 일정에서 제거' : '오늘 일정에 추가'}`}
        title={selected ? '오늘 일정에서 제거' : '오늘 일정에 추가'}>{selected ? `✓ ${selectedIndex + 1}` : '+ 일정'}</button>
    </div>
  </article>
}

function EngagementMetric({ label, icon, value }: { label: string; icon: string; value: number }) {
  return <span className="engagement-metric" aria-label={`${label} ${value}`} title={label}>{icon} {formatMetricCount(value)}</span>
}

function regionName(address: string) {
  if (address.includes('서울숲')) return '서울숲'
  if (address.includes('뚝섬')) return '뚝섬'
  return '성수'
}
