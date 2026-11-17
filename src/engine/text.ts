// 문구 치환: {이름} 자리 채우기와 한국어 조사 고르기. 피드와 이벤트가 함께 쓴다.

/** {key}를 값으로 바꾸고, 뒤따르는 조사를 받침에 맞춘다 */
export function fillTemplate(text: string, values: Record<string, string>): string {
  let out = text
  for (const [key, value] of Object.entries(values)) out = out.replaceAll(`{${key}}`, value)
  return applyParticles(out)
}

/** 문구에 쓰인 {이름} 목록 */
export function placeholdersIn(text: string): string[] {
  return [...text.matchAll(/\{([a-zA-Z_]+)\}/g)].map((m) => m[1])
}

/** [받침이 있을 때, 없을 때] */
const PARTICLE_PAIRS: [string, string][] = [
  ['이', '가'],
  ['은', '는'],
  ['을', '를'],
  ['과', '와'],
  ['아', '야'],
]

/**
 * "{rank}(으)로", "{company}(이)가", "{name}(은)는", "{company}(와)과" 같은 표기를
 * 바로 앞 글자의 받침에 맞춰 고른다. "(이)야", "(이)라서" 같은 서술격 '이'도 된다.
 * 예: 신입(으)로 → 신입으로, 시니어(으)로 → 시니어로, 서울(으)로 → 서울로
 */
export function applyParticles(text: string): string {
  return text.replace(/\((이|은|을|과|와|아|으)\)([가-힣]+)/g, (match, open: string, rest: string, offset: number) => {
    const final = finalConsonant(text.slice(0, offset))
    if (final === null) return match
    const hasFinal = final !== 'none'
    // (으)로: 받침이 없거나 ㄹ 받침이면 '로'
    if (open === '으') return hasFinal && final !== 'ㄹ' ? `으${rest}` : rest
    const pair = PARTICLE_PAIRS.find(([a, b]) => (open === a && rest[0] === b) || (open === b && rest[0] === a))
    if (pair) return (hasFinal ? pair[0] : pair[1]) + rest.slice(1)
    // 서술격 조사: (이)야, (이)라서, (이)나
    if (open === '이') return hasFinal ? `이${rest}` : rest
    return match
  })
}

type Final = 'none' | 'ㄹ' | 'other'

// 숫자를 읽었을 때의 받침: 영 일 이 삼 사 오 육 칠 팔 구
const DIGIT_FINAL: Final[] = ['other', 'ㄹ', 'none', 'other', 'none', 'none', 'other', 'ㄹ', 'ㄹ', 'none']

/** 문자열 마지막 글자의 받침. 닫는 괄호·따옴표·공백은 건너뛴다. 판단할 글자가 없으면 null */
export function finalConsonant(before: string): Final | null {
  const trimmed = before.replace(/[\s)\]"'’”」』>]+$/, '')
  const ch = trimmed.at(-1)
  if (!ch) return null
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jong = (code - 0xac00) % 28
    return jong === 0 ? 'none' : jong === 8 ? 'ㄹ' : 'other'
  }
  if (/[0-9]/.test(ch)) return DIGIT_FINAL[Number(ch)]
  if (/[A-Za-z]/.test(ch)) return latinFinal(trimmed.match(/[A-Za-z]+$/)![0])
  return 'none'
}

/** 영어는 대략적인 소리로 판단한다: 짧은 대문자 약어(CTO, VP)는 알파벳 이름, 단어는 끝소리 */
function latinFinal(word: string): Final {
  const lower = word.toLowerCase()
  const last = lower.at(-1)!
  if (word.length <= 4 && word === word.toUpperCase()) {
    // 엘·알은 ㄹ 받침, 엠·엔은 받침 있음, 나머지(에이, 비, 씨, 오…)는 받침 없음
    return last === 'l' || last === 'r' ? 'ㄹ' : last === 'm' || last === 'n' ? 'other' : 'none'
  }
  if (last === 'l') return 'ㄹ'
  return /[mnkptb]$/.test(lower) || lower.endsWith('ng') ? 'other' : 'none'
}
