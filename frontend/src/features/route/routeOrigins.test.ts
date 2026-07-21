import assert from 'node:assert/strict'
import test from 'node:test'
import type { PopupStore } from '../../types/popupStore'
import { buildRoutePlan, RoutePlanError, SEONGSU_STATION } from './routeOrigins'

function store(id: number, longitude: number, latitude: number): PopupStore {
  return {
    id,
    name: `팝업 ${id}`,
    address: '서울 성동구 성수동',
    longitude,
    latitude,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    category: 'ETC',
    status: 'OPEN',
    description: null,
    imageUrl: null,
    createdAt: '2026-07-01T00:00:00',
    updatedAt: '2026-07-01T00:00:00',
  }
}

const stores = [store(1, 127.05, 37.54), store(2, 127.06, 37.55)]

test('성수역 출발은 역 좌표 뒤에 팝업 순서를 유지한다', () => {
  const plan = buildRoutePlan('SEONGSU_STATION', stores, null)
  assert.deepEqual(plan.coordinates, [SEONGSU_STATION.coordinate, [127.05, 37.54], [127.06, 37.55]])
  assert.equal(plan.departureName, '성수역')
  assert.equal(plan.popupStoreCount, 2)
})

test('현재 위치 출발은 확보된 위치를 첫 좌표로 사용한다', () => {
  const plan = buildRoutePlan('CURRENT_LOCATION', stores, {
    coordinate: [127.04, 37.53],
    accuracyMeters: 20,
  })
  assert.deepEqual(plan.coordinates[0], [127.04, 37.53])
  assert.equal(plan.departureName, '현재 위치')
})

test('현재 위치가 없으면 요청 계획 생성을 차단한다', () => {
  assert.throws(() => buildRoutePlan('CURRENT_LOCATION', stores, null), RoutePlanError)
})

test('첫 팝업 출발은 기존 팝업 선택 순서만 사용한다', () => {
  const plan = buildRoutePlan('FIRST_SELECTED_STORE', stores, null)
  assert.deepEqual(plan.coordinates, [[127.05, 37.54], [127.06, 37.55]])
  assert.equal(plan.departureName, '팝업 1')
})
