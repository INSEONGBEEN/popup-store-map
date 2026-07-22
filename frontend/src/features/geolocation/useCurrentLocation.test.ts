import assert from 'node:assert/strict'
import test from 'node:test'
import {
  acquireInitialPosition,
  acquireFromWatcherThenRequest,
  clearWatchIfActive,
  HIGH_ACCURACY_RETRY_OPTIONS,
  INITIAL_POSITION_OPTIONS,
  RECENT_POSITION_OPTIONS,
  startWatchOnce,
  watchErrorAction,
} from './geolocationAcquisition'
import {
  geolocationErrorMessage,
  geolocationErrorStatus,
  headingFromOrientation,
  preferredHeading,
  smoothHeading,
} from './useCurrentLocation'

test('위치 권한 거부 오류를 사용자 메시지로 변환한다', () => {
  assert.equal(
    geolocationErrorMessage(1),
    '위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.',
  )
})

test('heading smoothing은 359도와 1도 사이의 짧은 방향으로 보간한다', () => {
  const heading = smoothHeading(359, 1, 0.5)
  assert.equal(heading, 0)
})

test('DeviceOrientation alpha를 북쪽 기준 heading으로 변환한다', () => {
  assert.equal(headingFromOrientation({ alpha: 90 } as DeviceOrientationEvent), 270)
  assert.equal(headingFromOrientation({ alpha: 90 } as DeviceOrientationEvent, 90), 0)
  assert.equal(headingFromOrientation({ webkitCompassHeading: 350 } as DeviceOrientationEvent, 20), 10)
  assert.equal(headingFromOrientation({ alpha: null } as DeviceOrientationEvent), null)
})

test('정지·저속 GPS course는 compass heading을 덮어쓰지 않는다', () => {
  assert.equal(preferredHeading(180, 0, 45), 45)
  assert.equal(preferredHeading(180, 0.3, 45), 45)
  assert.equal(preferredHeading(180, 1.2, 45), 180)
  assert.equal(preferredHeading(null, null, 370), 10)
})

test('위치 사용 불가와 timeout 오류를 구분한다', () => {
  assert.equal(
    geolocationErrorMessage(2),
    '현재 위치를 확인하지 못했습니다. 위치 서비스를 확인하거나 출발지를 직접 선택해 주세요.',
  )
  assert.equal(geolocationErrorMessage(3), '현재 위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.')
  assert.equal(geolocationErrorStatus(1), 'permission-denied')
  assert.equal(geolocationErrorStatus(2), 'unavailable')
  assert.equal(geolocationErrorStatus(3), 'timeout')
})

function position(longitude = 127.05, latitude = 37.54): GeolocationPosition {
  return {
    coords: { longitude, latitude, accuracy: 80, altitude: null, altitudeAccuracy: null,
      heading: null, speed: null },
    timestamp: Date.now(),
  }
}

function positionError(code: number): GeolocationPositionError {
  return { code, message: `error-${code}`, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }
}

test('최근 브라우저 좌표가 있으면 이를 먼저 반환하고 네트워크 요청을 하지 않는다', async () => {
  const options: PositionOptions[] = []
  const geolocation = {
    getCurrentPosition(success: PositionCallback, _error: PositionErrorCallback, option?: PositionOptions) {
      options.push(option ?? {})
      success(position())
    },
  } as Geolocation
  const result = await acquireInitialPosition(geolocation)
  assert.equal(result.coords.longitude, 127.05)
  assert.deepEqual(options, [RECENT_POSITION_OPTIONS])
})

