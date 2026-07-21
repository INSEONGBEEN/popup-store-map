import { formatDistance, formatDuration } from '../features/route/routeFormatters'
import type { NavigationStatus } from '../features/navigation/usePedestrianNavigation'

interface Props {
  status: NavigationStatus
  nextInstruction: string
  remainingDistanceMeters: number
  remainingDurationSeconds: number
  distanceToRouteMeters: number
  nextStopName: string | null
  rerouteCount: number
  errorMessage: string | null
  canStart: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onRetry: () => void
  headingUp: boolean
  onToggleHeading: () => void
  onRecenter: () => void
}

export function NavigationPanel(props: Props) {
  const active = props.status !== 'inactive'
  return <section className="navigation-panel" aria-labelledby="navigation-title">
    <h3 id="navigation-title">실시간 도보 길안내</h3>
    {!active && <button type="button" disabled={!props.canStart} onClick={props.onStart}>길안내 시작</button>}
    {active && <>
      <p className="navigation-status">상태: {statusLabel(props.status)}</p>
      <strong>{props.nextInstruction}</strong>
      {props.nextStopName && <p>다음 방문지: {props.nextStopName}</p>}
      <dl className="route-summary-grid">
        <div><dt>남은 거리</dt><dd>{formatDistance(props.remainingDistanceMeters)}</dd></div>
        <div><dt>남은 시간</dt><dd>{formatDuration(props.remainingDurationSeconds)}</dd></div>
        <div><dt>경로와 거리</dt><dd>{formatDistance(props.distanceToRouteMeters)}</dd></div>
      </dl>
      {props.status === 'rerouting' && <p>도보 경로를 다시 찾는 중입니다…</p>}
      {props.rerouteCount > 0 && <p>재탐색 {props.rerouteCount}회</p>}
      {props.errorMessage && <p className="planner-message error" role="alert">{props.errorMessage}</p>}
      <div className="route-actions">
        {props.status === 'paused'
          ? <button type="button" onClick={props.onResume}>계속 안내</button>
          : <button type="button" onClick={props.onPause}>일시정지</button>}
        {props.status === 'error' && <button type="button" onClick={props.onRetry}>재탐색</button>}
        <button type="button" onClick={props.onRecenter}>지도 중앙 정렬</button>
        <button type="button" onClick={props.onToggleHeading}>{props.headingUp ? '북쪽 고정' : '진행 방향 보기'}</button>
        <button type="button" onClick={props.onStop}>길안내 종료</button>
      </div>
    </>}
  </section>
}

function statusLabel(status: NavigationStatus) {
  return ({ inactive: '대기', starting: '시작 중', navigating: '안내 중', rerouting: '재탐색 중',
    'arrived-at-waypoint': '방문지 도착', completed: '모든 방문지 도착', paused: '일시정지', error: '오류' })[status]
}
