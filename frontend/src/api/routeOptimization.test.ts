import assert from 'node:assert/strict'
import test from 'node:test'
import { toOptimizationRequest } from './routeOptimization'
import type { PopupStore } from '../types/popupStore'

test('최적화 요청은 longitude latitude 의미를 보존한다', () => {
  const store = { id: 7, longitude: 127.05, latitude: 37.54 } as PopupStore
  const request = toOptimizationRequest([127.04, 37.53], [store])
  assert.deepEqual(request.origin, { longitude: 127.04, latitude: 37.53 })
  assert.deepEqual(request.destinations[0], {
    id: 7,
    coordinate: { longitude: 127.05, latitude: 37.54 },
  })
})
