import { rankById } from '../data'
import { formatSalary } from './rules'
import type { Company, GameState, RankId, YearRecord } from './types'

export interface CareerPeriod {
  start: number
  end: number
  company: Company
  gap: boolean
  firstRank: RankId
  lastRank: RankId
}

/** 연속 재직만 합친다. 공백기와 재입사는 별도 기간으로 남긴다. */
export function summarizeCareer(history: YearRecord[]): CareerPeriod[] {
  const periods: CareerPeriod[] = []
  for (const record of history) {
    const previous = periods.at(-1)
    const gap = !!record.gap
    if (previous && previous.end + 1 === record.calendarYear && previous.gap === gap &&
      (gap || (!record.triggers.includes('jobChanged') && previous.company.name === record.company.name &&
        previous.company.type === record.company.type && previous.company.industry === record.company.industry))) {
      previous.end = record.calendarYear
      previous.lastRank = record.rank
    } else {
      periods.push({ start: record.calendarYear, end: record.calendarYear, company: { ...record.company }, gap,
        firstRank: record.rank, lastRank: record.rank })
    }
  }
  return periods
}

export function careerPeriodLabel(period: CareerPeriod): string {
  return period.start === period.end ? `${period.start}` : `${period.start}~${period.end}`
}

export function endingShareText(game: GameState): string {
  const retirement = game.retirement!
  return [
    '커밋에서 은퇴까지',
    `${game.profile.name} · ${retirement.fameGrade}등급 · ${retirement.title}`,
    `최고 직책 ${rankById[game.bestRank].label} · 이직 ${game.counters.jobChanges}회`,
    `모은 자산 ${formatSalary(Math.max(0, game.assets))}`,
    '', '커리어 요약',
    ...summarizeCareer(game.history).map((p) => `${careerPeriodLabel(p)} ${p.gap ? '취업 준비' : p.company.name}`),
  ].join('\n')
}
