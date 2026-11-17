import { describe, expect, it } from 'vitest'
import { applicationLimit, applyToPosting, canSpendGapYear, headhunterChance, spendGapYear, stagePassChance } from './jobs'
import { createGame } from './setup'
import type { GameState, Profile } from './types'

const profile: Profile = {
  name: '테스트',
  emoji: '🤓',
  startAge: 26,
  education: 'local_cs',
  specialty: 'backend',
  playStyle: 'builder',
  focusStats: ['coding'],
}

function hub(patch: Partial<GameState> = {}): GameState {
  const g = createGame({ profile, companyType: 'midsize', industry: 'b2b_saas', seed: 9 })
  return {
    ...g,
    phase: 'hub',
    careerYear: 5,
    postings: [
      { company: { name: 'A사', type: 'sme_si', industry: 'si_sm' }, rank: 'newbie', salary: 4000, applied: false },
      { company: { name: 'B사', type: 'bigtech', industry: 'b2c' }, rank: 'newbie', salary: 7000, applied: false },
    ],
    applicationsLeft: 1,
    ...patch,
  }
}

describe('지원 횟수', () => {
  it('평소 1곳, 이직 준비 3곳, 실직 5곳', () => {
    expect(applicationLimit('study', false)).toBe(1)
    expect(applicationLimit('job_hunt', false)).toBe(3)
    expect(applicationLimit('study', true)).toBe(5)
  })

  it('지원 횟수를 다 쓰면 더 지원할 수 없다', () => {
    const s = applyToPosting(hub(), 0).state
    expect(s.applicationsLeft).toBe(0)
    expect(() => applyToPosting(s, 1)).toThrow()
  })

  it('같은 공고에 두 번 지원할 수 없다', () => {
    const s = applyToPosting(hub({ applicationsLeft: 2 }), 0).state
    expect(() => applyToPosting(s, 0)).toThrow()
  })
})

describe('전형', () => {
  it('문턱 높은 회사일수록 서류 통과 확률이 낮다', () => {
    const s = hub()
    expect(stagePassChance(s, 'bigtech', 'resume', false)).toBeLessThan(stagePassChance(s, 'sme_si', 'resume', false))
  })

  it('최종까지 붙으면 제안이 생기고, 떨어지면 단계가 기록된다', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { state, result } = applyToPosting(hub({ rngState: seed }), 1)
      if (result.failedAt) {
        expect(state.offers).toHaveLength(0)
      } else {
        expect(result.passed).toHaveLength(4)
        expect(state.offers[0].source).toBe('application')
      }
    }
  })
})

describe('헤드헌터', () => {
  it('신입 때는 거의 오지 않는다', () => {
    expect(headhunterChance({ ...hub(), careerYear: 1 }, 'B', 'study')).toBeLessThan(0.1)
  })
})

describe('취준 공백기', () => {
  it('실직하고 지원을 다 떨어졌을 때만 보낼 수 있다', () => {
    expect(canSpendGapYear(hub({ unemployed: true }))).toBe(false)
    expect(canSpendGapYear(hub({ unemployed: true, applicationsLeft: 0 }))).toBe(true)
  })

  it('1년이 지나고 자산이 줄고, 경력 연차는 그대로이며 다시 지원할 수 있다', () => {
    const before = hub({ unemployed: true, applicationsLeft: 0, assets: 10000 })
    const after = spendGapYear(before)
    expect(after.age).toBe(before.age + 1)
    expect(after.careerYear).toBe(before.careerYear)
    expect(after.assets).toBeLessThan(before.assets)
    expect(after.applicationsLeft).toBe(5)
    expect(after.history.at(-1)?.gap).toBe(true)
  })
})
