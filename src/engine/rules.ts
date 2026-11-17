// 여러 단계에서 공통으로 쓰는 계산 규칙. 밸런스 조정은 주로 이 파일과 src/data/에서 한다.

import { companyTypeById, educationById, industryById, rankById } from '../data'
import type { Rng } from './rng'
import type {
  CompanyTypeId,
  Effects,
  GameState,
  IndustryId,
  Profile,
  RankId,
  StatKey,
  Stats,
} from './types'

export const STAT_KEYS: StatKey[] = ['coding', 'design', 'communication', 'domain', 'reputation']

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const clampStat = (v: number) => clamp(Math.round(v), 0, 100)

/** AI 자동화 압력 0(2026년)~1(2046년 이후). 코딩 가치↓, 설계·도메인 가치↑ */
export function aiPressure(calendarYear: number): number {
  return clamp((calendarYear - 2026) / 20, 0, 1)
}

/** 효과를 상태에 적용한다 (state를 직접 수정 — 호출하는 쪽에서 복사본을 넘긴다) */
export function applyEffects(state: GameState, effects: Effects): void {
  for (const [key, delta] of Object.entries(effects.stats ?? {}) as [StatKey, number][]) {
    state.stats[key] = clampStat(state.stats[key] + delta)
  }
  if (effects.stamina) state.stamina = clamp(state.stamina + effects.stamina, 0, 100)
  if (effects.salaryPct) state.salary = Math.round(state.salary * (1 + effects.salaryPct))
  if (effects.assets) state.assets += effects.assets
  if (effects.gradeBonus) state.gradeBonus += effects.gradeBonus
  for (const flag of effects.setFlags ?? []) {
    if (!state.flags.includes(flag)) state.flags.push(flag)
  }
  if (effects.clearFlags) state.flags = state.flags.filter((f) => !effects.clearFlags!.includes(f))
  for (const [key, delta] of Object.entries(effects.counters ?? {})) {
    state.counters[key as keyof GameState['counters']] += delta
  }
  if (effects.achievement) unlock(state, effects.achievement)
}

export function unlock(state: GameState, achievementId: string): void {
  if (!state.achievements.includes(achievementId)) state.achievements.push(achievementId)
}

export function meetsStats(stats: Stats, required: Partial<Stats> | undefined): boolean {
  return Object.entries(required ?? {}).every(([key, min]) => stats[key as StatKey] >= (min ?? 0))
}

/** 서류 점수. 회사의 hiringBar 이상이면 합격 */
export function hiringScore(
  stats: Stats,
  education: Profile['education'],
  companyType: CompanyTypeId,
): number {
  const edu = educationById[education]
  const workAvg = (stats.coding + stats.design + stats.communication + stats.domain) / 4
  return workAvg * 1.2 + stats.reputation * 0.3 + edu.hiringBonus + (edu.companyBonus?.[companyType] ?? 0)
}

/** 회사·업종·직급·연차 기준 시장 연봉 (만 원) */
export function marketSalary(
  companyType: CompanyTypeId,
  industry: IndustryId,
  rank: RankId,
  careerYear: number,
): number {
  const base = companyTypeById[companyType].baseSalary * industryById[industry].salaryMultiplier
  const rankIndex = rankLadderIndex(rank)
  return Math.round(base * Math.pow(1.025, careerYear - 1) * (1 + rankIndex * 0.04))
}

/** 신입=0부터 위로 몇 단계인지 */
export function rankLadderIndex(rank: RankId): number {
  let i = 0
  let r = rankById[rank]
  while (r.from) {
    i++
    r = rankById[r.from]
  }
  return i
}

export function pickCompanyName(rng: Rng, type: CompanyTypeId, exclude?: string): string {
  const names = companyTypeById[type].names.filter((n) => n !== exclude)
  return rng.pick(names.length > 0 ? names : companyTypeById[type].names)
}

export function formatSalary(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000)
    const rest = manwon % 10000
    return rest > 0 ? `${eok}억 ${rest.toLocaleString('ko-KR')}만` : `${eok}억`
  }
  return `${manwon.toLocaleString('ko-KR')}만`
}
