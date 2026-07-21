import type { PopupStore } from '../types/popupStore'
import type { AddSelectionResult } from '../features/route/routeSelection'
import { MAX_ROUTE_STORES, MIN_ROUTE_STORES } from '../features/route/routeSelection'
import type { RouteOptimizationState, RouteOriginType, RouteState } from '../features/route/routeTypes'
import { formatDistance, formatDuration } from '../features/route/routeFormatters'
import { NavigationPanel } from './NavigationPanel'
import type { NavigationStatus } from '../features/navigation/usePedestrianNavigation'
import { RouteSummary } from './RouteSummary'

interface RoutePlannerProps {
  popupStores: PopupStore[]
  selectedStores: PopupStore[]
  routeState: RouteState
  selectionMessage: string | null
  originType: RouteOriginType
  hasCurrentLocation: boolean
  onAdd: (popupStore: PopupStore) => AddSelectionResult
  onRemove: (popupStoreId: number) => void
  onMove: (popupStoreId: number, direction: 'up' | 'down') => void
  onClear: () => void
  onCalculate: () => void
  onOriginTypeChange: (originType: RouteOriginType) => void
  optimizationState: RouteOptimizationState
  onRecommend: () => void
  onApplyRecommendation: () => void
  onRestoreOriginal: () => void
  navigation: {
    status: NavigationStatus; nextInstruction: string; remainingDistanceMeters: number
    remainingDurationSeconds: number; distanceToRouteMeters: number; nextStopName: string | null
    rerouteCount: number; errorMessage: string | null; canStart: boolean
    onStart: () => void; onPause: () => void; onResume: () => void; onStop: () => void; onRetry: () => void
    headingUp: boolean; onToggleHeading: () => void; onRecenter: () => void
  }
}

