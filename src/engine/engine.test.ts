import { describe, expect, it } from 'vitest'
import { playToEnd, randomGame } from './bot'
import { acceptOffer, nextYear } from './hub'
import { createRng } from './rng'
import { createGame, firstJobOptions, startingStats } from './setup'
import type { GameState, Profile } from './types'
import { acknowledgeYear, chooseEventOption, currentEvent, finishYear, startYear } from './year'

/** 능력치 조건이 없는 첫 선택지 */
const freeChoice = (s: GameState) => currentEvent(s)!.choices.findIndex((c) => !c.requires)

const profile: Profile = {
  name: '테스트',
  emoji: '🤓',
  startAge: 26,
  education: 'local_cs',
  specialty: 'backend',
  playStyle: 'builder',
  focusStats: ['coding', 'design'],
}

describe('RNG', () => {
  it('같은 시드면 같은 값이 나온다', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()])
  })

  it('상태로 다시 만들면 이어서 같은 값이 나온다', () => {
    const a = createRng(7)
    a.next()
    const resumed = createRng(a.state)
    expect(resumed.next()).toBe(a.next())
  })
})

describe('캐릭터 생성', () => {
  it('나이 보너스가 소통·도메인에 붙는다', () => {
    const stats = startingStats(profile)
    // builder(25) + 나이 보너스(26-24=2)
    expect(stats.communication).toBe(27)
    expect(stats.domain).toBe(27)
  })

  it('명문대는 지방대보다 합격 가능한 회사가 많거나 같다', () => {
    const local = firstJobOptions(profile).filter((o) => o.passed).length
    const top = firstJobOptions({ ...profile, education: 'top_cs' }).filter((o) => o.passed).length
    expect(top).toBeGreaterThanOrEqual(local)
  })

  it('누구든 최소 한 곳은 합격한다', () => {
    const worst: Profile = { ...profile, education: 'self_taught', playStyle: 'communicator', startAge: 22 }
    expect(firstJobOptions(worst).some((o) => o.passed)).toBe(true)
  })

  it('서류 탈락한 회사로는 시작할 수 없다', () => {
    const failed = firstJobOptions(profile).find((o) => !o.passed)
    if (!failed) return
    expect(() => createGame({ profile, companyType: failed.type, industry: 'b2c', seed: 1 })).toThrow()
  })
})

describe('1년 진행', () => {
  const game = () => createGame({ profile, companyType: 'sme_si', industry: 'si_sm', seed: 123 })

  it('연초 → 이벤트 → 연말 → 허브 순서로 진행된다', () => {
    let s = startYear(game(), 'study')
    expect(s.phase).toBe('event')
    while (s.pendingEvents.length > 0) s = chooseEventOption(s, freeChoice(s)).state
    s = finishYear(s)
    expect(s.phase).toBe('year_end')
    expect(s.history).toHaveLength(1)
    expect(s.age).toBe(27)
    s = acknowledgeYear(s)
    expect(s.phase).toBe('hub')
  })

  it('원본 상태를 바꾸지 않는다 (순수 함수)', () => {
    const before = game()
    const snapshot = JSON.stringify(before)
    startYear(before, 'all_in')
    expect(JSON.stringify(before)).toBe(snapshot)
  })

  it('이벤트를 남겨두고 연말로 갈 수 없다', () => {
    const s = startYear(game(), 'study')
    expect(() => finishYear(s)).toThrow()
  })

  it('실직 상태에서는 회사를 고르기 전까지 다음 해로 못 간다', () => {
    let s = startYear(game(), 'study')
    while (s.pendingEvents.length > 0) s = chooseEventOption(s, freeChoice(s)).state
    s = acknowledgeYear(finishYear(s))
    s = { ...s, unemployed: true, offers: s.offers.length ? s.offers : [{ company: { name: '테스트사', type: 'midsize', industry: 'b2c' }, rank: s.rank, salary: 4000 }] }
    expect(() => nextYear(s)).toThrow()
    s = acceptOffer(s, 0)
    expect(s.unemployed).toBe(false)
    expect(nextYear(s).phase).toBe('year_start')
  })
})

describe('한 판 전체', () => {
  it('같은 시드면 결과가 완전히 같다', () => {
    const a = playToEnd(randomGame(99), 'random', 5)
    const b = playToEnd(randomGame(99), 'random', 5)
    expect(a).toEqual(b)
  })

  it('항상 은퇴로 끝나고 수치가 범위 안에 있다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = playToEnd(randomGame(seed), 'random', seed)
      expect(s.phase).toBe('retired')
      expect(s.retirement).not.toBeNull()
      for (const v of Object.values(s.stats)) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
      expect(s.stamina).toBeGreaterThanOrEqual(0)
      expect(s.salary).toBeGreaterThan(0)
    }
  })
})
