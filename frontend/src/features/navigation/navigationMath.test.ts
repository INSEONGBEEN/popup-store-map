import assert from 'node:assert/strict'
import test from 'node:test'
import { haversineMeters, nextManeuver, projectOntoRoute, remainingDuration, shouldConfirmOffRoute } from './navigationMath'
import type { RouteResult } from '../route/routeTypes'

test('위치를 상세 경로 구간에 투영하고 남은 거리를 계산한다', () => {
  const projection = projectOntoRoute([127.0005, 37.0001], [[127, 37], [127.001, 37], [127.002, 37]])
  assert.ok(projection)
  assert.equal(projection.segmentIndex, 0)
  assert.ok(projection.distanceToRouteMeters < 20)
  assert.ok(projection.remainingDistanceMeters > haversineMeters([127.001, 37], [127.002, 37]))
})

test('정확도가 나쁘면 이탈을 확정하지 않고 3회 연속 초과만 확정한다', () => {
  assert.equal(shouldConfirmOffRoute([40, 42, 45], 80), false)
  assert.equal(shouldConfirmOffRoute([40, 42], 10), false)
  assert.equal(shouldConfirmOffRoute([40, 42, 45], 10), true)
})

test('현재 shape index 이후 maneuver와 거리 비례 ETA를 선택한다', () => {
  const route = {
    coordinates: [[127, 37], [127.001, 37]], distanceMeters: 100, durationSeconds: 80,
    departureName: '현재 위치', destinationName: '목적지', popupStoreCount: 1,
    legs: [{ index: 0, distanceMeters: 100, durationSeconds: 80, maneuvers: [
      { instruction: '직진', maneuverType: 1, distanceMeters: 50, durationSeconds: 40, streetNames: [], beginShapeIndex: 0, endShapeIndex: 1 },
    ] }],
  } as RouteResult
  assert.equal(nextManeuver(route, 0)?.instruction, '직진')
  assert.equal(remainingDuration(route, 50), 40)
})
