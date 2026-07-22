import assert from 'node:assert/strict'
import test from 'node:test'
import { addRating, removeRating, replaceRating } from './reviewSummary'

test('리뷰 작성 수정 삭제 시 평균과 개수를 일관되게 갱신한다', () => {
  const added = addRating({ averageRating: 4, reviewCount: 2 }, 5)
  assert.deepEqual(added, { averageRating: 13 / 3, reviewCount: 3 })
  const replaced = replaceRating(added, 5, 2)
  assert.equal(replaced.averageRating, 10 / 3)
  assert.deepEqual(removeRating(replaced, 2), { averageRating: 4, reviewCount: 2 })
})
