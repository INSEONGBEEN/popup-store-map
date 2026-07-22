import assert from 'node:assert/strict'
import test from 'node:test'
import { filterPopupStores, formatMetricCount, shouldExecuteSearch } from './popupDiscoveryUtils'
import type { PopupStore } from '../../types/popupStore'

const engagement = { viewCount: 0, likeCount: 0, planAddCount: 0, likedByCurrentVisitor: false }
const stores: PopupStore[] = [
  { id: 1, name: '성수 패션 팝업', address: '서울특별시 성동구 성수동', latitude: 37.5, longitude: 127.0,
    startDate: '2026-07-01', endDate: '2026-07-30', category: 'FASHION', status: 'OPEN', description: null,
    imageUrl: null, createdAt: '', updatedAt: '', engagement },
  { id: 2, name: '서울숲 뷰티 랩', address: '서울특별시 성동구 서울숲길', latitude: 37.5, longitude: 127.0,
    startDate: '2026-08-01', endDate: '2026-08-30', category: 'BEAUTY', status: 'UPCOMING', description: null,
    imageUrl: null, createdAt: '', updatedAt: '', engagement },
]

test('검색과 카테고리 필터를 같은 목록에 AND로 적용한다', () => {
  assert.deepEqual(filterPopupStores(stores, 'FASHION', '성수').map(({ id }) => id), [1])
  assert.deepEqual(filterPopupStores(stores, 'BEAUTY', '성수'), [])
  assert.deepEqual(filterPopupStores(stores, 'ALL', '서울숲').map(({ id }) => id), [2])
})

test('참여 지표 숫자를 천과 만 단위로 포맷한다', () => {
  assert.equal(formatMetricCount(999), '999')
  assert.equal(formatMetricCount(1_200), '1.2천')
  assert.equal(formatMetricCount(12_000), '1.2만')
})

test('검색은 Enter에서만 실행하고 한글 IME 조합 중 Enter는 무시한다', () => {
  assert.equal(shouldExecuteSearch('Enter', false), true)
  assert.equal(shouldExecuteSearch('Enter', true), false)
  assert.equal(shouldExecuteSearch('a', false), false)
})
