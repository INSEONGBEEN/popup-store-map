import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { requestPedestrianRoute } from '../../api/pedestrianRoutes'
import type { PopupStore } from '../../types/popupStore'
import type { CurrentLocation, RouteResult } from '../route/routeTypes'
import { buildReroutePlan } from './navigationRoute'
import { haversineMeters, NAVIGATION_THRESHOLDS, nextManeuver, projectOntoRoute, remainingDuration, shouldConfirmOffRoute } from './navigationMath'

export type NavigationStatus = 'inactive' | 'starting' | 'navigating' | 'rerouting' | 'arrived-at-waypoint' | 'completed' | 'paused' | 'error'

export function usePedestrianNavigation(
  plannedRoute: RouteResult | null,
  selectedStores: PopupStore[],
  currentLocation: CurrentLocation | null,
) {
  const [status, setStatus] = useState<NavigationStatus>('inactive')
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null)
  const [activeWaypointIndex, setActiveWaypointIndex] = useState(0)
  const [projectionIndex, setProjectionIndex] = useState(0)
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState(0)
  const [remainingDurationSeconds, setRemainingDurationSeconds] = useState(0)
  const [distanceToRouteMeters, setDistanceToRouteMeters] = useState(0)
  const [nextInstruction, setNextInstruction] = useState('경로를 따라 계속 이동하세요.')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [rerouteCount, setRerouteCount] = useState(0)
  const offRouteDistances = useRef<number[]>([])
  const lastRerouteAt = useRef(0)
  const rerouteAbort = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    rerouteAbort.current?.abort(); rerouteAbort.current = null
    setStatus('inactive'); setActiveRoute(null); setActiveWaypointIndex(0)
    offRouteDistances.current = []
  }, [])

  const start = useCallback(() => {
    if (!plannedRoute || plannedRoute.coordinates.length < 2 || !currentLocation || selectedStores.length === 0) {
      setStatus('error'); setErrorMessage('현재 위치와 유효한 도보 경로를 먼저 준비해 주세요.'); return
    }
    setStatus('starting'); setActiveRoute(plannedRoute); setActiveWaypointIndex(0); setProjectionIndex(0)
    setRemainingDistanceMeters(plannedRoute.distanceMeters); setRemainingDurationSeconds(plannedRoute.durationSeconds)
    setErrorMessage(null); setStatus('navigating')
  }, [currentLocation, plannedRoute, selectedStores.length])

  const reroute = useCallback(async () => {
    if (!currentLocation || !activeRoute || status === 'rerouting') return
    const remainingStores = selectedStores.slice(activeWaypointIndex)
    if (remainingStores.length === 0) return
    const now = Date.now()
    if (now - lastRerouteAt.current < NAVIGATION_THRESHOLDS.minRerouteIntervalMs) return
    lastRerouteAt.current = now
    rerouteAbort.current?.abort()
    const controller = new AbortController(); rerouteAbort.current = controller
    setStatus('rerouting'); setErrorMessage(null)
    try {
      const route = await requestPedestrianRoute(buildReroutePlan(currentLocation.coordinate, remainingStores), controller.signal)
      if (rerouteAbort.current !== controller) return
      setActiveRoute(route); setProjectionIndex(0); offRouteDistances.current = []
      setRerouteCount((value) => value + 1); setStatus('navigating')
    } catch (error) {
      if (axios.isCancel(error) || rerouteAbort.current !== controller) return
      setStatus('error'); setErrorMessage('경로를 다시 찾지 못했습니다. 기존 경로를 확인하며 수동으로 재시도해 주세요.')
    } finally {
      if (rerouteAbort.current === controller) rerouteAbort.current = null
    }
  }, [activeRoute, activeWaypointIndex, currentLocation, selectedStores, status])

  useEffect(() => {
    if (!currentLocation || !activeRoute || !['navigating', 'arrived-at-waypoint'].includes(status)) return
    const projection = projectOntoRoute(currentLocation.coordinate, activeRoute.coordinates, projectionIndex)
    if (!projection) return
    setProjectionIndex((value) => Math.max(value, projection.segmentIndex))
    setDistanceToRouteMeters(projection.distanceToRouteMeters)
    setRemainingDistanceMeters(projection.remainingDistanceMeters)
    setRemainingDurationSeconds(remainingDuration(activeRoute, projection.remainingDistanceMeters))
    setNextInstruction(nextManeuver(activeRoute, projection.segmentIndex)?.instruction ?? '경로를 따라 계속 이동하세요.')

    const waypoint = selectedStores[activeWaypointIndex]
    if (waypoint && waypoint.longitude != null && waypoint.latitude != null) {
      const radius = Math.max(NAVIGATION_THRESHOLDS.arrivalMeters, Math.min(45, currentLocation.accuracyMeters))
      if (haversineMeters(currentLocation.coordinate, [waypoint.longitude, waypoint.latitude]) <= radius) {
        if (activeWaypointIndex === selectedStores.length - 1) setStatus('completed')
        else { setStatus('arrived-at-waypoint'); setActiveWaypointIndex((value) => value + 1) }
        return
      }
    }
    if (status === 'arrived-at-waypoint') setStatus('navigating')
    offRouteDistances.current = [...offRouteDistances.current.slice(-2), projection.distanceToRouteMeters]
    if (shouldConfirmOffRoute(offRouteDistances.current, currentLocation.accuracyMeters)) void reroute()
  }, [activeRoute, activeWaypointIndex, currentLocation, projectionIndex, reroute, selectedStores, status])

  useEffect(() => () => rerouteAbort.current?.abort(), [])

  return {
    status, activeRoute, activeWaypointIndex, remainingDistanceMeters, remainingDurationSeconds,
    distanceToRouteMeters, nextInstruction, errorMessage, rerouteCount,
    start, stop, reroute,
    pause: () => setStatus('paused'),
    resume: () => activeRoute && setStatus('navigating'),
  }
}
