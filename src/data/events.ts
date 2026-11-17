import type { GameEvent } from '../engine/types'

// 이벤트 콘텐츠. 형식 예시 1개만 두고, 콘텐츠 단계에서 20개로 채운다.
export const events: GameEvent[] = [
  {
    id: 'friday_deploy',
    category: '장애',
    emoji: '🚨',
    title: '금요일 18시 배포',
    text: "팀장이 '간단한 거니까 지금 배포하고 퇴근하자'고 해요.",
    weight: 10,
    choices: [
      {
        label: '그냥 배포한다',
        outcomes: [
          { chance: 0.6, text: '무사히 퇴근했어요.', tone: 'lucky', effects: {} },
          {
            chance: 0.4,
            text: '주말 내내 롤백했어요.',
            tone: 'unlucky',
            effects: { stamina: -20, stats: { reputation: -2 }, counters: { incidents: 1 }, achievement: 'weekend_rollback' },
          },
        ],
      },
      {
        label: '월요일에 하자고 설득한다',
        requires: { communication: 40 },
        outcomes: [
          { chance: 1, text: '팀장이 마지못해 동의했어요.', tone: 'skill', effects: { stats: { communication: 2 } } },
        ],
      },
    ],
  },
]
