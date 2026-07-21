import assert from 'node:assert/strict'
import test from 'node:test'
import type { PopupStore } from '../types/popupStore'
import { buildOsrmRouteUrl, parseOsrmResponse, RouteRequestError } from './osrm'

function store(id: number, longitude: number | null, latitude: number | null): PopupStore {
  return {
    id,
    name: `테스트 ${id}`,
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

test('OSRM URL은 longitude,latitude 순서와 지정 쿼리를 사용한다', () => {
  const url = buildOsrmRouteUrl(
    [store(1, 127.05, 37.54), store(2, 127.06, 37.55)],
    'https://osrm.example/',
  )
  assert.equal(
    url,
    'https://osrm.example/route/v1/driving/127.05,37.54;127.06,37.55?overview=full&geometries=geojson&steps=false',
  )
})

test('잘못된 좌표가 있으면 요청 URL 생성을 차단한다', () => {
  assert.throws(
    () => buildOsrmRouteUrl([store(1, null, 37.54), store(2, 127.06, 37.55)]),
    RouteRequestError,
  )
})

test('정상 OSRM 응답의 경로, 거리, 시간을 파싱한다', () => {
  const result = parseOsrmResponse({
    code: 'Ok',
    routes: [{
      distance: 4_800,
      duration: 1_080,
      geometry: { type: 'LineString', coordinates: [[127.05, 37.54], [127.06, 37.55]] },
    }],
  })
  assert.deepEqual(result.coordinates, [[127.05, 37.54], [127.06, 37.55]])
  assert.equal(result.distanceMeters, 4_800)
  assert.equal(result.durationSeconds, 1_080)
})