export function RoutePlanner({
  popupStores,
  selectedStores,
  routeState,
  selectionMessage,
  originType,
  hasCurrentLocation,
  onAdd,
  onRemove,
  onMove,
  onClear,
  onCalculate,
  onOriginTypeChange,
  optimizationState,
  onRecommend,
  onApplyRecommendation,
  onRestoreOriginal,
  navigation,
}: RoutePlannerProps) {
  const currentLocationMissing = originType === 'CURRENT_LOCATION' && !hasCurrentLocation
  const canCalculate = selectedStores.length >= MIN_ROUTE_STORES &&
    routeState.status !== 'loading' && !currentLocationMissing

  return (
    <aside className="route-planner" aria-labelledby="route-planner-title">
      <div className="route-planner-heading">
        <div>
          <p className="eyebrow">ROUTE PLANNER</p>
          <h2 id="route-planner-title">방문 경로 계획</h2>
        </div>
        <span>{selectedStores.length}/{MAX_ROUTE_STORES}</span>
      </div>

      <fieldset className="route-origin-options">
        <legend>출발지</legend>
        {([
          ['SEONGSU_STATION', '성수역'],
          ['CURRENT_LOCATION', '현재 위치'],
          ['FIRST_SELECTED_STORE', '첫 번째 선택 팝업'],
        ] as const).map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="route-origin"
              value={value}
              checked={originType === value}
              onChange={() => onOriginTypeChange(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <label className="route-add-field" htmlFor="route-store-select">
        방문지 추가
        <select
          id="route-store-select"
          value=""
          disabled={selectedStores.length >= MAX_ROUTE_STORES}
          onChange={(event) => {
            const popupStore = popupStores.find((store) => store.id === Number(event.target.value))
            if (popupStore) onAdd(popupStore)
          }}
        >
          <option value="">팝업스토어를 선택하세요</option>
          {popupStores.map((popupStore) => (
            <option key={popupStore.id} value={popupStore.id}>
              {popupStore.name}
            </option>
          ))}
        </select>
      </label>

      {selectionMessage && <p className="planner-message error" role="alert">{selectionMessage}</p>}

      {selectedStores.length === 0 ? (
        <div className="route-empty">
          지도 마커의 상세정보 또는 위 선택 메뉴에서 방문지를 추가해 주세요.
        </div>
      ) : (
        <ol className="route-stop-list">
          {selectedStores.map((popupStore, index) => (
            <li key={popupStore.id}>
              <span className="route-order" aria-hidden="true">{index + 1}</span>
              <div className="route-stop-copy">
                <strong>{popupStore.name}</strong>
                <span>{popupStore.address}</span>
              </div>
              <div className="route-stop-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMove(popupStore.id, 'up')}
                  aria-label={`${popupStore.name}을 위로 이동`}
                >↑</button>
                <button
                  type="button"
                  disabled={index === selectedStores.length - 1}
                  onClick={() => onMove(popupStore.id, 'down')}
                  aria-label={`${popupStore.name}을 아래로 이동`}
                >↓</button>
                <button
                  type="button"
                  className="remove-stop"
                  onClick={() => onRemove(popupStore.id)}
                  aria-label={`${popupStore.name} 경로에서 제거`}
                >×</button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="route-actions">
        <button
          type="button"
          className="primary-action"
          disabled={!canCalculate}
          onClick={onCalculate}
        >
          {routeState.status === 'loading' ? '경로 계산 중…' : '경로 찾기'}
        </button>
        <button type="button" disabled={selectedStores.length === 0} onClick={onClear}>
          선택 초기화
        </button>
      </div>

      <button
        type="button"
        className="optimize-action"
        disabled={selectedStores.length < MIN_ROUTE_STORES || originType === 'FIRST_SELECTED_STORE' || optimizationState.status === 'loading'}
        onClick={onRecommend}
      >{optimizationState.status === 'loading' ? '최적 순서 계산 중…' : '최적 순서 추천'}</button>
      {originType === 'FIRST_SELECTED_STORE' && <p className="planner-message">최적화는 성수역 또는 현재 위치 출발에서 사용할 수 있습니다.</p>}
      {optimizationState.status === 'error' && <p className="planner-message error" role="alert">{optimizationState.errorMessage}</p>}
      {optimizationState.result && <section className="optimization-result" aria-label="추천 순서 비교">
        <h3>추천 결과 비교</h3>
        <p>기존 순서: {optimizationState.result.originalStoreIds.map((id) => selectedStores.find((store) => store.id === id)?.name ?? id).join(' → ')}</p>
        <p>추천 순서: {optimizationState.result.orderedStoreIds.map((id) => selectedStores.find((store) => store.id === id)?.name ?? id).join(' → ')}</p>
        <dl className="route-summary-grid">
          <div><dt>기존</dt><dd>{formatDistance(optimizationState.result.original.distanceMeters)} · {formatDuration(optimizationState.result.original.durationSeconds)}</dd></div>
          <div><dt>추천</dt><dd>{formatDistance(optimizationState.result.optimized.distanceMeters)} · {formatDuration(optimizationState.result.optimized.durationSeconds)}</dd></div>
          <div><dt>절약</dt><dd>{formatDistance(Math.max(0, optimizationState.result.savings.distanceMeters))} · {formatDuration(Math.max(0, optimizationState.result.savings.durationSeconds))}</dd></div>
        </dl>
        <div className="route-actions">
          <button type="button" onClick={onApplyRecommendation}>추천 순서 적용</button>
          {optimizationState.status === 'applied' && <button type="button" onClick={onRestoreOriginal}>기존 순서로 되돌리기</button>}
        </div>
      </section>}

      {selectedStores.length === 1 && (
        <p className="planner-message">경로를 찾으려면 한 곳을 더 선택해 주세요.</p>
      )}
      {currentLocationMissing && (
        <p className="planner-message error" role="alert">먼저 지도에서 현재 위치를 확인해 주세요.</p>
      )}
      {routeState.status === 'stale' && (
        <p className="planner-message stale">선택 목록 또는 순서가 변경되었습니다. 경로를 다시 계산해 주세요.</p>
      )}
      {routeState.status === 'error' && routeState.errorMessage && (
        <p className="planner-message error" role="alert">{routeState.errorMessage}</p>
      )}
      {routeState.status === 'success' && routeState.result && (
        <RouteSummary result={routeState.result} />
      )}
      <NavigationPanel {...navigation} />
    </aside>
  )
}
