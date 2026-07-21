import type { RouteResult } from '../features/route/routeTypes'
import { formatDistance, formatDuration } from '../features/route/routeFormatters'

interface RouteSummaryProps {
  result: RouteResult
}

export function RouteSummary({ result }: RouteSummaryProps) {
  return (
    <section className="route-summary" aria-label="도보 경로 계산 결과">
      <h3>도보 경로 요약</h3>
      <dl>
        <div><dt>총 도보거리</dt><dd>{formatDistance(result.distanceMeters)}</dd></div>
        <div><dt>예상 도보시간</dt><dd>{formatDuration(result.durationSeconds)}</dd></div>
        <div><dt>방문 팝업 수</dt><dd>{result.popupStoreCount}곳</dd></div>
        <div><dt>출발지</dt><dd>{result.departureName}</dd></div>
        <div><dt>도착지</dt><dd>{result.destinationName}</dd></div>
      </dl>
      {result.legs.some(({ maneuvers }) => maneuvers.length > 0) && (
        <details>
          <summary>보행 안내 보기</summary>
          <ol>
            {result.legs.flatMap(({ index, maneuvers }) => maneuvers.map((maneuver, stepIndex) => (
              <li key={`${index}-${stepIndex}`}>
                <span>{maneuver.instruction}</span>
                <small>{formatDistance(maneuver.distanceMeters)} · {formatDuration(maneuver.durationSeconds)}</small>
              </li>
            )))}</ol>
        </details>
      )}
      <p>OSM 보행 네트워크 기반 예상치이며 실제 보행 환경과 다를 수 있습니다.</p>
    </section>
  )
}
