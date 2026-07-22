import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import {
  getAccessToken,
  refreshAccessTokenOnce,
  resetAuthSessionForTest,
  setAccessToken,
  setRefreshHandler,
} from './authSession'

afterEach(resetAuthSessionForTest)

test('access token은 브라우저 저장소가 아닌 메모리에만 유지한다', () => {
  setAccessToken('memory-token')
  assert.equal(getAccessToken(), 'memory-token')
  setAccessToken(null)
  assert.equal(getAccessToken(), null)
})

test('동시에 발생한 refresh 요청은 하나의 single-flight를 공유한다', async () => {
  let calls = 0
  let complete!: (value: string) => void
  setRefreshHandler(() => {
    calls += 1
    return new Promise((resolve) => { complete = resolve })
  })

  const first = refreshAccessTokenOnce()
  const second = refreshAccessTokenOnce()
  assert.equal(calls, 1)
  complete('new-access-token')
  assert.deepEqual(await Promise.all([first, second]), ['new-access-token', 'new-access-token'])
})

test('refresh 완료 후 다음 갱신은 새 요청을 실행한다', async () => {
  let calls = 0
  setRefreshHandler(async () => `token-${++calls}`)

  assert.equal(await refreshAccessTokenOnce(), 'token-1')
  assert.equal(await refreshAccessTokenOnce(), 'token-2')
  assert.equal(calls, 2)
})
