import type { EducationDef, PlayStyleDef, SpecialtyDef } from '../engine/types'

export const START_AGE_MIN = 22
export const START_AGE_MAX = 32
export const RETIRE_AGE = 60
export const START_CALENDAR_YEAR = 2026

/** 모든 플레이 스타일의 시작 능력치 합 */
export const STYLE_STAT_TOTAL = 120

export const educations: EducationDef[] = [
  {
    id: 'top_cs',
    label: '명문대 컴공',
    emoji: '🎓',
    description: '대기업·빅테크 서류가 잘 붙어요.',
    statBonus: { coding: 5, design: 5, reputation: 5 },
    growthMultiplier: 1.0,
    hiringBonus: 25,
  },
  {
    id: 'local_cs',
    label: '지방대 컴공',
    emoji: '🏫',
    description: '기본기는 탄탄해요. 서류는 조금 험난해요.',
    statBonus: { coding: 5 },
    growthMultiplier: 1.05,
    hiringBonus: 10,
  },
  {
    id: 'non_major',
    label: '비전공',
    emoji: '🔄',
    description: '코딩은 늦게 배웠지만 세상 보는 눈이 넓어요.',
    statBonus: { coding: -10, domain: 10, communication: 5 },
    growthMultiplier: 1.05,
    hiringBonus: 0,
  },
  {
    id: 'bootcamp',
    label: '부트캠프',
    emoji: '⛺',
    description: '실전 구현은 빠른데 기초 설계는 약해요.',
    statBonus: { coding: 5, design: -5 },
    growthMultiplier: 1.0,
    hiringBonus: 5,
    companyBonus: { seed: 15, series_b: 10, agency: 10 },
  },
  {
    id: 'self_taught',
    label: '고졸 독학',
    emoji: '📚',
    description: '시작은 약하지만 가장 빨리 자라요.',
    statBonus: { coding: -5, design: -5, communication: -5, domain: -5 },
    growthMultiplier: 1.25,
    hiringBonus: -5,
  },
  {
    id: 'overseas',
    label: '해외대',
    emoji: '✈️',
    description: '외국계 문이 넓고 영어 회의가 두렵지 않아요.',
    statBonus: { communication: 5 },
    growthMultiplier: 1.0,
    hiringBonus: 15,
    companyBonus: { foreign: 25 },
  },
]

export const specialties: SpecialtyDef[] = [
  { id: 'backend', label: '백엔드', emoji: '🗄️', goodIndustries: ['b2b_saas', 'fintech', 'commerce'] },
  { id: 'frontend', label: '프론트엔드', emoji: '🎨', goodIndustries: ['b2c', 'commerce'] },
  { id: 'mobile', label: '모바일', emoji: '📱', goodIndustries: ['b2c', 'fintech'] },
  { id: 'data_ai', label: '데이터·AI', emoji: '🤖', goodIndustries: ['ai', 'commerce'] },
  { id: 'infra', label: '인프라·DevOps', emoji: '☁️', goodIndustries: ['b2b_saas', 'b2c'] },
  { id: 'game', label: '게임 클라이언트', emoji: '🎮', goodIndustries: ['game'] },
]

export const playStyles: PlayStyleDef[] = [
  {
    id: 'builder',
    label: '구현 장인',
    description: '일단 만들고 보는 타입이에요.',
    stats: { coding: 45, design: 25, communication: 25, domain: 25 },
  },
  {
    id: 'architect',
    label: '설계 덕후',
    description: '코드보다 다이어그램을 먼저 그려요.',
    stats: { coding: 35, design: 40, communication: 20, domain: 25 },
  },
  {
    id: 'communicator',
    label: '회의실 해결사',
    description: '기획자와 싸우지 않고 원하는 걸 얻어내요.',
    stats: { coding: 30, design: 25, communication: 40, domain: 25 },
  },
  {
    id: 'domain_expert',
    label: '도메인 마스터',
    description: '비즈니스를 이해하는 개발자예요.',
    stats: { coding: 30, design: 25, communication: 25, domain: 40 },
  },
]
