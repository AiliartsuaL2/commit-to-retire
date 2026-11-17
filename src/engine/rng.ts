// 시드 기반 난수 (mulberry32). 같은 시드면 항상 같은 순서의 값이 나온다.
// 상태(state)를 GameState에 저장해 두면 이어하기를 해도 결과가 같다.

export interface Rng {
  /** 0 이상 1 미만 */
  next(): number
  /** min 이상 max 이하 정수 */
  int(min: number, max: number): number
  /** min 이상 max 미만 실수 */
  range(min: number, max: number): number
  chance(p: number): boolean
  pick<T>(list: readonly T[]): T
  weighted<T>(list: readonly T[], weight: (item: T) => number): T | undefined
  /** 현재 내부 상태. GameState.rngState에 저장한다 */
  readonly state: number
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0

  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    range: (min, max) => next() * (max - min) + min,
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    weighted(list, weight) {
      const total = list.reduce((sum, item) => sum + Math.max(0, weight(item)), 0)
      if (total <= 0) return undefined
      let roll = next() * total
      for (const item of list) {
        roll -= Math.max(0, weight(item))
        if (roll < 0) return item
      }
      return list[list.length - 1]
    },
    get state() {
      return s
    },
  }
}
