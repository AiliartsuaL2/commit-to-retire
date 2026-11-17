// 1년 진행: 연초 집중 선택 → 이벤트 → 연말 계산

import {
  companyTypeById,
  educationById,
  events,
  focusById,
  gradeThresholds,
  industryById,
  rankById,
  ranks,
  RETIRE_AGE,
  specialtyById,
} from '../data'
import { checkAchievements, evaluateRetirement } from './ending'
import { generateFeed } from './feed'
import { applicationLimit, generatePostings, rollHeadhunterOffer } from './jobs'
import { createRng, type Rng } from './rng'
import {
  aiPressure,
  applyEffects,
  clamp,
  clampStat,
  marketSalary,
  meetsStats,
  STAT_KEYS,
  unlock,
} from './rules'
import type {
  EventOutcome,
  FeedTrigger,
  FocusId,
  GameEvent,
  GameState,
  Grade,
  RankId,
  Stats,
} from './types'

const eventById = Object.fromEntries(events.map((e) => [e.id, e])) as Record<string, GameEvent>

// ─── 연초 ──────────────────────────────────────────────

export function startYear(state: GameState, focus: FocusId): GameState {
  if (state.phase !== 'year_start') throw new Error(`연초가 아니에요: ${state.phase}`)
  const s = structuredClone(state)
  const rng = createRng(s.rngState)

  s.focus = focus
  s.gradeBonus = 0
  s.offerBonus = 0
  s.yearEvents = []
  s.yearStart = { stats: { ...s.stats }, salary: s.salary }

  const count = rng.chance(0.5) ? 2 : 1
  const pool = events.filter((e) => isEligible(e, s))
  for (let i = 0; i < count; i++) {
    const picked = rng.weighted(pool.filter((e) => !s.pendingEvents.includes(e.id)), (e) => e.weight)
    if (picked) s.pendingEvents.push(picked.id)
  }

  s.phase = 'event'
  s.rngState = rng.state
  return s
}

export function isEligible(event: GameEvent, s: GameState): boolean {
  if (event.once && s.seenEvents.includes(event.id)) return false
  const c = event.conditions
  if (!c) return true
  if (c.minCareerYear !== undefined && s.careerYear < c.minCareerYear) return false
  if (c.maxCareerYear !== undefined && s.careerYear > c.maxCareerYear) return false
  if (c.minAge !== undefined && s.age < c.minAge) return false
  if (c.maxAge !== undefined && s.age > c.maxAge) return false
  if (c.minCalendarYear !== undefined && s.calendarYear < c.minCalendarYear) return false
  if (c.maxYearsAtCompany !== undefined && s.yearsAtCompany > c.maxYearsAtCompany) return false
  if (c.minJobChanges !== undefined && s.counters.jobChanges < c.minJobChanges) return false
  if (c.maxJobChanges !== undefined && s.counters.jobChanges > c.maxJobChanges) return false
  if (c.companyTypes && !c.companyTypes.includes(s.company.type)) return false
  if (c.industries && !c.industries.includes(s.company.industry)) return false
  if (c.ranks && !c.ranks.includes(s.rank)) return false
  if (c.specialties && !c.specialties.includes(s.profile.specialty)) return false
  if (c.flags && !c.flags.every((f) => s.flags.includes(f))) return false
  if (c.notFlags && c.notFlags.some((f) => s.flags.includes(f))) return false
  return true
}

// ─── 이벤트 ────────────────────────────────────────────

/** 지금 보여줄 이벤트. 데이터에서 사라진 이벤트(예전 세이브 등)는 건너뛴다 */
export function currentEvent(state: GameState): GameEvent | null {
  const id = state.pendingEvents.find((e) => eventById[e])
  return id ? eventById[id] : null
}

/** 올해 남은 이벤트 수 (사라진 이벤트는 셈하지 않는다) */
export function remainingEvents(state: GameState): number {
  return state.pendingEvents.filter((e) => eventById[e]).length
}

function hasPendingEvents(state: GameState): boolean {
  return remainingEvents(state) > 0
}

export function chooseEventOption(
  state: GameState,
  choiceIndex: number,
): { state: GameState; outcome: EventOutcome } {
  const event = currentEvent(state)
  if (state.phase !== 'event' || !event) throw new Error('진행 중인 이벤트가 없어요')
  const choice = event.choices[choiceIndex]
  if (!choice) throw new Error(`없는 선택지예요: ${choiceIndex}`)
  const s = structuredClone(state)
  const rng = createRng(s.rngState)
  const failMultiplier = checkFailMultiplier(s.stats, choice.check)
  const outcome = rng.weighted(choice.outcomes, (o) => (o.tone === 'unlucky' ? o.chance * failMultiplier : o.chance))!

  applyEffects(s, outcome.effects)
  s.pendingEvents = s.pendingEvents.slice(s.pendingEvents.indexOf(event.id) + 1)
  s.seenEvents.push(event.id)
  s.yearEvents.push({ eventId: event.id, choiceIndex, outcomeText: outcome.text })
  s.rngState = rng.state
  return { state: s, outcome }
}

