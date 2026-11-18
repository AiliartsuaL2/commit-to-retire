import { describe, expect, it } from 'vitest'
import { applicationLimit, applyToPosting, canSpendGapYear, generatePostings, headhunterChance, makeOffer, negotiateOffer, rollHeadhunterOffer, spendGapYear, stagePassChance } from './jobs'
import { acceptOffer } from './hub'
import { createRng } from './rng'
import { rankById } from '../data'
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

describe('이직 제안 조건', () => {
  const skilled = (): GameState => hub({
    company: { name: '대기업', type: 'bigtech', industry: 'b2b_saas' },
    rank: 'senior', careerYear: 12, yearsAtRank: 3, salary: 10000,
    stats: { coding: 85, design: 85, communication: 85, domain: 85, reputation: 75 },
  })

  it('재직 중 공고와 헤드헌터 제안은 연봉 또는 직급이 오른다', () => {
    let count = 0
    for (let seed = 1; seed <= 50; seed++) {
      const s = skilled()
      for (const offer of [...generatePostings(s, createRng(seed)), ...rollHeadhunterOffer(s, 'S', 'networking', createRng(seed))]) {
        expect(offer.salary > s.salary || rankById[offer.rank].fameScore > rankById[s.rank].fameScore).toBe(true)
        expect(offer.salary).toBeLessThanOrEqual(offer.salaryCeiling!)
        count++
      }
    }
    expect(count).toBeGreaterThan(0)
  })

  it('대기업 경력자에게 시리즈B·유니콘 영입 프리미엄을 준다', () => {
    const s = skilled()
    for (const type of ['series_b', 'unicorn'] as const) {
      const offer = makeOffer(s, { name: '영입 회사', type, industry: 'b2b_saas' }, s.rank, createRng(1))
      const normal = makeOffer({ ...s, company: { ...s.company, type: 'midsize' } }, offer.company, s.rank, createRng(1))
      expect(offer.recruitmentPremium).toBe(true)
      expect(offer.salary).toBeGreaterThan(s.salary)
      expect(offer.salary).toBeGreaterThan(normal.salary)
    }
  })

  it('매니저·IC 트랙에서도 상위 직급 공고를 만들고 반대 트랙은 제안하지 않는다', () => {
    for (const [rank, track, expected] of [['lead', 'manager', 'em'], ['lead', 'ic', 'staff'], ['em', 'manager', 'director'], ['staff', 'ic', 'principal']] as const) {
      const s = { ...skilled(), rank, preferredTrack: track, careerYear: 25, salary: 6000, stats: { coding: 100, design: 100, communication: 100, domain: 100, reputation: 100 } }
      const offers = Array.from({ length: 20 }, (_, i) => generatePostings(s, createRng(i + 1))).flat()
      expect(offers.some((o) => o.rank === expected)).toBe(true)
      expect(offers.every((o) => o.rank === rank || o.rank === expected)).toBe(true)
    }
  })

  it('실직 상태에서는 낮은 연봉도 재취업 선택지로 남긴다', () => {
    const s = { ...skilled(), salary: 1000000, unemployed: true }
    expect(generatePostings(s, createRng(1))).toHaveLength(5)
    expect(generatePostings(s, createRng(1)).every((o) => o.salary < s.salary)).toBe(true)
  })
})

describe('연봉 협상', () => {
  const offer = { company: { name: '협상 회사', type: 'bigtech' as const, industry: 'b2c' as const }, rank: 'junior' as const, salary: 6000, salaryCeiling: 7500 }

  it('성공한 금액이 수락 후 연봉에 반영되고 원본 상태는 변하지 않는다', () => {
    let successes = 0
    let failures = 0
    for (let seed = 1; seed <= 50; seed++) {
      const before = hub({ offers: [offer], rngState: createRng(seed).next() * 0xffffffff >>> 0 })
      const after = negotiateOffer(before, 0, 10)
      expect(before.offers[0]).not.toHaveProperty('negotiation')
      expect(after.rngState).not.toBe(before.rngState)
      if (after.offers[0].negotiation!.accepted) {
        successes++
        expect(after.offers[0].salary).toBe(6600)
        expect(acceptOffer(after, 0).salary).toBe(6600)
      } else {
        failures++
        expect(after.offers[0].salary).toBe(6000)
      }
      expect(() => negotiateOffer(after, 0, 5)).toThrow()
      expect(negotiateOffer(before, 0, 10)).toEqual(after)
    }
    expect(successes).toBeGreaterThan(0)
    expect(failures).toBeGreaterThan(0)
  })

  it('회사 예산을 넘긴 요청은 거절하고 예전 세이브도 협상할 수 있다', () => {
    const before = hub({ offers: [{ ...offer, salaryCeiling: 6100 }] })
    const after = negotiateOffer(before, 0, 20)
    expect(after.offers[0].negotiation?.accepted).toBe(false)
    expect(after.offers[0].salary).toBe(6000)
    expect(() => negotiateOffer(hub({ offers: [{ ...offer, salaryCeiling: undefined }] }), 0, 5)).not.toThrow()
    expect(() => negotiateOffer({ ...before, phase: 'year_start' }, 0, 5)).toThrow()
    expect(() => negotiateOffer(before, 99, 5)).toThrow()
  })

  it('새로고침에 해당하는 직렬화 후에도 협상을 반복할 수 없다', () => {
    const after = negotiateOffer(hub({ offers: [offer] }), 0, 5)
    const loaded = JSON.parse(JSON.stringify(after)) as GameState
    expect(() => negotiateOffer(loaded, 0, 10)).toThrow()
  })
})
