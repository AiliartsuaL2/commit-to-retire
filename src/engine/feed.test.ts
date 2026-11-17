import { describe, expect, it } from 'vitest'
import { feedTemplates } from '../data'
import { playToEnd, randomGame } from './bot'
import { applyParticles, fillText, generateFeed } from './feed'
import { acceptOffer, nextYear } from './hub'
import { createRng } from './rng'
import { createGame } from './setup'
import type { Company, FeedTrigger, GameState, Grade, Profile, YearRecord } from './types'
import { acknowledgeYear, chooseEventOption, finishYear, startYear } from './year'

const profile: Profile = {
  name: '테스트',
  emoji: '🤓',
  startAge: 26,
  education: 'local_cs',
  specialty: 'backend',
  playStyle: 'builder',
  focusStats: ['coding', 'design'],
}

const game = () => createGame({ profile, companyType: 'sme_si', industry: 'si_sm', seed: 123 })

/** 테스트용: 서류 합격 여부와 상관없이 회사만 바꾼 상태 */
function withCompany(name: string, type: Company['type'], industry: Company['industry']): GameState {
  return { ...game(), company: { name, type, industry } }
}

function playYear(state: GameState): GameState {
  let s = startYear(state, 'study')
  while (s.pendingEvents.length > 0) s = chooseEventOption(s, 0).state
  return acknowledgeYear(finishYear(s))
}

/** 허브에서 네모버로 이직한다 (제안이 없어도 하나 넣어서) */
function moveToNemover(s: GameState): GameState {
  const offer = { company: { name: '네모버', type: 'bigtech' as const, industry: 'b2c' as const }, rank: s.rank, salary: 5000 }
  return acceptOffer({ ...s, offers: [offer] }, 0)
}

describe('조사 고르기', () => {
  it('직급 받침에 따라 (으)로를 고른다', () => {
    expect(applyParticles('신입(으)로 입사')).toBe('신입으로 입사')
    expect(applyParticles('시니어(으)로 승진')).toBe('시니어로 승진')
    expect(applyParticles('테크리드(으)로 승진')).toBe('테크리드로 승진')
  })

  it('ㄹ 받침 뒤의 (으)로는 로가 된다', () => {
    expect(applyParticles('서울(으)로 이사')).toBe('서울로 이사')
  })

  it('회사 이름 받침에 맞춰 이/가, 와/과, 은/는, 을/를, 아/야를 고른다', () => {
    // 쿠팽: 받침 있음, 네모버·까까오: 받침 없음
    expect(applyParticles('쿠팽(이)가 망함')).toBe('쿠팽이 망함')
    expect(applyParticles('네모버(이)가 망함')).toBe('네모버가 망함')
    expect(applyParticles('쿠팽(와)과 네모버(와)과')).toBe('쿠팽과 네모버와')
    expect(applyParticles('쿠팽(과)와 네모버(과)와')).toBe('쿠팽과 네모버와')
    expect(applyParticles('까까오(은)는 쿠팽(은)는')).toBe('까까오는 쿠팽은')
    expect(applyParticles('쿠팽(을)를 까까오(을)를')).toBe('쿠팽을 까까오를')
    expect(applyParticles('쿠팽(아)야 네모버(아)야')).toBe('쿠팽아 네모버야')
  })

  it('서술격 (이)야 / (이)라서도 된다', () => {
    expect(applyParticles('쿠팽(이)야')).toBe('쿠팽이야')
    expect(applyParticles('네모버(이)라서')).toBe('네모버라서')
  })

  it('한글이 아닌 끝 글자는 읽는 소리로 판단한다', () => {
    expect(applyParticles('CTO(으)로')).toBe('CTO로')
    expect(applyParticles('VP of Engineering(으)로')).toBe('VP of Engineering으로')
    expect(applyParticles('3(으)로')).toBe('3으로')
    expect(applyParticles('2(으)로')).toBe('2로')
    expect(applyParticles('7(으)로')).toBe('7로')
  })

  it('닫는 괄호는 건너뛰고 그 앞 글자를 본다', () => {
    expect(applyParticles('네모버 (인수됨)(이)가')).toBe('네모버 (인수됨)이')
  })

  it('조사 표기가 아니면 그대로 둔다', () => {
    expect(applyParticles('그냥 문장 (괄호) 입니다')).toBe('그냥 문장 (괄호) 입니다')
    expect(applyParticles('(이)가')).toBe('(이)가')
  })

  it('치환어를 채운 뒤 조사를 맞춘다', () => {
    const s = withCompany('쿠팽', 'bigtech', 'commerce')
    expect(fillText('{company}(이)가 {rank}(으)로 {name}(을)를 뽑음', s)).toBe('쿠팽이 신입으로 테스트를 뽑음')
  })

  it('모든 템플릿에 풀리지 않은 치환어·조사 표기가 남지 않는다', () => {
    const states = [withCompany('쿠팽', 'bigtech', 'commerce'), { ...withCompany('구글리 코리아', 'foreign', 'ai'), rank: 'vp' as const }]
    for (const s of states) {
      for (const t of feedTemplates) {
        for (const text of t.texts) {
          const filled = fillText(text, s)
          expect(filled, t.id).not.toMatch(/[{}]/)
          expect(filled, t.id).not.toMatch(/\((이|은|을|과|와|아|으)\)/)
        }
      }
    }
  })
})

