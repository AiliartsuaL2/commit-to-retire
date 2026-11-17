// 연말 커뮤니티 반응 피드 생성

import { feedTemplates, rankById } from '../data'
import type { Rng } from './rng'
import { formatSalary } from './rules'
import type { FeedPost, FeedTemplate, FeedTrigger, GameState, Grade } from './types'

const AUTHORS = [
  '익명의개발자', '야근요정', '판교불나방', '커밋장인', '레거시수호자', '퇴사각', '주니어3년차',
  '스택오버플로우중독', '머지충돌', '배포는금요일에', '코드리뷰어', '연봉협상중', '이직각재는중',
]

const POSTS_PER_YEAR = 3

export function generateFeed(
  state: GameState,
  grade: Grade,
  triggers: FeedTrigger[],
  rng: Rng,
): FeedPost[] {
  const matching = feedTemplates.filter((t) => matches(t, state, grade, triggers))
  const posts: FeedPost[] = []
  const used = new Set<string>()

  for (let i = 0; i < POSTS_PER_YEAR; i++) {
    const candidates = matching.filter((t) => !used.has(t.id))
    // 조건이 구체적인 템플릿일수록 우선 (올해 일어난 일에 반응하도록)
    const template = rng.weighted(candidates, (t) => 1 + Object.keys(t.conditions ?? {}).length * 2)
    if (!template) break
    used.add(template.id)
    posts.push({
      platform: template.platform,
      author: rng.pick(AUTHORS),
      text: fill(rng.pick(template.texts), state),
      likes: rng.int(3, 300),
    })
  }
  return posts
}

function matches(t: FeedTemplate, s: GameState, grade: Grade, triggers: FeedTrigger[]): boolean {
  const c = t.conditions
  if (!c) return true
  if (c.grades && !c.grades.includes(grade)) return false
  if (c.companyTypes && !c.companyTypes.includes(s.company.type)) return false
  if (c.industries && !c.industries.includes(s.company.industry)) return false
  if (c.ranks && !c.ranks.includes(s.rank)) return false
  if (c.triggers && !c.triggers.some((tr) => triggers.includes(tr))) return false
  return true
}

function fill(text: string, s: GameState): string {
  return text
    .replaceAll('{name}', s.profile.name)
    .replaceAll('{company}', s.company.name)
    .replaceAll('{salary}', formatSalary(s.salary))
    .replaceAll('{rank}', rankById[s.rank].label)
}
