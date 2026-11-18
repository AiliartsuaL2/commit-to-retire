import { describe, expect, it } from 'vitest'
import { randomGame } from './bot'
import { endingResult } from './career'
import { evaluateRetirement } from './ending'
import { readSharedResult, resultUrl } from './share'
import { finishYear, startYear } from './year'

function result() {
  const state = startYear(randomGame(42), 'study')
  state.pendingEvents = []
  const game = finishYear(state)
  game.profile.name = '김개발 👩🏽‍💻'
  game.retirement = evaluateRetirement(game, 'voluntary')
  return endingResult(game)
}

describe('결과 공유 링크', () => {
  it('다른 브라우저에서도 링크만으로 모든 표시 항목을 복원한다', () => {
    const original = result()
    original.career.push({ ...original.career[0], start: 2030, end: 2031, gap: true })
    const url = resultUrl(original, 'https://example.com/game/?unrelated=1#old')
    expect(new URL(url).pathname).toBe('/game/')
    expect(new URL(url).search).toBe('')
    expect(readSharedResult(new URL(url).hash)).toEqual({ status: 'valid', result: original })
    expect(original).not.toHaveProperty('seed')
    expect(original).not.toHaveProperty('history')
  })

  it('공유 결과를 다시 공유해도 동일하다', () => {
    const original = result()
    const link = resultUrl(original, 'https://example.com/')
    const decoded = readSharedResult(new URL(link).hash)
    expect(decoded.status).toBe('valid')
    if (decoded.status === 'valid') expect(resultUrl(decoded.result, link)).toBe(link)
  })

  it('빈 경력과 최대 길이의 플레이 이력을 지원한다', () => {
    const original = result()
    const period = original.career[0]
    original.career = []
    expect(readSharedResult(new URL(resultUrl(original, 'https://example.com')).hash).status).toBe('valid')
    original.career = Array.from({ length: 40 }, (_, i) => ({ ...period, start: 2026 + i, end: 2026 + i }))
    expect(readSharedResult(new URL(resultUrl(original, 'https://example.com')).hash).status).toBe('valid')
  })

  it('깨진 링크·알 수 없는 데이터·너무 긴 링크는 오류로 처리한다', () => {
    expect(readSharedResult('')).toEqual({ status: 'none' })
    for (const hash of ['#result=', '#result=invalid!', '#result=' + 'a'.repeat(30001), '#result=' + btoa('{}')]) {
      expect(readSharedResult(hash)).toEqual({ status: 'invalid' })
    }
    for (const patch of [{ bestRank: 'constructor' }, { stats: null }, { salary: -100 }, { career: [{}] }]) {
      const invalid = { ...result(), ...patch }
      const bytes = new TextEncoder().encode(JSON.stringify({ version: 1, result: invalid }))
      const encoded = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
      expect(readSharedResult('#result=' + encoded)).toEqual({ status: 'invalid' })
    }
  })
})
