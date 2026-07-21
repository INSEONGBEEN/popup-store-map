import { useCallback, useEffect, useRef, useState } from 'react'
import type { CurrentLocation } from '../route/routeTypes'

export type GeolocationStatus =
  | 'idle' | 'locating' | 'tracking' | 'permission-denied' | 'unavailable' | 'timeout' | 'stopped'

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 3_000,
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<CurrentLocation | null>(null)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [followMode, setFollowMode] = useState(true)
  const [recenterToken, setRecenterToken] = useState(0)
  const watchIdRef = useRef<number | null>(null)

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setStatus('stopped')
  }, [])

  const requestLocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      setFollowMode(true)
      setRecenterToken((value) => value + 1)
      return
    }
    if (!window.isSecureContext) {
      setStatus('unavailable')
      setErrorMessage('현재 위치는 localhost 또는 HTTPS 환경에서만 사용할 수 있습니다.')
      return
    }
    if (!navigator.geolocation) {
      setStatus('unavailable')
      setErrorMessage('이 브라우저에서는 현재 위치 기능을 사용할 수 없습니다.')
      return
    }

    setStatus('locating')
    setErrorMessage(null)
    setFollowMode(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        setLocation({
          coordinate: [coords.longitude, coords.latitude],
          accuracyMeters: Math.max(0, coords.accuracy),
          headingDegrees: Number.isFinite(coords.heading) ? coords.heading : null,
          speedMetersPerSecond: Number.isFinite(coords.speed) ? coords.speed : null,
          timestamp,
        })
        setStatus('tracking')
        setErrorMessage(null)
      },
      (error) => {
        const nextStatus = geolocationErrorStatus(error.code)
        setStatus(nextStatus)
        setErrorMessage(geolocationErrorMessage(error.code))
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      },
      WATCH_OPTIONS,
    )
  }, [])

  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  return {
    location, status, errorMessage, followMode, recenterToken,
    requestLocation, stopTracking,
    pauseFollow: () => setFollowMode(false),
    resumeFollow: () => {
      setFollowMode(true)
      setRecenterToken((value) => value + 1)
    },
  }
}

export function geolocationErrorStatus(code: number): GeolocationStatus {
  if (code === 1) return 'permission-denied'
  if (code === 3) return 'timeout'
  return 'unavailable'
}

export function geolocationErrorMessage(code: number): string {
  if (code === 1) return '위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.'
  if (code === 2) return '현재 위치 정보를 확인할 수 없습니다.'
  if (code === 3) return '현재 위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.'
  return '현재 위치를 확인하지 못했습니다.'
}
