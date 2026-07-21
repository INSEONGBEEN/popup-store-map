import assert from 'node:assert/strict'
import test from 'node:test'
import { fromLonLat } from 'ol/proj.js'
import { createRouteFeature } from './popupStoreRoute'

test('API 상세 경로의 모든 좌표를 EPSG:3857 LineString으로 변환한다', () => {
  const coordinates = Array.from({ length: 30 }, (_, index) => (
    [127.05 + index * 0.0001, 37.54 + index * 0.00005] as [number, number]
  ))

  const feature = createRouteFeature(coordinates)
  const projected = feature?.getGeometry()?.getCoordinates()

  assert.equal(projected?.length, 30)
  assert.deepEqual(projected?.[0], fromLonLat(coordinates[0]))
  assert.deepEqual(projected?.[29], fromLonLat(coordinates[29]))
})

test('경로 응답이 없거나 좌표가 잘못되면 직선 fallback을 만들지 않는다', () => {
  assert.equal(createRouteFeature([]), null)
  assert.equal(createRouteFeature([[127.05, 37.54]]), null)
  assert.equal(createRouteFeature([[127.05, 37.54], [Number.NaN, 37.55]]), null)
})