describe('이직 반응', () => {
  it('이직을 수락하면 다음 해 기록의 사건에 jobChanged가 들어가고, 그다음 해에는 빠진다', () => {
    let s = playYear(game())
    expect(s.history.at(-1)!.triggers).not.toContain('jobChanged')

    s = moveToNemover(s)
    expect(s.pendingFeedTriggers).toEqual(['jobChanged'])

    s = playYear(nextYear(s))
    expect(s.history.at(-1)!.triggers).toContain('jobChanged')
    expect(s.pendingFeedTriggers).toBeUndefined()

    // 2년 차에 또 실직했을 수 있으니 회사만 유지한 채 한 해 더 돌린다
    s = playYear(nextYear({ ...s, unemployed: false }))
    expect(s.history.at(-1)!.triggers).not.toContain('jobChanged')
  })

  it('예전 세이브(필드 없음)도 그대로 진행된다', () => {
    const old = game()
    expect('pendingFeedTriggers' in old).toBe(false)
    expect(playYear(old).history[0].triggers).not.toContain('jobChanged')
  })

  it('봇이 돌린 판에서는 이직한 횟수만큼 jobChanged 해가 기록된다', () => {
    let total = 0
    for (let seed = 1; seed <= 30; seed++) {
      const s = playToEnd(randomGame(seed), 'hopper', seed)
      const years = s.history.filter((r) => r.triggers.includes('jobChanged')).length
      expect(years, `seed ${seed}`).toBe(s.counters.jobChanges)
      total += years
    }
    expect(total).toBeGreaterThan(0)
  })

  it('이직 글이 플랫폼별로 준비되어 있다', () => {
    const platforms = new Set(feedTemplates.filter((t) => t.conditions?.triggers?.includes('jobChanged')).map((t) => t.platform))
    expect(platforms.size).toBe(5)
  })
})

