// 이직 시장: 헤드헌터 제안, 채용 공고, 지원 전형, 취준 공백기

import { companyTypeById, companyTypes, focusById, industries, ranks, RETIRE_AGE } from '../data'
import { evaluateRetirement } from './ending'
import { createRng, type Rng } from './rng'
import { clamp, hiringScore, marketSalary, meetsStats, pickCompanyName } from './rules'
import type {
  ApplicationResult,
  Company,
  CompanyTypeId,
  FocusId,
  GameState,
  Grade,
  HiringStage,
  JobOffer,
  JobPosting,
  RankId,
} from './types'

export const HIRING_STAGES: HiringStage[] = ['resume', 'codingTest', 'techInterview', 'finalInterview']

export const STAGE_LABELS: Record<HiringStage, string> = {
  resume: '서류',
  codingTest: '코딩테스트',
  techInterview: '기술 면접',
  finalInterview: '임원 면접',
}

const POSTINGS_PER_YEAR = 5
/** 취준 1년 생활비 (만 원) */
const GAP_YEAR_COST = 2400

// ─── 연말에 호출: 헤드헌터 제안 + 채용 공고 ─────────────

/** 올해 연말 지원 가능 횟수: 평소 1곳, 이직 준비 3곳, 실직 5곳 */
export function applicationLimit(focus: FocusId | null, unemployed: boolean): number {
  if (unemployed) return 5
  return focus === 'job_hunt' ? 3 : 1
}

/**
 * 헤드헌터 제안 확률. 가만히 있어도 오는 제안이라 드물다.
 * 1~2년차 3%, 3~10년차 12%, 11~20년차 15%, 그 뒤 8% + 평판·네트워킹·고과 보정, 50세 이후 절반
 */
export function headhunterChance(s: GameState, grade: Grade, focus: FocusId): number {
  const y = s.careerYear
  let p = y <= 2 ? 0.03 : y <= 10 ? 0.12 : y <= 20 ? 0.15 : 0.08
  p += s.stats.reputation * 0.003
  p += focusById[focus].offerBonus * 0.05 + (s.offerBonus ?? 0) * 0.1
  if (grade === 'S') p += 0.05
  if (s.age >= 50) p *= 0.5
  return clamp(p, 0, 0.6)
}

export function rollHeadhunterOffer(s: GameState, grade: Grade, focus: FocusId, rng: Rng): JobOffer[] {
  if (!rng.chance(headhunterChance(s, grade, focus))) return []
  // 헤드헌터는 내 이력으로 붙을 만한 회사를 가져온다
  for (let attempt = 0; attempt < 6; attempt++) {
    const type = rng.pick(companyTypes).id
    if (hiringScore(s.stats, s.profile.education, type) < companyTypeById[type].hiringBar) continue
    const industry = rng.pick(industries).id
    const name = pickCompanyName(rng, type, s.company.name)
    if (name === s.company.name) continue
    return [{ ...makeOffer(s, { name, type, industry }, s.rank, rng), source: 'headhunter' }]
  }
  return []
}

export function generatePostings(s: GameState, rng: Rng): JobPosting[] {
  const postings: JobPosting[] = []
  const used = new Set([s.company.name])
  for (let attempt = 0; attempt < 30 && postings.length < POSTINGS_PER_YEAR; attempt++) {
    const type = rng.pick(companyTypes).id
    const name = pickCompanyName(rng, type)
    if (used.has(name)) continue
    used.add(name)
    const company: Company = { name, type, industry: rng.pick(industries).id }
    const rank = postingRank(s, rng)
    postings.push({ company, rank, salary: makeOffer(s, company, rank, rng).salary, applied: false })
  }
  return postings
}

/** 대부분 지금 직급, 가끔 한 단계 위 포지션 (능력치가 되면) */
function postingRank(s: GameState, rng: Rng): RankId {
  const up = ranks.find(
    (r) => r.from === s.rank && r.track === 'common' && s.careerYear >= r.minYears && s.yearsAtRank >= 2 && meetsStats(s.stats, r.minStats),
  )
  return up && rng.chance(0.2) ? up.id : s.rank
}

function makeOffer(s: GameState, company: Company, rank: RankId, rng: Rng): JobOffer {
  const raise = s.unemployed ? rng.range(0.9, 1.1) : rng.range(1.08, 1.3)
  const market = marketSalary(company.type, company.industry, rank, s.careerYear)
  // 시장 연봉의 1.5배를 넘는 제안은 없다
  const salary = Math.round(Math.min(Math.max(s.salary * raise, market), market * 1.5))
  return { company, rank, salary }
}

