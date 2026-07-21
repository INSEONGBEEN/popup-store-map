import assert from 'node:assert/strict'
import test from 'node:test'
import type { PopupStore } from '../../types/popupStore'
import {
  addSelectedStore,
  MAX_ROUTE_STORES,
  moveSelectedStore,
  removeSelectedStore,
  routeStatusAfterSelectionChange,
} from './routeSelection'

function store(id: number): PopupStore {
  return {
    id,
    name: `테스트 ${id}`,
    address: `성수동 ${id}`,
    latitude: 37.54,
    longitude: 127.05,
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

test('같은 팝업스토어를 중복 선택하지 않는다', () => {
  const selected = [store(1)]
  const result = addSelectedStore(selected, store(1))
  assert.equal(result.result, 'duplicate')
  assert.strictEqual(result.stores, selected)
})

test('최대 8개까지만 선택한다', () => {
  const selected = Array.from({ length: MAX_ROUTE_STORES }, (_, index) => store(index + 1))
  const result = addSelectedStore(selected, store(9))
  assert.equal(result.result, 'limit')
  assert.equal(result.stores.length, 8)
})

test('선택 순서를 이동하고 항목을 제거한다', () => {
  const selected = [store(1), store(2), store(3)]
  const moved = moveSelectedStore(selected, 2, 'up')
  assert.deepEqual(moved.map(({ id }) => id), [2, 1, 3])
  assert.deepEqual(removeSelectedStore(moved, 1).map(({ id }) => id), [2, 3])
})

test('계산된 경로는 선택 변경 시 stale 상태가 된다', () => {
  assert.equal(routeStatusAfterSelectionChange('success'), 'stale')
  assert.equal(routeStatusAfterSelectionChange('loading'), 'stale')
  assert.equal(routeStatusAfterSelectionChange('idle'), 'idle')
})
