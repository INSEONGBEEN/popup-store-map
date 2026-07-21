import assert from 'node:assert/strict'
import test from 'node:test'
import { formatDistance, formatDuration } from './routeFormatters'

test('거리를 m와 km로 포맷한다', () => {
  assert.equal(formatDistance(850), '850m')
  assert.equal(formatDistance(4_760), '4.8km')
})

test('시간을 분과 시간으로 포맷한다', () => {
  assert.equal(formatDuration(18 * 60), '18분')
  assert.equal(formatDuration(75 * 60), '1시간 15분')
})
