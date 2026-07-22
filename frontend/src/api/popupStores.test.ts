import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizePopupStores } from './popupStores'
import type { PopupStore } from '../types/popupStore'

function store(id: number): PopupStore {
  return {
    id, name: `팝업 ${id}`, address: '서울특별시 성동구', latitude: 37.54, longitude: 127.05,
    startDate: '2026-07-01', endDate: '2026-08-01', category: 'ETC', status: 'OPEN',
    description: null, imageUrl: null, createdAt: '', updatedAt: '',
    engagement: { viewCount: id, likeCount: 0, planAddCount: 0, likedByCurrentVisitor: false },
  }
}

test('Featured API가 정한 팝업 순서를 Frontend 정규화가 그대로 유지한다', () => {
  const ranked = [store(18), store(7), store(10)]
  assert.deepEqual(normalizePopupStores(ranked).map(({ id }) => id), [18, 7, 10])
})

test('참여 지표가 없는 이전 응답도 카드별 추가 요청 없이 0으로 보완한다', () => {
  const legacy = { ...store(1), engagement: undefined } as unknown as PopupStore
  assert.deepEqual(normalizePopupStores([legacy])[0].engagement, {
    viewCount: 0,
    likeCount: 0,
    planAddCount: 0,
    likedByCurrentVisitor: false,
  })
})
