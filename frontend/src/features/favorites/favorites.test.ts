import assert from 'node:assert/strict'
import test from 'node:test'
import type { FavoriteItem } from '../../api/favorites'
import type { PopupStore } from '../../types/popupStore'
import { optimisticFavoriteItems } from './useFavorites'

const store = { id: 7, name: '테스트 팝업' } as PopupStore

test('즐겨찾기 optimistic 추가는 같은 팝업을 중복 생성하지 않는다', () => {
  const initial: FavoriteItem[] = [{ id: 1, popupStore: store, createdAt: '2026-07-23' }]
  const result = optimisticFavoriteItems(initial, store, false, '2026-07-24')
  assert.equal(result.length, 1)
  assert.equal(result[0].createdAt, '2026-07-24')
})

test('즐겨찾기 optimistic 해제는 해당 팝업만 제거한다', () => {
  const other = { id: 8, name: '다른 팝업' } as PopupStore
  const initial: FavoriteItem[] = [
    { id: 1, popupStore: store, createdAt: '2026-07-23' },
    { id: 2, popupStore: other, createdAt: '2026-07-23' },
  ]
  const result = optimisticFavoriteItems(initial, store, true, 'ignored')
  assert.deepEqual(result.map((item) => item.popupStore.id), [8])
})
