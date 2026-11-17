import { describe, expect, it } from 'vitest'
import { EVENT_COOLDOWN_YEARS, events } from '../data'
import { playToEnd, randomGame } from './bot'
import { createGame } from './setup'
import type { GameState, Profile } from './types'
import { isEligible, startYear } from './year'

const profile: Profile = {
  name: '테스트',
  emoji: '🤓',
  startAge: 26,
  education: 'local_cs',
  specialty: 'backend',
  playStyle: 'builder',
  focusStats: ['coding', 'design'],
}

const game = (seed = 1) => createGame({ profile, companyType: 'midsize', industry: 'b2b_saas', seed })

describe('이벤트 반복 방지', () => {
  it('한 번 나온 이벤트는 3년 동안 다시 나오지 않는다', () => {
    let repeats = 0
    let total = 0
    for (let seed = 1; seed <= 40; seed++) {
      const s = playToEnd(randomGame(seed), 'random', seed)
      const lastSeen: Record<string, number> = {}
      for (const record of s.history) {
        for (const e of record.events) {
          total += 1
          if (lastSeen[e.eventId] !== undefined && record.calendarYear - lastSeen[e.eventId] <= EVENT_COOLDOWN_YEARS) repeats += 1
          lastSeen[e.eventId] = record.calendarYear
        }
      }
    }
    expect(total).toBeGreaterThan(1000)
    expect(repeats).toBe(0)
  })

  it('한 판에서 같은 이벤트를 보는 횟수가 줄었다', () => {
    const worst: number[] = []
    for (let seed = 1; seed <= 40; seed++) {
      const s = playToEnd(randomGame(seed), 'random', seed)
      const counts: Record<string, number> = {}
      for (const e of s.history.flatMap((r) => r.events)) counts[e.eventId] = (counts[e.eventId] ?? 0) + 1
      worst.push(Math.max(...Object.values(counts)))
    }
    // 쿨다운 전에는 평균 5.9회였다
    expect(worst.reduce((a, b) => a + b, 0) / worst.length).toBeLessThan(4.5)
  })

  it('후보가 전부 최근에 본 이벤트여도 가장 오래된 것이 나온다', () => {
    const base = game()
    const eligible = events.filter((e) => isEligible(e, base))
    const eventLastSeen = Object.fromEntries(eligible.map((e) => [e.id, base.calendarYear - 1]))
    const oldest = eligible[3].id
    eventLastSeen[oldest] = base.calendarYear - 2
    for (let seed = 1; seed <= 20; seed++) {
      const s = startYear({ ...base, rngState: seed, eventLastSeen }, 'study')
      expect(s.pendingEvents.length).toBeGreaterThan(0)
      expect(s.pendingEvents[0]).toBe(oldest)
    }
  })

  it('예전 세이브(기록 없음)에서도 이벤트가 뽑히고 기록이 시작된다', () => {
    const old = { ...game() } as GameState
    delete old.eventLastSeen
    const s = startYear(old, 'study')
    expect(s.pendingEvents.length).toBeGreaterThan(0)
    expect(Object.keys(s.eventLastSeen!)).toEqual(s.pendingEvents)
  })
})
