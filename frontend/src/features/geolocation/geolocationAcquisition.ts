export const RECENT_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 4_000,
  maximumAge: 24 * 60 * 60 * 1_000,
}

export const INITIAL_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 18_000,
  maximumAge: 5 * 60 * 1_000,
}

export const HIGH_ACCURACY_RETRY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 25_000,
  maximumAge: 0,
}

export const WATCH_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 3_000,
}

interface InitialPositionCallbacks {
  onAttempt?: (options: PositionOptions, attempt: PositionAttempt) => void
  onFailure?: (error: GeolocationPositionError, attempt: PositionAttempt) => void
  onRetry?: () => void
  onSuccess?: (position: GeolocationPosition, attempt: PositionAttempt) => void
}

export type PositionAttempt = 'recent-cache' | 'network' | 'high-accuracy'

function requestPosition(
  geolocation: Geolocation,
  options: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(resolve, reject, options)
  })
}

export async function acquireInitialPosition(
  geolocation: Geolocation,
  callbacks: InitialPositionCallbacks = {},
): Promise<GeolocationPosition> {
  callbacks.onAttempt?.(RECENT_POSITION_OPTIONS, 'recent-cache')
  try {
    const position = await requestPosition(geolocation, RECENT_POSITION_OPTIONS)
    callbacks.onSuccess?.(position, 'recent-cache')
    return position
  } catch (error) {
    const positionError = error as GeolocationPositionError
    callbacks.onFailure?.(positionError, 'recent-cache')
    if (positionError.code === positionError.PERMISSION_DENIED || positionError.code === 1) throw error
  }

  callbacks.onAttempt?.(INITIAL_POSITION_OPTIONS, 'network')
  try {
    const position = await requestPosition(geolocation, INITIAL_POSITION_OPTIONS)
    callbacks.onSuccess?.(position, 'network')
    return position
  } catch (error) {
    const positionError = error as GeolocationPositionError
    callbacks.onFailure?.(positionError, 'network')
    const canRetry = positionError.code === positionError.POSITION_UNAVAILABLE ||
      positionError.code === positionError.TIMEOUT || positionError.code === 2 || positionError.code === 3
    if (!canRetry) throw error
  }

  callbacks.onRetry?.()
  callbacks.onAttempt?.(HIGH_ACCURACY_RETRY_OPTIONS, 'high-accuracy')
  try {
    const position = await requestPosition(geolocation, HIGH_ACCURACY_RETRY_OPTIONS)
    callbacks.onSuccess?.(position, 'high-accuracy')
    return position
  } catch (error) {
    callbacks.onFailure?.(error as GeolocationPositionError, 'high-accuracy')
    throw error
  }
}

export function startWatchOnce(
  geolocation: Geolocation,
  currentWatchId: number | null,
  onSuccess: PositionCallback,
  onError: PositionErrorCallback,
): number {
  if (currentWatchId !== null) return currentWatchId
  return geolocation.watchPosition(onSuccess, onError, WATCH_POSITION_OPTIONS)
}

export function clearWatchIfActive(geolocation: Geolocation, watchId: number | null): null {
  if (watchId !== null) geolocation.clearWatch(watchId)
  return null
}

export function watchErrorAction(
  hasValidLocation: boolean,
  errorCode: number,
): 'preserve-location' | 'stop-watcher' | 'report-error' {
  if (hasValidLocation) return 'preserve-location'
  if (errorCode === 1) return 'stop-watcher'
  return 'report-error'
}

export async function acquireFromWatcherThenRequest<T>(
  watcherPosition: Promise<T>,
  requestFallback: () => Promise<T>,
  onFallback?: () => void,
): Promise<T> {
  try {
    return await watcherPosition
  } catch (error) {
    const positionError = error as GeolocationPositionError
    if (positionError.code === positionError.PERMISSION_DENIED || positionError.code === 1) throw error
    onFallback?.()
    return requestFallback()
  }
}
