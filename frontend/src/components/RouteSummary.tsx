import type { PopupStore } from '../types/popupStore'
import type { RouteResult } from '../features/route/routeTypes'
import { formatDistance, formatDuration } from '../features/route/routeFormatters'

interface RouteSummaryProps {
  result: RouteResult
  selectedStores: PopupStore[]
}

export function RouteSummary({ result, selectedStores }: RouteSummaryProps) {
  const departure = selectedStores[0]
  const arrival = selectedStores[selectedStores.length - 1]

  if (!departure || !arrival) return null

  return (
    <section className="route-summary" aria-label="경로 계산 결과">
      <h3>경로 요약</h3>
      <dl>
        <div><dt>총 거리</dt><dd>{formatDistance(result.distanceMeters)}</dd></div>
        <div><dt>예상 시간</dt><dd>{formatDuration(result.durationSeconds)}</dd></div>
        <div><dt>경유지 수</dt><dd>{Math.max(0, selectedStores.length - 2)}곳</dd></div>
        <div><dt>출발지</dt><dd>{departure.name}</dd></div>
        <div><dt>도착지</dt><dd>{arrival.name}</dd></div>
      </dl>
      <p>자동차 경로 기준이며 실제 교통 상황과 다를 수 있습니다.</p>
    </section>
  )
}
