import type { FeedPlatform, FeedTemplate } from '../engine/types'

export const platformLabels: Record<FeedPlatform, string> = {
  blinder: '블라인더',
  okko: 'OKKO',
  jobplanet: '잡행성',
  linkedout: '링크드아웃',
  github: '깃허브 이슈',
}

// 반응 템플릿. 형식 예시만 두고, 콘텐츠 단계에서 30개로 채운다.
export const feedTemplates: FeedTemplate[] = [
  {
    id: 'blinder_raise_s',
    platform: 'blinder',
    conditions: { grades: ['S'] },
    texts: ['{company} 올해 S 받은 사람 있음? 연봉 {salary} 찍었다는 소문 돌던데'],
  },
  {
    id: 'linkedout_promoted',
    platform: 'linkedout',
    conditions: { triggers: ['promoted'] },
    texts: ['오늘 {company}에서 {rank}(으)로 새로운 여정을 시작합니다. 함께해 주신 모든 분께 감사드립니다 🙏 #성장 #도전'],
  },
]
