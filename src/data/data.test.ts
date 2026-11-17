import { describe, expect, it } from 'vitest'
import {
  achievementById,
  achievements,
  companyTypes,
  events,
  feedTemplates,
  focuses,
  industries,
  playStyles,
  rankById,
  ranks,
  specialties,
  STYLE_STAT_TOTAL,
  educations,
} from './index'

// 데이터 무결성 검사. AI가 콘텐츠를 추가해도 규칙이 깨지면 여기서 잡힌다.

function expectUniqueIds(list: { id: string }[]) {
  const ids = list.map((x) => x.id)
  expect(new Set(ids).size, `중복 id: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`).toBe(ids.length)
}

describe('데이터 무결성', () => {
  it('모든 목록의 id가 중복되지 않는다', () => {
    for (const list of [educations, specialties, playStyles, companyTypes, industries, ranks, focuses, achievements, events, feedTemplates]) {
      expectUniqueIds(list)
    }
  })

  it('플레이 스타일 능력치 합이 모두 같다', () => {
    for (const style of playStyles) {
      const sum = Object.values(style.stats).reduce((a, b) => a + b, 0)
      expect(sum, style.id).toBe(STYLE_STAT_TOTAL)
    }
  })

  it('직급 승진 경로가 끊기지 않고 신입에서 시작한다', () => {
    for (const rank of ranks) {
      if (rank.from === null) {
        expect(rank.id).toBe('newbie')
      } else {
        expect(rankById[rank.from], `${rank.id}.from`).toBeDefined()
        expect(rank.minYears).toBeGreaterThanOrEqual(rankById[rank.from].minYears)
      }
    }
  })

  it('회사 수치가 허용 범위 안에 있다', () => {
    for (const c of companyTypes) {
      expect(c.risk, c.id).toBeGreaterThanOrEqual(0)
      expect(c.risk, c.id).toBeLessThanOrEqual(1)
      expect(c.baseSalary, c.id).toBeGreaterThan(0)
      expect(c.names.length, c.id).toBeGreaterThan(0)
    }
  })

  describe('이벤트', () => {
    for (const event of events) {
      it(`${event.id}: 선택지마다 결과 확률 합이 1이다`, () => {
        expect(event.choices.length).toBeGreaterThanOrEqual(2)
        for (const choice of event.choices) {
          const total = choice.outcomes.reduce((a, o) => a + o.chance, 0)
          expect(total, choice.label).toBeCloseTo(1, 5)
        }
      })

      it(`${event.id}: 조건 없이 고를 수 있는 선택지가 하나 이상 있다`, () => {
        expect(event.choices.some((c) => !c.requires)).toBe(true)
      })

      it(`${event.id}: 참조하는 업적이 존재한다`, () => {
        for (const choice of event.choices) {
          for (const outcome of choice.outcomes) {
            const id = outcome.effects.achievement
            if (id) expect(achievementById[id], id).toBeDefined()
          }
        }
      })
    }
  })

  it('반응 템플릿은 문구가 하나 이상 있다', () => {
    for (const t of feedTemplates) expect(t.texts.length, t.id).toBeGreaterThan(0)
  })
})
