// 자동 플레이 봇. 밸런스 시뮬레이션과 테스트에서 한 판을 끝까지 돌릴 때 쓴다.

import { focuses, specialties, playStyles, educations, START_AGE_MIN, START_AGE_MAX, industries } from '../data'
import { acceptOffer, canChooseTrack, chooseTrack, declineOffers, nextYear } from './hub'
import { createRng } from './rng'
import { meetsStats } from './rules'
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

    // 이벤트: 고를 수 있는 선택지 중 무작위
    for (let event = currentEvent(s); event; event = currentEvent(s)) {
      const options = event.choices.map((c, i) => ({ c, i })).filter(({ c }) => meetsStats(s.stats, c.requires))
      s = chooseEventOption(s, rng.pick(options).i).state
    }

    s = acknowledgeYear(finishYear(s))
    if (s.phase === 'retired') break

    if (canChooseTrack(s)) s = chooseTrack(s, rng.chance(0.5) ? 'manager' : 'ic')

    // 이직: 실직이면 무조건, hopper는 연봉이 오르면, 나머지는 가끔
    if (s.offers.length > 0) {
      const best = s.offers.reduce((bi, o, i, arr) => (o.salary > arr[bi].salary ? i : bi), 0)
      const wantsMove =
        s.unemployed ||
        (strategy === 'hopper' && s.offers[best].salary > s.salary) ||
        (strategy === 'random' && rng.chance(0.3))
      s = wantsMove ? acceptOffer(s, best) : declineOffers(s)
    }
    s = nextYear(s)
  }
  return s
}
