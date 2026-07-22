import { useCallback, useEffect, useRef, useState } from 'react'
import type { CurrentLocation } from '../route/routeTypes'
import {
  acquireInitialPosition,
  acquireFromWatcherThenRequest,
  clearWatchIfActive,
  startWatchOnce,
  watchErrorAction,
  WATCH_POSITION_OPTIONS,
} from './geolocationAcquisition'

export type GeolocationStatus =
  | 'idle' | 'locating' | 'tracking' | 'permission-denied' | 'unavailable' | 'timeout'
  | 'unsupported' | 'insecure' | 'stopped'

const CACHED_POSITION_MAX_AGE_MS = 60_000

export function useCurrentLocation() {
  const [location, setLocation] = useState<CurrentLocation | null>(null)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [followMode, setFollowMode] = useState(true)
  const [recenterToken, setRecenterToken] = useState(0)
  const watchIdRef = useRef<number | null>(null)
  const locationRef = useRef<CurrentLocation | null>(null)
  const pendingPositionRef = useRef<Promise<CurrentLocation> | null>(null)
  const initialAcquisitionRef = useRef(false)
  const firstLocationResolverRef = useRef<((location: CurrentLocation) => void) | null>(null)
  const firstLocationRejecterRef = useRef<((error: GeolocationPositionError) => void) | null>(null)
  const trackingRef = useRef(false)
  const gpsHeadingRef = useRef<number | null>(null)
  const orientationHeadingRef = useRef<number | null>(null)
  const absoluteOrientationSeenRef = useRef(false)
  const smoothedHeadingRef = useRef<number | null>(null)

  const updateLocation = useCallback((position: GeolocationPosition) => {
    const { coords, timestamp } = position
    const speed = Number.isFinite(coords.speed) ? coords.speed : null
    const gpsHeading = preferredHeading(coords.heading, speed, null)
    gpsHeadingRef.current = gpsHeading
    const rawHeading = preferredHeading(coords.heading, speed, orientationHeadingRef.current)
    const heading = smoothHeading(smoothedHeadingRef.current, rawHeading)
    smoothedHeadingRef.current = heading
    const next: CurrentLocation = {
      coordinate: [coords.longitude, coords.latitude],
      accuracyMeters: Math.max(0, coords.accuracy),
      headingDegrees: heading,
      speedMetersPerSecond: speed,
      timestamp,
    }
    locationRef.current = next
    firstLocationResolverRef.current?.(next)
    firstLocationResolverRef.current = null
    setLocation(next)
    setStatus('tracking')
    setErrorMessage(null)
    debugGeolocation('position-success', {
      accuracyMeters: next.accuracyMeters,
      source: trackingRef.current ? 'watch' : 'initial',
    })
    return next
  }, [])

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    const nextStatus = geolocationErrorStatus(error.code)
    setStatus(nextStatus)
    const message = geolocationErrorMessage(error.code)
    setErrorMessage(message)
    debugGeolocation('final-error', { status: nextStatus, code: error.code, message: error.message })
    return new Error(message)
  }, [])

  const startWatcher = useCallback(() => {
    if (watchIdRef.current !== null || !navigator.geolocation) return
    trackingRef.current = true
    watchIdRef.current = startWatchOnce(
      navigator.geolocation,
      watchIdRef.current,
      updateLocation,
      (error) => {
        debugGeolocation('watch-failure', { code: error.code, message: error.message })
        const action = watchErrorAction(Boolean(locationRef.current), error.code)
        if (action === 'preserve-location') {
          setStatus('tracking')
          setErrorMessage(null)
          return
        }
        if (initialAcquisitionRef.current) {
          watchIdRef.current = clearWatchIfActive(navigator.geolocation, watchIdRef.current)
          trackingRef.current = false
          firstLocationRejecterRef.current?.(error)
          firstLocationRejecterRef.current = null
          return
        }
        if (action === 'stop-watcher') {
          watchIdRef.current = clearWatchIfActive(navigator.geolocation, watchIdRef.current)
          trackingRef.current = false
        }
        handleLocationError(error)
      },
    )
    debugGeolocation('watch-start', { watchId: watchIdRef.current, options: WATCH_POSITION_OPTIONS })
  }, [handleLocationError, updateLocation])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      watchIdRef.current = clearWatchIfActive(navigator.geolocation, watchIdRef.current)
    }
    trackingRef.current = false
    setStatus('stopped')
  }, [])

  const ensureCurrentPosition = useCallback(async (): Promise<CurrentLocation> => {
    const cached = locationRef.current
    if (cached && Date.now() - cached.timestamp <= CACHED_POSITION_MAX_AGE_MS) {
      startWatcher()
      setRecenterToken((value) => value + 1)
      return cached
    }
    if (!window.isSecureContext) {
      const message = '현재 위치는 HTTPS 또는 localhost 환경에서 다시 시도해 주세요.'
      setStatus('insecure')
      setErrorMessage(message)
      throw new Error(message)
    }
    if (!navigator.geolocation) {
      const message = '이 브라우저는 위치 기능을 지원하지 않습니다.'
      setStatus('unsupported')
      setErrorMessage(message)
      throw new Error(message)
    }
    if (pendingPositionRef.current) return pendingPositionRef.current
    setStatus('locating')
    setErrorMessage(null)
    setFollowMode(true)
    void requestDeviceOrientationPermission().then((permission) => {
      debugGeolocation('orientation-permission', { state: permission })
    })
    void debugGeolocationPermission()
    debugGeolocation('environment', {
      origin: window.location.origin,
      secureContext: window.isSecureContext,
      geolocationSupported: true,
    })
    initialAcquisitionRef.current = true
    const watchPosition = new Promise<CurrentLocation>((resolve, reject) => {
      firstLocationResolverRef.current = resolve
      firstLocationRejecterRef.current = reject
    })
    startWatcher()
    const requestFallback = () => acquireInitialPosition(navigator.geolocation, {
        onAttempt: (options, attempt) => debugGeolocation('get-position-start', { attempt, options }),
        onFailure: (error, attempt) => debugGeolocation('get-position-failure', {
          attempt, code: error.code, message: error.message,
        }),
        onRetry: () => {
          setStatus('locating')
          setErrorMessage('현재 위치를 다시 확인하고 있습니다.')
        },
        onSuccess: (position, attempt) => debugGeolocation('get-position-success', {
          attempt, accuracyMeters: position.coords.accuracy,
        }),
      }).then((position) => {
        const next = updateLocation(position)
        startWatcher()
        return next
      })
    const pending = acquireFromWatcherThenRequest(watchPosition, requestFallback, () => {
      setStatus('locating')
      setErrorMessage('현재 위치를 다른 방식으로 다시 확인하고 있습니다.')
      debugGeolocation('watch-fallback', { reason: 'watcher-did-not-provide-position' })
    }).catch((error: GeolocationPositionError) => {
      if (locationRef.current) return locationRef.current
      throw handleLocationError(error)
    }).finally(() => {
      initialAcquisitionRef.current = false
      firstLocationResolverRef.current = null
      firstLocationRejecterRef.current = null
      pendingPositionRef.current = null
    })
    pendingPositionRef.current = pending
    return pending
  }, [handleLocationError, startWatcher, updateLocation])

  const requestLocation = useCallback(() => {
    void ensureCurrentPosition().catch(() => undefined)
  }, [ensureCurrentPosition])

  useEffect(() => {
    const onOrientation = (event: DeviceOrientationEvent) => {
      const isAbsolute = event.type === 'deviceorientationabsolute' || event.absolute === true ||
        Number.isFinite((event as CompassOrientationEvent).webkitCompassHeading)
      if (!isAbsolute && absoluteOrientationSeenRef.current) return
      const heading = headingFromOrientation(event, screenOrientationDegrees())
      if (heading == null) return
      if (isAbsolute) absoluteOrientationSeenRef.current = true
      orientationHeadingRef.current = heading
      if (!trackingRef.current || gpsHeadingRef.current != null) return
      setLocation((current) => {
        if (!current) return current
        const smoothed = smoothHeading(smoothedHeadingRef.current, heading)
        smoothedHeadingRef.current = smoothed
        const next = { ...current, headingDegrees: smoothed }
        locationRef.current = next
        return next
      })
    }
    window.addEventListener('deviceorientation', onOrientation)
    window.addEventListener('deviceorientationabsolute', onOrientation)
    return () => {
      window.removeEventListener('deviceorientation', onOrientation)
      window.removeEventListener('deviceorientationabsolute', onOrientation)
    }
  }, [])

  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      watchIdRef.current = clearWatchIfActive(navigator.geolocation, watchIdRef.current)
    }
    trackingRef.current = false
    initialAcquisitionRef.current = false
    firstLocationResolverRef.current = null
    firstLocationRejecterRef.current = null
    pendingPositionRef.current = null
  }, [])

  const pauseFollow = useCallback(() => setFollowMode(false), [])
  const resumeFollow = useCallback(() => {
    setFollowMode(true)
    setRecenterToken((value) => value + 1)
  }, [])

  return {
    location, status, errorMessage, followMode, recenterToken,
    requestLocation, ensureCurrentPosition, stopTracking,
    pauseFollow,
    resumeFollow,
  }
}

interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number
}

interface OrientationEventConstructorWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

async function requestDeviceOrientationPermission(): Promise<'granted' | 'denied' | 'not-required' | 'unsupported'> {
  if (typeof DeviceOrientationEvent === 'undefined') return 'unsupported'
  const constructor = DeviceOrientationEvent as unknown as OrientationEventConstructorWithPermission
  if (!constructor.requestPermission) return 'not-required'
  try {
    return await constructor.requestPermission()
  } catch {
    return 'denied'
  }
}

export function headingFromOrientation(event: DeviceOrientationEvent, screenAngleDegrees = 0): number | null {
  const compassHeading = (event as CompassOrientationEvent).webkitCompassHeading
  if (Number.isFinite(compassHeading)) return normalizeHeading(compassHeading! + screenAngleDegrees)
  if (!Number.isFinite(event.alpha)) return null
  return normalizeHeading(360 - event.alpha! + screenAngleDegrees)
}

export function screenOrientationDegrees(): number {
  if (Number.isFinite(window.screen.orientation?.angle)) return window.screen.orientation.angle
  const legacyOrientation = (window as Window & { orientation?: number }).orientation
  return Number.isFinite(legacyOrientation) ? legacyOrientation! : 0
}

export function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360
}

export function preferredHeading(
  gpsHeading: number | null,
  speedMetersPerSecond: number | null,
  orientationHeading: number | null,
): number | null {
  if (Number.isFinite(gpsHeading) && (speedMetersPerSecond ?? 0) >= 0.5) {
    return normalizeHeading(gpsHeading!)
  }
  return Number.isFinite(orientationHeading) ? normalizeHeading(orientationHeading!) : null
}

export function smoothHeading(previous: number | null, next: number | null, factor = 0.24): number | null {
  if (next == null) return null
  if (previous == null) return normalizeHeading(next)
  const delta = ((next - previous + 540) % 360) - 180
  return normalizeHeading(previous + delta * factor)
}

export function geolocationErrorStatus(code: number): GeolocationStatus {
  if (code === 1) return 'permission-denied'
  if (code === 3) return 'timeout'
  return 'unavailable'
}

export function geolocationErrorMessage(code: number): string {
  if (code === 1) return '위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.'
  if (code === 2) return '현재 위치를 확인하지 못했습니다. 위치 서비스를 확인하거나 출발지를 직접 선택해 주세요.'
  if (code === 3) return '현재 위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.'
  return '현재 위치를 확인하지 못했습니다.'
}

function debugGeolocation(event: string, detail: Record<string, unknown>) {
  if (import.meta.env?.DEV) console.debug(`[geolocation:${event}] ${JSON.stringify(detail)}`)
}

async function debugGeolocationPermission() {
  if (!import.meta.env?.DEV || !navigator.permissions?.query) return
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' })
    debugGeolocation('permission', { state: permission.state })
  } catch {
    debugGeolocation('permission', { state: 'unavailable' })
  }
}
