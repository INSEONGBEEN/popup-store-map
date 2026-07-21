import type { PopupStore } from '../types/popupStore'
import type { AddSelectionResult } from '../features/route/routeSelection'
import { MAX_ROUTE_STORES, MIN_ROUTE_STORES } from '../features/route/routeSelection'
import type { RouteState } from '../features/route/routeTypes'
import { RouteSummary } from './RouteSummary'

interface RoutePlannerProps {
  popupStores: PopupStore[]
  selectedStores: PopupStore[]
  routeState: RouteState
  selectionMessage: string | null
  onAdd: (popupStore: PopupStore) => AddSelectionResult
  onRemove: (popupStoreId: number) => void
  onMove: (popupStoreId: number, direction: 'up' | 'down') => void
  onClear: () => void
  onCalculate: () => void
}

export function RoutePlanner({
  popupStores,
  selectedStores,
  routeState,
  selectionMessage,
  onAdd,
  onRemove,
  onMove,
  onClear,
  onCalculate,
}: RoutePlannerProps) {
  const canCalculate = selectedStores.length >= MIN_ROUTE_STORES && routeState.status !== 'loading'

  return (
    <aside className="route-planner" aria-labelledby="route-planner-title">
      <div className="route-planner-heading">
        <div>
          <p className="eyebrow">ROUTE PLANNER</p>
          <h2 id="route-planner-title">방문 경로 계획</h2>
        </div>
        <span>{selectedStores.length}/{MAX_ROUTE_STORES}</span>
      </div>

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

      {selectedStores.length === 1 && (
        <p className="planner-message">경로를 찾으려면 한 곳을 더 선택해 주세요.</p>
      )}
      {routeState.status === 'stale' && (
        <p className="planner-message stale">선택 목록 또는 순서가 변경되었습니다. 경로를 다시 계산해 주세요.</p>
      )}
      {routeState.status === 'error' && routeState.errorMessage && (
        <p className="planner-message error" role="alert">{routeState.errorMessage}</p>
      )}
      {routeState.status === 'success' && routeState.result && (
        <RouteSummary result={routeState.result} selectedStores={selectedStores} />
      )}
    </aside>
  )
}
