// 허브(연말 이후 확인할 일): 이직 수락, 트랙 선택, 은퇴, 다음 해

import { evaluateRetirement } from './ending'
import type { GameState } from './types'

export function canChooseTrack(state: GameState): boolean {
  return state.rank === 'lead' && state.preferredTrack === null
}

export function chooseTrack(state: GameState, track: 'manager' | 'ic'): GameState {
  if (!canChooseTrack(state)) throw new Error('지금은 트랙을 고를 수 없어요')
  return { ...state, preferredTrack: track }
}

export function acceptOffer(state: GameState, index: number): GameState {
  if (state.phase !== 'hub') throw new Error('허브에서만 이직할 수 있어요')
  const offer = state.offers[index]
  if (!offer) throw new Error(`없는 제안이에요: ${index}`)

  const s = structuredClone(state)
  // 업종이 바뀌면 도메인 지식 일부를 잃는다
  if (offer.company.industry !== s.company.industry) {
    s.stats.domain = Math.round(s.stats.domain * 0.75)
  }
  s.company = offer.company
  s.salary = offer.salary
  if (offer.rank !== s.rank) s.yearsAtRank = 0
  s.rank = offer.rank
  s.yearsAtCompany = 0
  s.unemployed = false
  s.offers = []
  s.counters.jobChanges += 1
  return s
}

export function declineOffers(state: GameState): GameState {
  if (state.unemployed) throw new Error('실직 상태에서는 제안 중 하나를 골라야 해요')
  return { ...state, offers: [] }
}

export function nextYear(state: GameState): GameState {
  if (state.phase !== 'hub') throw new Error('허브에서만 다음 해로 갈 수 있어요')
  if (state.unemployed) throw new Error('먼저 새 회사를 골라야 해요')
  return { ...state, offers: [], phase: 'year_start' }
}

export function retireNow(state: GameState): GameState {
  if (state.phase !== 'hub') throw new Error('허브에서만 은퇴할 수 있어요')
  const s = structuredClone(state)
  s.retirement = evaluateRetirement(s, 'voluntary')
  s.phase = 'retired'
  return s
}