/**
 * 능력치 판정: 실패 결과 확률에 곱할 배수.
 * 가장 모자란 능력치 기준으로, 기준의 절반이면 ×3, 기준과 같으면 ×1, 1.5배면 ×0.5 (최소 ×0.3)
 */
export function checkFailMultiplier(stats: Stats, check: Partial<Stats> | undefined): number {
  const ratios = Object.entries(check ?? {}).map(([key, target]) => stats[key as keyof Stats] / Math.max(1, target ?? 1))
  if (ratios.length === 0) return 1
  const worst = Math.min(...ratios)
  return worst >= 1 ? Math.max(0.3, 1 - (worst - 1)) : 1 + (1 - worst) * 4
}

// ─── 연말 ──────────────────────────────────────────────

export function finishYear(state: GameState): GameState {
  if (state.phase !== 'event' || hasPendingEvents(state)) {
    throw new Error('이벤트를 모두 끝내야 연말로 갈 수 있어요')
  }
  const s = structuredClone(state)
  s.pendingEvents = []
  const rng = createRng(s.rngState)
  const triggers: FeedTrigger[] = []
  const rankBefore = s.rank

  if (s.yearEvents.some((e) => eventById[e.eventId]?.category === '장애')) triggers.push('incident')

  growStats(s, rng)

  // 체력과 번아웃
  const burnedOut = updateStamina(s)
  if (burnedOut) triggers.push('burnout')

  // 고과와 연봉
  const grade: Grade = burnedOut ? 'D' : gradeFor(s, rng)
  let raise = gradeThresholds.find((g) => g.grade === grade)!.raise
  // 시장 연봉보다 많이 받고 있으면 인상 폭이 줄어든다
  if (s.salary > currentMarket(s) * 1.3) raise *= 0.3
  s.salary = Math.round(s.salary * (1 + raise))

  // 승진
  if (!burnedOut && tryPromotion(s, grade, rng)) triggers.push('promoted')

  // 회사 사건 (폐업·구조조정·엑싯)
  const companyEvent = rollCompanyRisk(s, rng)
  if (companyEvent) triggers.push(companyEvent)

  // 저축
  s.assets += Math.round(s.salary * 0.2)

  // 이직 시장: 가끔 오는 헤드헌터 제안 + 직접 지원할 채용 공고
  s.offers = rollHeadhunterOffer(s, grade, s.focus!, rng)
  s.postings = generatePostings(s, rng)
  s.applicationsLeft = applicationLimit(s.focus, s.unemployed)

  s.yearsAtCompany += 1
  s.yearsAtRank = s.rank === rankBefore ? s.yearsAtRank + 1 : 0
  checkAchievements(s)

  s.history.push({
    calendarYear: s.calendarYear,
    age: s.age,
    company: { ...s.company },
    rank: s.rank,
    focus: s.focus!,
    grade,
    salaryBefore: s.yearStart.salary,
    salaryAfter: s.salary,
    statsBefore: s.yearStart.stats,
    statsAfter: { ...s.stats },
    events: s.yearEvents,
    triggers,
    feed: generateFeed(s, grade, triggers, rng),
  })

  // 다음 해 준비
  s.careerYear += 1
  s.calendarYear += 1
  s.age += 1
  s.focus = null
  s.yearEvents = []

  if (s.age >= RETIRE_AGE) s.retirement = evaluateRetirement(s, 'age')
  else if (s.counters.burnouts >= 3) s.retirement = evaluateRetirement(s, 'burnout')

  s.phase = 'year_end'
  s.rngState = rng.state
  return s
}

/** 연말 결과 화면을 닫는다 → 허브 또는 엔딩 */
export function acknowledgeYear(state: GameState): GameState {
  if (state.phase !== 'year_end') throw new Error('연말 결과 화면이 아니에요')
  return { ...state, phase: state.retirement ? 'retired' : 'hub' }
}

// ─── 연말 세부 규칙 ────────────────────────────────────

const BASE_GROWTH: Stats = { coding: 3, design: 2.2, communication: 1.8, domain: 2.2, reputation: 0.4 }