test('최근 좌표와 fresh 위치가 모두 없으면 고정밀 요청을 한 번만 재시도한다', async () => {
  const options: PositionOptions[] = []
  let retryCount = 0
  const geolocation = {
    getCurrentPosition(success: PositionCallback, failure: PositionErrorCallback, option?: PositionOptions) {
      options.push(option ?? {})
      if (options.length < 3) failure(positionError(2))
      else success(position(127.051, 37.541))
    },
  } as Geolocation
  const result = await acquireInitialPosition(geolocation, { onRetry: () => retryCount++ })
  assert.equal(result.coords.latitude, 37.541)
  assert.equal(retryCount, 1)
  assert.deepEqual(options, [RECENT_POSITION_OPTIONS, INITIAL_POSITION_OPTIONS, HIGH_ACCURACY_RETRY_OPTIONS])
})

test('권한 거부는 추가 위치 요청 없이 그대로 실패한다', async () => {
  for (const code of [1]) {
    let calls = 0
    const geolocation = {
      getCurrentPosition(_success: PositionCallback, failure: PositionErrorCallback) {
        calls++
        failure(positionError(code))
      },
    } as Geolocation
    await assert.rejects(acquireInitialPosition(geolocation))
    assert.equal(calls, 1)
  }
})

test('fresh 위치 timeout도 마지막 고정밀 요청으로 재시도한다', async () => {
  const options: PositionOptions[] = []
  const geolocation = {
    getCurrentPosition(success: PositionCallback, failure: PositionErrorCallback, option?: PositionOptions) {
      options.push(option ?? {})
      if (options.length === 1) failure(positionError(2))
      else if (options.length === 2) failure(positionError(3))
      else success(position())
    },
  } as Geolocation
  await acquireInitialPosition(geolocation)
  assert.deepEqual(options, [RECENT_POSITION_OPTIONS, INITIAL_POSITION_OPTIONS, HIGH_ACCURACY_RETRY_OPTIONS])
})

test('watcher는 기존 ID가 있으면 중복 생성하지 않고 활성 ID만 정리한다', () => {
  let watchCalls = 0
  const cleared: number[] = []
  const geolocation = {
    watchPosition() { watchCalls++; return 41 },
    clearWatch(id: number) { cleared.push(id) },
  } as unknown as Geolocation
  const first = startWatchOnce(geolocation, null, () => undefined, () => undefined)
  const duplicate = startWatchOnce(geolocation, first, () => undefined, () => undefined)
  assert.equal(first, 41)
  assert.equal(duplicate, 41)
  assert.equal(watchCalls, 1)
  assert.equal(clearWatchIfActive(geolocation, duplicate), null)
  assert.deepEqual(cleared, [41])
})

test('watcher 오류가 발생해도 기존 유효 위치는 제거하지 않는다', () => {
  assert.equal(watchErrorAction(true, 2), 'preserve-location')
  assert.equal(watchErrorAction(true, 3), 'preserve-location')
  assert.equal(watchErrorAction(false, 1), 'stop-watcher')
  assert.equal(watchErrorAction(false, 2), 'report-error')
})

test('MacBook 네트워크 위치는 다른 요청과 경쟁시키지 않고 watcher 결과를 우선 사용한다', async () => {
  let fallbackCalls = 0
  const result = await acquireFromWatcherThenRequest(
    Promise.resolve('wifi-watch-position'),
    async () => { fallbackCalls++; return 'requested-position' },
  )
  assert.equal(result, 'wifi-watch-position')
  assert.equal(fallbackCalls, 0)
})

test('watcher가 위치 사용 불가이면 그 이후에만 일회성 요청을 실행한다', async () => {
  let fallbackCalls = 0
  const result = await acquireFromWatcherThenRequest(
    Promise.reject(positionError(2)),
    async () => { fallbackCalls++; return 'fallback-position' },
  )
  assert.equal(result, 'fallback-position')
  assert.equal(fallbackCalls, 1)
})

test('watcher 권한 거부는 추가 위치 요청 없이 바로 실패한다', async () => {
  let fallbackCalls = 0
  await assert.rejects(acquireFromWatcherThenRequest(
    Promise.reject(positionError(1)),
    async () => { fallbackCalls++; return 'fallback-position' },
  ))
  assert.equal(fallbackCalls, 0)
})
