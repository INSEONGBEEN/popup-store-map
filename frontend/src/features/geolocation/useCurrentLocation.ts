import { useCallback, useEffect, useRef, useState } from 'react'
import type { CurrentLocation } from '../route/routeTypes'

type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error'

export function useCurrentLocation() {
  const [location, setLocation] = useState<CurrentLocation | null>(null)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => () => {
    mountedRef.current = false
  }, [])

  const requestLocation = useCallback(() => {
    if (!window.isSecureContext) {
      setStatus('error')
      setErrorMessage('현재 위치는 localhost 또는 HTTPS 환경에서만 사용할 수 있습니다.')
      return
    }
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMessage('이 브라우저에서는 현재 위치 기능을 사용할 수 없습니다.')
      return
    }

    setStatus('loading')
    setErrorMessage(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!mountedRef.current) return
        setLocation({
          coordinate: [coords.longitude, coords.latitude],
          accuracyMeters: Math.max(0, coords.accuracy),
        })
        setStatus('success')
      },
      (error) => {
        if (!mountedRef.current) return
        setStatus('error')
        setErrorMessage(geolocationErrorMessage(error.code))
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  }, [])

  return { location, status, errorMessage, requestLocation }
}

export function geolocationErrorMessage(code: number): string {
  if (code === 1) {
    return '위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.'
  }
  if (code === 2) {
    return '현재 위치 정보를 확인할 수 없습니다.'
  }
  if (code === 3) {
    return '현재 위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.'
  }
  return '현재 위치를 확인하지 못했습니다.'
}
