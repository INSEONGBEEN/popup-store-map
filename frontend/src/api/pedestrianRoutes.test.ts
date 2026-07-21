import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mergeRoutePlanWithResponse,
  parsePedestrianRouteResponse,
  toPedestrianRouteRequest,
} from './pedestrianRoutes'

test('Backend 요청을 longitude, latitude 의미가 명확한 객체로 변환한다', () => {
  assert.deepEqual(
    toPedestrianRouteRequest([[127.05, 37.54], [127.06, 37.55]]),
    { coordinates: [
      { longitude: 127.05, latitude: 37.54 },
      { longitude: 127.06, latitude: 37.55 },
    ] },
  )
})

test('Backend 경로 응답을 지도 좌표 배열로 변환한다', () => {
  const result = parsePedestrianRouteResponse({
    coordinates: [
      { longitude: 127.05, latitude: 37.54 },
      { longitude: 127.06, latitude: 37.55 },
    ],
    distanceMeters: 1_200,
    durationSeconds: 900,
    legs: [{ index: 0, distanceMeters: 1_200, durationSeconds: 900, maneuvers: [] }],
  })
  assert.deepEqual(result.coordinates, [[127.05, 37.54], [127.06, 37.55]])
  assert.equal(result.distanceMeters, 1_200)
})

test('API 상세 경로 좌표가 요청 경유지 좌표에 의해 덮어써지지 않는다', () => {
  const requestCoordinates = [[127.05, 37.54], [127.06, 37.55]] as const
  const routeCoordinates = Array.from({ length: 20 }, (_, index) => ({
    longitude: 127.05 + index * 0.0001,
    latitude: 37.54 + index * 0.0001,
  }))
  const result = mergeRoutePlanWithResponse({
    coordinates: requestCoordinates.map((coordinate) => [...coordinate]),
    departureName: '성수역',
    destinationName: '팝업 B',
    popupStoreCount: 2,
  }, {
    coordinates: routeCoordinates,
    distanceMeters: 1_200,
    durationSeconds: 900,
    legs: [{ index: 0, distanceMeters: 1_200, durationSeconds: 900, maneuvers: [] }],
  })

  assert.equal(result.coordinates.length, 20)
  assert.deepEqual(result.coordinates[0], [127.05, 37.54])
  assert.deepEqual(result.coordinates[19], [127.0519, 37.5419])
})
