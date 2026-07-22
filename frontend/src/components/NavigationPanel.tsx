import { memo } from 'react'
import { formatDistance, formatDuration } from '../features/route/routeFormatters'
import type { NavigationStatus } from '../features/navigation/usePedestrianNavigation'

interface Props {
  status: NavigationStatus
  nextInstruction: string
  remainingDistanceMeters: number
  remainingDurationSeconds: number
  distanceToRouteMeters: number
  currentStopName: string | null
  nextStopName: string | null
  completedStops: number
  totalStops: number
  rerouteCount: number
  errorMessage: string | null
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onRetry: () => void
}

export const NavigationPanel = memo(function NavigationPanel(props: Props) {
  const progress = props.totalStops === 0 ? 0 : Math.min(100, props.completedStops / props.totalStops * 100)
  return <section className="navigation-panel" aria-labelledby="navigation-title">
    <div className="navigation-topline"><span className="live-dot" /><span>{statusLabel(props.status)}</span><strong>{props.completedStops} / {props.totalStops} 완료</strong></div>
    <h3 id="navigation-title">{props.nextInstruction}</h3>
    <div className="navigation-progress" aria-label={`방문 진행률 ${Math.round(progress)}%`}><span style={{ width: `${progress}%` }} /></div>
    <dl className="navigation-metrics">
      <div><dt>남은 거리</dt><dd>{formatDistance(props.remainingDistanceMeters)}</dd></div>
      <div><dt>도착 예정</dt><dd>{formatDuration(props.remainingDurationSeconds)}</dd></div>
    </dl>
    <div className="waypoint-flow"><p><span>현재</span><strong>{props.currentStopName ?? '출발지'}</strong></p><b>→</b><p><span>다음</span><strong>{props.nextStopName ?? '마지막 목적지'}</strong></p></div>
    {props.status === 'rerouting' && <p className="planner-message">경로를 다시 찾는 중입니다…</p>}
    {props.distanceToRouteMeters > 35 && <p className="planner-message stale">경로에서 벗어났습니다.</p>}
    {props.rerouteCount > 0 && <p className="planner-message">자동 재탐색 {props.rerouteCount}회</p>}
    {props.errorMessage && <p className="planner-message error" role="alert">{props.errorMessage}</p>}
    <div className="navigation-actions">
      {props.status === 'paused' ? <button type="button" onClick={props.onResume}>계속</button> : <button type="button" onClick={props.onPause}>일시정지</button>}
      {props.status === 'error' && <button type="button" onClick={props.onRetry}>재탐색</button>}
      <button type="button" className="stop-navigation" onClick={props.onStop}>종료</button>
    </div>
  </section>
})

function statusLabel(status: NavigationStatus) {
  return ({ inactive: '대기', starting: '시작 중', navigating: '도보 안내 중', rerouting: '재탐색 중',
    'arrived-at-waypoint': '방문지 도착', completed: '경로 완료', paused: '일시정지', error: '안내 오류' })[status]
}