function growStats(s: GameState, rng: Rng): void {
  const company = companyTypeById[s.company.type]
  const industry = industryById[s.company.industry]
  const edu = educationById[s.profile.education]
  const focus = focusById[s.focus!]
  const fit = specialtyById[s.profile.specialty].goodIndustries.includes(s.company.industry)
  const track = rankById[s.rank].track
  const ai = aiPressure(s.calendarYear)

  for (const key of STAT_KEYS) {
    let g = BASE_GROWTH[key]
    if (track === 'manager') g += key === 'communication' ? 2 : key === 'coding' ? -2 : 0
    g *= company.growth * (industry.growth[key] ?? 1) * edu.growthMultiplier
    if (s.profile.focusStats.includes(key)) g *= 1.6
    if (fit && (key === 'domain' || key === 'design')) g *= 1.2
    if (key === 'coding') g *= 1 - ai * 0.4
    if (key === 'coding' && s.age >= 45) g *= 0.7
    g += focus.statGain[key] ?? 0
    // 높을수록 덜 자란다
    g *= clamp((100 - s.stats[key]) / 40, 0.05, 1.3)
    g *= rng.range(0.7, 1.3)
    s.stats[key] = clampStat(s.stats[key] + g)
  }
  for (const flag of focus.setFlags ?? []) if (!s.flags.includes(flag)) s.flags.push(flag)
}

const OVERTIME_COST = { 1: 5, 2: 10, 3: 18, 4: 26 } as const

/** 체력 갱신. 번아웃이면 true */
function updateStamina(s: GameState): boolean {
  const focus = focusById[s.focus!]
  const overtime = companyTypeById[s.company.type].overtime
  const recovery = s.age >= 40 ? 10 : 15
  const next = s.stamina + recovery + focus.stamina - OVERTIME_COST[overtime]
  if (next <= 0) {
    s.counters.burnouts += 1
    s.stamina = 50
    return true
  }
  s.stamina = clamp(next, 0, 100)
  return false
}

/** 직급별로 기대되는 실력. 이보다 잘하면 고과가 오른다 */
const RANK_EXPECTATION: Record<RankId, number> = {
  newbie: 30, junior: 40, mid: 52, senior: 62, lead: 70,
  em: 76, director: 82, vp: 86, cto: 90,
  staff: 78, principal: 85, fellow: 90,
}

export function performance(s: GameState): number {
  const ai = aiPressure(s.calendarYear)
  const { coding, design, communication, domain } = s.stats
  switch (rankById[s.rank].track) {
    case 'manager':
      return communication * 0.5 + domain * 0.3 + design * 0.2
    case 'ic':
      return design * 0.5 + coding * (0.3 - ai * 0.1) + domain * (0.2 + ai * 0.1)
    default:
      return coding * (0.5 - ai * 0.2) + design * 0.3 + domain * (0.2 + ai * 0.2)
  }
}

function gradeFor(s: GameState, rng: Rng): Grade {
  const focus = focusById[s.focus!]
  let score = 55 + (performance(s) - RANK_EXPECTATION[s.rank]) * 1.5
  score += focus.gradeBonus + s.gradeBonus + rng.range(-15, 15)
  if (s.stamina < 20) score -= 10
  return gradeThresholds.find((g) => score >= g.minScore)!.grade
}

function currentMarket(s: GameState): number {
  return marketSalary(s.company.type, s.company.industry, s.rank, s.careerYear)
}

const PROMOTION_CHANCE: Record<Grade, number> = { S: 0.9, A: 0.7, B: 0.3, C: 0, D: 0 }

function tryPromotion(s: GameState, grade: Grade, rng: Rng): boolean {
  const speed = companyTypeById[s.company.type].promotionSpeed
  const next = ranks.find(
    (r) =>
      r.from === s.rank &&
      (r.track === 'common' || r.track === s.preferredTrack) &&
      s.careerYear >= Math.ceil(r.minYears / speed) &&
      meetsStats(s.stats, r.minStats),
  )
  // 리드 위로는 자리가 적어서 승진 확률이 절반
  const seats = rankById[s.rank].track === 'common' && s.rank !== 'lead' ? 1 : 0.5
  if (!next || !rng.chance(PROMOTION_CHANCE[grade] * seats)) return false

  s.rank = next.id
  s.salary = Math.round(s.salary * (1 + next.salaryBump))
  if (rankById[next.id].fameScore > rankById[s.bestRank].fameScore) s.bestRank = next.id
  return true
}

const EXIT_CHANCE = { seed: 0.25, series_b: 0.35, unicorn: 0.5 } as const
const EXIT_MULTIPLIER = { seed: 10, series_b: 5, unicorn: 3 } as const

function rollCompanyRisk(s: GameState, rng: Rng): FeedTrigger | null {
  const type = s.company.type
  if (!rng.chance(companyTypeById[type].risk)) return null

  if (type === 'seed' || type === 'series_b' || type === 'unicorn') {
    if (s.yearsAtCompany >= 2 && rng.chance(EXIT_CHANCE[type])) {
      s.assets += Math.round(s.salary * EXIT_MULTIPLIER[type] * rng.range(0.3, 1.5))
      s.counters.exits += 1
      unlock(s, 'stock_lottery')
      if (type !== 'unicorn') s.company = { ...s.company, name: `${s.company.name} (인수됨)`, type: 'bigtech' }
      return 'exit'
    }
    s.counters.startupFailures += 1
    s.unemployed = true
    return 'companyClosed'
  }
  s.unemployed = true
  return 'layoff'
}
