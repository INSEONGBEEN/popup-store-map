import { memo, useState } from 'react'
import type { PopupStore } from '../types/popupStore'
import { MAX_ROUTE_STORES, MIN_ROUTE_STORES } from '../features/route/routeSelection'
import type { RouteOptimizationState, RouteOriginType, RouteState } from '../features/route/routeTypes'
import { formatDistance, formatDuration } from '../features/route/routeFormatters'
import { NavigationPanel } from './NavigationPanel'
import type { NavigationStatus } from '../features/navigation/usePedestrianNavigation'

interface RoutePlannerProps {
  popupStores: PopupStore[]
  selectedStores: PopupStore[]
  routeState: RouteState
  selectionMessage: string | null
  originType: RouteOriginType
  onAdd: (popupStore: PopupStore) => void
  onRemove: (popupStoreId: number) => void
  onMove: (popupStoreId: number, direction: 'up' | 'down') => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onClear: () => void
  onOriginTypeChange: (originType: RouteOriginType) => void
  optimizationState: RouteOptimizationState
  onRestoreOrder: () => void
  onCollapse: () => void
  guidanceBusy: boolean
  guidanceStage: string | null
  onStartGuidance: () => void
  navigation: {
    status: NavigationStatus; nextInstruction: string; remainingDistanceMeters: number
    remainingDurationSeconds: number; distanceToRouteMeters: number; currentStopName: string | null
    nextStopName: string | null; completedStops: number; totalStops: number
    rerouteCount: number; errorMessage: string | null
    onPause: () => void; onResume: () => void; onStop: () => void; onRetry: () => void
  }
}

export const RoutePlanner = memo(function RoutePlanner(props: RoutePlannerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const routeMetrics = props.optimizationState.result?.optimized ?? props.routeState.result
  const canStart = props.selectedStores.length >= MIN_ROUTE_STORES && !props.guidanceBusy

  return <aside className={`route-planner bottom-card${props.navigation.status !== 'inactive' ? ' navigation-active' : ''}`} aria-labelledby="route-planner-title">
    <div className="card-grabber" aria-hidden="true" />
    <div className="route-planner-heading">
      <div><p className="eyebrow">TODAY'S PLAN</p><h2 id="route-planner-title">오늘 방문할 곳</h2></div>
      <div className="planner-heading-actions"><span>{props.selectedStores.length}/{MAX_ROUTE_STORES}</span>
        {props.navigation.status === 'inactive' && <button type="button" onClick={props.onCollapse} aria-label="오늘 일정 접기">↓</button>}</div>
    </div>

    {props.navigation.status === 'inactive' ? <>
      <div className="origin-chips" role="radiogroup" aria-label="출발지">
        {([['SEONGSU_STATION', '성수역'], ['CURRENT_LOCATION', '현재 위치'], ['FIRST_SELECTED_STORE', '첫 팝업']] as const)
          .map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={props.originType === value}
            className={props.originType === value ? 'active' : ''} onClick={() => props.onOriginTypeChange(value)}>{label}</button>)}
      </div>

      <label className="route-add-field" htmlFor="route-store-select">방문지 추가
        <select id="route-store-select" value="" disabled={props.selectedStores.length >= MAX_ROUTE_STORES}
          onChange={(event) => { const store = props.popupStores.find(({ id }) => id === Number(event.target.value)); if (store) props.onAdd(store) }}>
          <option value="">팝업스토어를 선택하세요</option>
          {props.popupStores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
      </label>

      {props.selectionMessage && <p className="planner-message error" role="alert">{props.selectionMessage}</p>}
      {props.selectedStores.length === 0 ? <div className="route-empty">팝업 카드의 ‘+ 일정’ 또는 지도 상세의 추가 버튼으로 방문지를 담아보세요.</div> :
        <ol className="route-stop-list chip-list">
          {props.selectedStores.map((store, index) => <li key={store.id} draggable
            className={draggedIndex === index ? 'dragging' : ''}
            onDragStart={() => setDraggedIndex(index)} onDragEnd={() => setDraggedIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => { if (draggedIndex != null) props.onReorder(draggedIndex, index); setDraggedIndex(null) }}>
            <span className="drag-handle" aria-hidden="true">⠿</span><span className="route-order">{index + 1}</span>
            <div className="route-stop-copy"><strong>{store.name}</strong><span>{store.address}</span></div>
            <div className="route-stop-actions">
              <button type="button" disabled={index === 0} onClick={() => props.onMove(store.id, 'up')} aria-label={`${store.name}을 위로 이동`}>↑</button>
              <button type="button" disabled={index === props.selectedStores.length - 1} onClick={() => props.onMove(store.id, 'down')} aria-label={`${store.name}을 아래로 이동`}>↓</button>
              <button type="button" className="remove-stop" onClick={() => props.onRemove(store.id)} aria-label={`${store.name} 오늘 일정에서 제거`}>×</button>
            </div>
          </li>)}
        </ol>}

      {props.optimizationState.result && <div className="schedule-order-actions">
        <button type="button" onClick={props.onRestoreOrder}>길안내 전 순서로 복원</button>
      </div>}
      {props.optimizationState.result && <div className="route-preview fade-in">
        <span>{props.optimizationState.status === 'applied' ? '최적 순서 적용됨' : '추천 방문 순서 준비됨'}</span>
        <strong>{formatDistance(props.optimizationState.result.savings.distanceMeters)} 절약</strong>
      </div>}
      {routeMetrics && <dl className="planner-metrics fade-in">
        <div><dt>예상 거리</dt><dd>{formatDistance(routeMetrics.distanceMeters)}</dd></div>
        <div><dt>예상 시간</dt><dd>{formatDuration(routeMetrics.durationSeconds)}</dd></div>
      </dl>}
      {(props.routeState.errorMessage || props.optimizationState.errorMessage) &&
        <p className="planner-message error" role="alert">{props.routeState.errorMessage ?? props.optimizationState.errorMessage}</p>}
      <button type="button" className="guidance-start" disabled={!canStart} onClick={props.onStartGuidance}>
        {props.guidanceStage ?? (props.guidanceBusy ? '길안내 준비 중…' : '길안내 시작')}
      </button>
      <button type="button" className="clear-route" disabled={props.selectedStores.length === 0} onClick={props.onClear}>선택 초기화</button>
      {props.selectedStores.length === 1 && <p className="planner-message">한 곳을 더 선택하면 길안내를 시작할 수 있어요.</p>}
    </> : <NavigationPanel {...props.navigation} />}
  </aside>
})