// ─── 허브에서 호출: 지원하기 ────────────────────────────

/** 단계별 통과 확률. 기준보다 높을수록 잘 붙는다 (5%~95%) */
export function stagePassChance(s: GameState, type: CompanyTypeId, stage: HiringStage, rankUp: boolean): number {
  const bar = companyTypeById[type].hiringBar
  const { coding, design, communication } = s.stats
  const careerExpectation = Math.min(s.careerYear * 2.5, 40)
  const stretch = rankUp ? 8 : 0
  const [value, target] = (() => {
    switch (stage) {
      case 'resume':
        return [hiringScore(s.stats, s.profile.education, type), bar + careerExpectation + stretch]
      case 'codingTest':
        return [coding, 35 + bar * 0.5 + stretch]
      case 'techInterview':
        return [(coding + design) / 2, 30 + bar * 0.5 + Math.min(s.careerYear, 20) + stretch]
      case 'finalInterview':
        return [communication, 25 + bar * 0.4 + stretch]
    }
  })()
  const jobHuntBonus = s.history[s.history.length - 1]?.focus === 'job_hunt' ? 0.1 : 0
  return clamp(0.5 + (value - target) / 40 + jobHuntBonus, 0.05, 0.95)
}

export function applyToPosting(state: GameState, index: number): { state: GameState; result: ApplicationResult } {
  if (state.phase !== 'hub') throw new Error('허브에서만 지원할 수 있어요')
  const posting = state.postings?.[index]
  if (!posting) throw new Error(`없는 공고예요: ${index}`)
  if (posting.applied) throw new Error('이미 지원한 공고예요')
  if ((state.applicationsLeft ?? 0) <= 0) throw new Error('올해 지원 횟수를 다 썼어요')

  const s = structuredClone(state)
  const rng = createRng(s.rngState)
  const rankUp = posting.rank !== s.rank
  const passed: HiringStage[] = []
  let failedAt: HiringStage | null = null

  for (const stage of HIRING_STAGES) {
    if (rng.chance(stagePassChance(s, posting.company.type, stage, rankUp))) {
      passed.push(stage)
    } else {
      failedAt = stage
      break
    }
  }

  s.postings![index] = { ...posting, applied: true, result: failedAt ?? 'passed' }
  s.applicationsLeft = (s.applicationsLeft ?? 0) - 1
  if (!failedAt) s.offers.push({ company: posting.company, rank: posting.rank, salary: posting.salary, source: 'application' })
  s.rngState = rng.state
  return { state: s, result: { posting: s.postings![index], passed, failedAt } }
}

// ─── 실직 후 전부 탈락: 취준 1년 ─────────────────────────

export function canSpendGapYear(s: GameState): boolean {
  return s.phase === 'hub' && s.unemployed && s.offers.length === 0 && (s.applicationsLeft ?? 0) === 0
}

/** 연봉 없이 1년을 보내고 다시 지원한다. 경력 연차는 늘지 않는다 */
export function spendGapYear(state: GameState): GameState {
  if (!canSpendGapYear(state)) throw new Error('지금은 공백기를 보낼 수 없어요')
  const s = structuredClone(state)
  const rng = createRng(s.rngState)
  const statsBefore = { ...s.stats }

  s.assets -= GAP_YEAR_COST
  s.stamina = clamp(s.stamina + 30, 0, 100)
  s.stats.coding = Math.min(100, s.stats.coding + rng.int(1, 3))
  s.history.push({
    gap: true,
    calendarYear: s.calendarYear,
    age: s.age,
    company: { ...s.company },
    rank: s.rank,
    focus: 'job_hunt',
    grade: 'D',
    salaryBefore: s.salary,
    salaryAfter: s.salary,
    statsBefore,
    statsAfter: { ...s.stats },
    events: [],
    triggers: [],
    feed: [],
  })
  s.calendarYear += 1
  s.age += 1
  s.postings = generatePostings(s, rng)
  s.applicationsLeft = applicationLimit(null, true)
  if (s.age >= RETIRE_AGE) {
    s.retirement = evaluateRetirement(s, 'age')
    s.phase = 'retired'
  }
  s.rngState = rng.state
  return s
}

