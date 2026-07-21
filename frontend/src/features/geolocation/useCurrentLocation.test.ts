import assert from 'node:assert/strict'
import test from 'node:test'
import { geolocationErrorMessage } from './useCurrentLocation'

test('위치 권한 거부 오류를 사용자 메시지로 변환한다', () => {
  assert.equal(
    geolocationErrorMessage(1),
    '위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.',
  )
})

test('위치 사용 불가와 timeout 오류를 구분한다', () => {
  assert.equal(geolocationErrorMessage(2), '현재 위치 정보를 확인할 수 없습니다.')
  assert.equal(geolocationErrorMessage(3), '현재 위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.')
})
