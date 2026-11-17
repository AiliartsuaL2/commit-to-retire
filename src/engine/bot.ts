// 자동 플레이 봇. 밸런스 시뮬레이션과 테스트에서 한 판을 끝까지 돌릴 때 쓴다.

import { companyTypeById, focuses, specialties, playStyles, educations, START_AGE_MIN, START_AGE_MAX, industries } from '../data'
import { acceptOffer, canChooseTrack, chooseTrack, declineOffers, nextYear } from './hub'
import { applyToPosting, canSpendGapYear, spendGapYear } from './jobs'
import { createRng } from './rng'
import { createGame, firstJobOptions } from './setup'
import type { GameState, Profile } from './types'
import { acknowledgeYear, chooseEventOption, currentEvent, finishYear, startYear } from './year'

export type BotStrategy = 'random' | 'grinder' | 'hopper'

/** 시드로 무작위 프로필과 첫 회사를 정해 새 게임을 만든다 */
export function randomGame(seed: number): GameState {
  const rng = createRng(seed)
  const profile: Profile = {
    name: '봇',
    emoji: '🤓',
    startAge: rng.int(START_AGE_MIN, START_AGE_MAX),
    education: rng.pick(educations).id,
    specialty: rng.pick(specialties).id,
    playStyle: rng.pick(playStyles).id,
    focusStats: [rng.pick(['coding', 'design', 'communication', 'domain'] as const)],
  }
  const passed = firstJobOptions(profile).filter((o) => o.passed)
  return createGame({
    profile,
    companyType: rng.pick(passed).type,
    industry: rng.pick(industries).id,
    seed: rng.int(1, 2 ** 31),
  })
}

/** 은퇴할 때까지 플레이한다 */
export function playToEnd(initial: GameState, strategy: BotStrategy = 'random', botSeed = 1): GameState {
  const rng = createRng(botSeed)
  let s = initial

  for (let guard = 0; guard < 100 && s.phase !== 'retired'; guard++) {
    // 연초: 체력이 낮으면 쉬고, 아니면 전략대로
    let focus = rng.pick(focuses).id
    if (strategy === 'grinder') focus = rng.pick(['all_in', 'study'] as const)
    if (strategy === 'hopper') focus = rng.pick(['job_hunt', 'networking', 'study'] as const)
    if (s.stamina < 35) focus = 'rest'
    s = startYear(s, focus)

    // 이벤트: 선택지 중 무작위
    for (let event = currentEvent(s); event; event = currentEvent(s)) {
      const choiceIndex = rng.int(0, event.choices.length - 1)
      s = chooseEventOption(s, choiceIndex).state
    }

    s = acknowledgeYear(finishYear(s))
    if (s.phase === 'retired') break

    if (canChooseTrack(s)) s = chooseTrack(s, rng.chance(0.5) ? 'manager' : 'ic')

    // 지원: 실직이면 무조건, hopper는 매년, random은 가끔, grinder는 지원하지 않는다
    const wantsToApply = strategy === 'hopper' || (strategy === 'random' && rng.chance(0.3))
    if (wantsToApply && !s.unemployed) s = applyAll(s, 'salary')

    if (s.offers.length > 0 && !s.unemployed) {
      const best = bestOffer(s)
      const better = s.offers[best].salary > s.salary
      const wantsMove = better && (strategy !== 'grinder' || rng.chance(0.2))
      s = wantsMove ? acceptOffer(s, best) : declineOffers(s)
    }

    // 실직: 붙을 때까지 지원하고, 전부 떨어지면 취준 1년
    while (s.phase === 'hub' && s.unemployed) {
      s = applyAll(s, 'easy')
      if (s.offers.length > 0) s = acceptOffer(s, bestOffer(s))
      else if (canSpendGapYear(s)) s = spendGapYear(s)
    }
    if (s.phase === 'retired') break
    s = nextYear(s)
  }
  return s
}

function bestOffer(s: GameState): number {
  return s.offers.reduce((bi, o, i, arr) => (o.salary > arr[bi].salary ? i : bi), 0)
}

/** 남은 지원 횟수를 다 쓴다. salary: 연봉 높은 곳부터, easy: 문턱 낮은 곳부터 */
function applyAll(s: GameState, order: 'salary' | 'easy'): GameState {
  while ((s.applicationsLeft ?? 0) > 0) {
    const candidates = (s.postings ?? [])
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => !p.applied)
      .sort((a, b) =>
        order === 'salary'
          ? b.p.salary - a.p.salary
          : companyTypeById[a.p.company.type].hiringBar - companyTypeById[b.p.company.type].hiringBar,
      )
    if (candidates.length === 0) break
    s = applyToPosting(s, candidates[0].i).state
  }
  return s
}