describe('피드 생성', () => {
  const eventTriggers: FeedTrigger[] = ['promoted', 'burnout', 'layoff', 'companyClosed', 'exit', 'incident', 'jobChanged']
  const grades: Grade[] = ['S', 'A', 'B', 'C', 'D']

  /** 이 사건에 반응하는 템플릿으로 만들 수 있는 모든 글 */
  const reactions = (s: GameState, triggers: FeedTrigger[]) =>
    new Set(
      feedTemplates
        .filter((t) => t.conditions?.triggers?.some((tr) => triggers.includes(tr)))
        .flatMap((t) => t.texts.map((text) => fillText(text, s))),
    )

  it('사건이 있는 해에는 그 사건에 반응하는 글이 최소 하나 있다', () => {
    const state: GameState = { ...withCompany('까까오', 'seed', 'ai'), focus: 'study' }
    for (const trigger of eventTriggers) {
      const expected = reactions(state, [trigger])
      expect(expected.size, trigger).toBeGreaterThan(0)
      for (let seed = 1; seed <= 100; seed++) {
        const feed = generateFeed(state, grades[seed % 5], [trigger], createRng(seed))
        expect(feed, `${trigger} seed ${seed}`).toHaveLength(3)
        expect(feed.some((p) => expected.has(p.text)), `${trigger} seed ${seed}`).toBe(true)
      }
    }
  })

  it('봇이 돌린 판에서도 사건이 있는 해마다 반응 글이 있다', () => {
    let checked = 0
    for (let seed = 1; seed <= 30; seed++) {
      // 연말 상태를 다시 만들 수 없으니 글에 들어간 값이 아니라 해당 사건 템플릿의 고정 문구로 확인한다
      const s = playToEnd(randomGame(seed), 'random', seed)
      for (const record of s.history.filter((r: YearRecord) => !r.gap && r.triggers.length > 0)) {
        const fragments = feedTemplates
          .filter((t) => t.conditions?.triggers?.some((tr) => record.triggers.includes(tr)))
          .flatMap((t) => t.texts.map((text) => text.split(/\{[a-z]+\}(?:\([가-힣]\)[가-힣]+)?/).sort((a, b) => b.length - a.length)[0]))
        expect(record.feed.some((p) => fragments.some((f) => p.text.includes(f))), `seed ${seed} ${record.calendarYear} ${record.triggers}`).toBe(true)
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(50)
  })

  it('사건이 없는 해에는 사건 글이 나오지 않는다', () => {
    const state: GameState = { ...withCompany('까까오', 'seed', 'ai'), focus: 'rest' }
    const all = reactions(state, eventTriggers)
    for (let seed = 1; seed <= 50; seed++) {
      const feed = generateFeed(state, 'B', [], createRng(seed))
      expect(feed.some((p) => all.has(p.text)), `seed ${seed}`).toBe(false)
    }
  })

  it('한 해 안에서 작성자가 겹치지 않는다', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = playToEnd(randomGame(seed), 'random', seed)
      for (const record of s.history) {
        const authors = record.feed.map((p) => p.author)
        expect(new Set(authors).size, `seed ${seed} ${record.calendarYear}`).toBe(authors.length)
      }
    }
  })

  it('플랫폼마다 작성자 이름 형식이 다르다', () => {
    const forum = new Set<string>()
    for (let seed = 1; seed <= 40; seed++) {
      const s = playToEnd(randomGame(seed), 'random', seed)
      for (const post of s.history.flatMap((r) => r.feed)) {
        if (post.platform === 'github') expect(post.author).toMatch(/^[a-z0-9-]+$/)
        if (post.platform === 'linkedout') expect(post.author).toMatch(/ [|·🚀] /u)
        if (post.platform === 'blinder') expect(post.author).toMatch(/^[^ ]+ · [^ ]+$/)
        if (post.platform === 'okko' || post.platform === 'jobplanet') {
          expect(post.author).not.toMatch(/[|·]/)
          forum.add(post.author)
        }
      }
    }
    expect(forum.size).toBeGreaterThan(5)
  })

  it('블라인더에서 우리 회사 이야기는 우리 회사 사람이, 남 이야기는 다른 회사 사람이 쓴다', () => {
    const state = withCompany('구글리 코리아', 'foreign', 'b2c')
    const own = fillText('{company}', state)
    let ownPosts = 0
    let otherPosts = 0
    for (let seed = 0; seed < 300; seed++) {
      for (const post of generateFeed(state, 'B', seed % 2 ? ['exit'] : [], createRng(seed))) {
        if (post.platform !== 'blinder') continue
        const tag = post.author.split(' · ')[0]
        if (post.text.includes(own)) {
          expect(tag, post.text).toBe('구글리')
          ownPosts += 1
        } else {
          expect(tag, post.text).not.toBe('구글리')
          otherPosts += 1
        }
      }
    }
    expect(ownPosts).toBeGreaterThan(0)
    expect(otherPosts).toBeGreaterThan(0)
  })

  it('블라인더 회사 태그는 (주)·(인수됨)·코리아를 뗀 짧은 이름이다', () => {
    const tags = (name: string) =>
      Array.from({ length: 60 }, (_, seed) => generateFeed(withCompany(name, 'sme_si', 'si_sm'), 'B', [], createRng(seed)))
        .flat()
        .filter((p) => p.platform === 'blinder' && p.text.includes(name))
        .map((p) => p.author.split(' · ')[0])
    expect(new Set(tags('(주)솔루션원'))).toEqual(new Set(['솔루션원']))
    expect(new Set(tags('네모버 (인수됨)'))).toEqual(new Set(['네모버']))
  })

  it('공백기 다음 해에만 공백기 글이 나올 수 있다', () => {
    const base: GameState = { ...withCompany('네모버', 'bigtech', 'b2c'), focus: 'study' }
    const gapRecord = { gap: true } as YearRecord
    const comeback = '공백기'
    const seen = (s: GameState) =>
      Array.from({ length: 200 }, (_, seed) => generateFeed(s, 'B', ['jobChanged'], createRng(seed)))
        .flat()
        .some((p) => p.text.includes(comeback))
    expect(seen(base)).toBe(false)
    expect(seen({ ...base, history: [gapRecord] })).toBe(true)
  })

  it('같은 시드면 같은 피드가 나온다', () => {
    const state = withCompany('네모버', 'bigtech', 'b2c')
    expect(generateFeed(state, 'A', ['promoted'], createRng(1))).toEqual(generateFeed(state, 'A', ['promoted'], createRng(1)))
  })

  it('넘겨받은 RNG는 피드 내용과 상관없이 한 번만 쓴다', () => {
    const state = withCompany('네모버', 'bigtech', 'b2c')
    const a = createRng(77)
    const b = createRng(77)
    const expectedState = (() => {
      const c = createRng(77)
      c.next()
      return c.state
    })()
    generateFeed(state, 'A', ['promoted', 'incident'], a)
    generateFeed(state, 'D', [], b)
    expect(a.state).toBe(expectedState)
    expect(b.state).toBe(expectedState)
  })
})
