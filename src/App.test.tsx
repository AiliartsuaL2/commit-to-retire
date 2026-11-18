import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { GameState } from './engine'
import { randomGame } from './engine/bot'
import { endingResult } from './engine/career'
import { evaluateRetirement } from './engine/ending'
import { resultUrl } from './engine/share'
import App from './App'

const store = vi.hoisted(() => ({ game: null as GameState | null, reset: vi.fn(), lastOutcome: null }))
vi.mock('./store/game', () => ({ useGame: (selector: (state: typeof store) => unknown) => selector(store) }))

afterEach(() => {
  store.game = null
  store.reset.mockClear()
  vi.unstubAllGlobals()
})

describe('공유 링크 화면 진입', () => {
  it.each([false, true])('저장된 게임 유무(%s)와 관계없이 공유한 사람의 결과를 먼저 보여준다', (hasSave) => {
    const shared = randomGame(1)
    shared.profile.name = '공유한 사람'
    shared.retirement = evaluateRetirement(shared, 'voluntary')
    const url = new URL(resultUrl(endingResult(shared), 'https://example.com/'))
    vi.stubGlobal('window', { location: url })
    if (hasSave) store.game = randomGame(2)
    const before = structuredClone(store.game)
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('공유받은 커리어 결과예요')
    expect(html).toContain('공유한 사람')
    expect(html).toContain('커리어 요약')
    expect(store.game).toEqual(before)
    expect(store.reset).not.toHaveBeenCalled()
  })

  it('잘린 링크는 안내 화면을 보여주고 저장된 게임을 유지한다', () => {
    vi.stubGlobal('window', { location: new URL('https://example.com/#result=broken') })
    store.game = randomGame(2)
    const before = structuredClone(store.game)
    expect(renderToStaticMarkup(<App />)).toContain('공유 링크를 확인해 주세요')
    expect(store.game).toEqual(before)
    expect(store.reset).not.toHaveBeenCalled()
  })

  it('공유 링크가 없으면 저장된 은퇴 결과를 다시 열 수 있다', () => {
    vi.stubGlobal('window', { location: new URL('https://example.com/') })
    store.game = { ...randomGame(2), phase: 'retired' }
    expect(renderToStaticMarkup(<App />)).toContain('지난 결과 보기')
  })
})
