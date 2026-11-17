// 밸런스 수치 모음. 규칙(계산식)은 src/engine/, 숫자는 여기서 고친다.
// 고친 뒤에는 `npm run balance`로 분포와 필승법 검사를 확인한다. 기준 문서: docs/기획서.md

import type { CompanyTypeId, FocusId, Grade, Level, RankId, Stats } from '../engine/types'

// ─── 능력치 성장 ───────────────────────────────────────

/**
 * 아무것도 하지 않아도 1년에 자라는 양. 일부러 낮게 둔다:
 * 직급을 올릴 만큼의 실력은 '올해의 집중'으로 직접 키워야 한다.
 */
export const BASE_GROWTH: Stats = { coding: 1.2, design: 0.7, communication: 0.5, domain: 1.2, reputation: 0.1 }

/** 캐릭터 생성 때 고른 집중 육성 능력치의 성장 배수 */
export const FOCUS_STAT_MULTIPLIER = 1.3
/** 주력 분야와 업종이 맞을 때 도메인·설계 성장 배수 */
export const SPECIALTY_FIT_MULTIPLIER = 1.2
/** AI 압력이 최대일 때 줄어드는 코딩 성장 비율 */
export const AI_CODING_GROWTH_PENALTY = 0.4
/** 이 나이부터 코딩 성장이 느려진다 */
export const CODING_SLOWDOWN_AGE = 45
export const CODING_SLOWDOWN_MULTIPLIER = 0.7
/** 매니저 트랙의 성장 보정 (소통↑, 코딩↓) */
export const MANAGER_GROWTH_SHIFT: Partial<Stats> = { communication: 1.5, coding: -1 }
/** 높을수록 덜 자란다: (100 - 능력치) / DIVISOR 를 MIN~MAX로 자른 값을 곱한다 */
export const DIMINISHING = { divisor: 40, min: 0.05, max: 1.3 }
/** 해마다 성장에 곱해지는 운 (최소~최대) */
export const GROWTH_LUCK: [number, number] = [0.7, 1.3]

/**
 * 평판은 내세울 실력이 있어야 오른다.
 * 코딩·설계·도메인 중 가장 높은 값이 FLOOR 이하면 MIN배, FULL 이상이면 1배, 그 사이는 비례해서 평판 성장에 곱한다.
 */
export const REPUTATION_SUBSTANCE = { floor: 40, full: 80, min: 0.25 }

// ─── 체력 ──────────────────────────────────────────────

/** 야근 강도별 연간 체력 소모 */
export const OVERTIME_COST: Record<Level, number> = { 1: 5, 2: 10, 3: 18, 4: 26 }
/** 연간 체력 회복량. 40세부터 줄어든다 */
export const STAMINA_RECOVERY = { young: 20, old: 15, oldAge: 40 }
/** 번아웃 뒤 다시 시작하는 체력 */
export const BURNOUT_RESET_STAMINA = 50
/** 이만큼 번아웃이 쌓이면 은퇴한다 */
export const BURNOUTS_TO_RETIRE = 3

// ─── 고과·승진 ─────────────────────────────────────────

/** 직급별로 기대되는 실력. 이보다 잘하면 고과가 오른다 */
export const RANK_EXPECTATION: Record<RankId, number> = {
  newbie: 30, junior: 40, mid: 52, senior: 62, lead: 70,
  em: 76, director: 82, vp: 86, cto: 90,
  staff: 78, principal: 85, fellow: 90,
}

/** 고과 점수 = BASE + (실력 - 기대치) × PER_POINT + 집중·이벤트 보정 ± LUCK */
export const GRADE_SCORE = { base: 55, perPoint: 1.5, luck: 15, lowStamina: 20, lowStaminaPenalty: 10 }

/** 고과별 승진 확률 */
export const PROMOTION_CHANCE: Record<Grade, number> = { S: 0.9, A: 0.7, B: 0.3, C: 0, D: 0 }
/** 리드 위로는 자리가 적어서 승진 확률에 곱한다 */
export const UPPER_SEAT_MULTIPLIER = 0.5
/** 이 집중을 고른 해에는 승진 심사 대상이 아니다 (일을 덜 한 해) */
export const NO_PROMOTION_FOCUS: FocusId[] = ['rest', 'job_hunt']

// ─── 연봉·자산 ─────────────────────────────────────────

/** 시장 연봉의 이 배수를 넘게 받고 있으면 인상 폭이 줄어든다 */
export const SALARY_CAP = { overMarket: 1.3, raiseMultiplier: 0.3 }
/** 연봉 중 저축하는 비율 */
export const SAVINGS_RATE = 0.2

// ─── 회사 사건 ─────────────────────────────────────────

type StartupType = Extract<CompanyTypeId, 'seed' | 'series_b' | 'unicorn'>
/** 회사 사건이 났을 때 폐업 대신 엑싯일 확률 */
export const EXIT_CHANCE: Record<StartupType, number> = { seed: 0.25, series_b: 0.35, unicorn: 0.5 }
/** 엑싯 때 받는 돈 = 연봉 × 배수 × 운 */
export const EXIT_MULTIPLIER: Record<StartupType, number> = { seed: 10, series_b: 5, unicorn: 3 }
export const EXIT_LUCK: [number, number] = [0.3, 1.5]
/** 엑싯 대상이 되려면 다녀야 하는 햇수 */
export const EXIT_MIN_YEARS = 2

// ─── 엔딩 ──────────────────────────────────────────────

/** 명성 점수 = 최고 직책 점수 + 평판 × 이 값 + 업적 점수 */
export const FAME_REPUTATION_WEIGHT = 0.25
