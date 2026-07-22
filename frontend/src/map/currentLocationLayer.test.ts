import assert from 'node:assert/strict'
import test from 'node:test'
import Polygon from 'ol/geom/Polygon.js'
import { createCurrentLocationFeatures, createHeadingCone, createHeadingTriangle, normalizeMapHeading } from './currentLocationLayer'
import type { CurrentLocation } from '../features/route/routeTypes'

const location: CurrentLocation = {
  coordinate: [127.05, 37.54],
  accuracyMeters: 12,
  headingDegrees: 90,
  speedMetersPerSecond: 1,
  timestamp: 1,
}

test('현재 위치 레이어는 accuracy, cone, triangle, marker 네 feature를 생성한다', () => {
  const result = createCurrentLocationFeatures(location)
  assert.deepEqual(result.features.map((feature) => feature.get('kind')), [
    'accuracy', 'heading-cone', 'heading-triangle', 'marker',
  ])
  const cone = result.features[1].getGeometry() as Polygon
  assert.ok(cone.getCoordinates().length > 0)
})

test('heading이 없으면 cone geometry와 triangle heading을 숨긴다', () => {
  const result = createCurrentLocationFeatures({ ...location, headingDegrees: null })
  const cone = result.features[1].getGeometry() as Polygon
  assert.equal(cone.getCoordinates().length, 0)
  assert.equal(result.features[2].get('headingDegrees'), null)
})

test('Cone과 Triangle은 북쪽 기준 시계 방향 heading 축을 함께 사용한다', () => {
  const center = [0, 0]
  for (const [heading, expectedAxis] of [[0, 'north'], [90, 'east'], [180, 'south'], [270, 'west']] as const) {
    const coneRing = createHeadingCone(center, heading, 55).getCoordinates()[0]
    const triangleRing = createHeadingTriangle(center, heading).getCoordinates()[0]
    const coneCenterPoint = coneRing[5]
    const triangleTip = triangleRing[0]
    if (expectedAxis === 'north') assert.ok(coneCenterPoint[1] > 0 && triangleTip[1] > 0)
    if (expectedAxis === 'east') assert.ok(coneCenterPoint[0] > 0 && triangleTip[0] > 0)
    if (expectedAxis === 'south') assert.ok(coneCenterPoint[1] < 0 && triangleTip[1] < 0)
    if (expectedAxis === 'west') assert.ok(coneCenterPoint[0] < 0 && triangleTip[0] < 0)
  }
})

test('heading은 항상 0 이상 360 미만으로 정규화한다', () => {
  assert.equal(normalizeMapHeading(-90), 270)
  assert.equal(normalizeMapHeading(450), 90)
})
