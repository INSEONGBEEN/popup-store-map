import assert from 'node:assert/strict'
import test from 'node:test'
import { markArrivalOnce } from './navigationArrival'

test('같은 Navigation 방문지 도착 이벤트는 한 번만 기록한다', () => {
  const arrived = new Set<number>()
  assert.equal(markArrivalOnce(arrived, 12), true)
  assert.equal(markArrivalOnce(arrived, 12), false)
  assert.equal(markArrivalOnce(arrived, 13), true)
})
