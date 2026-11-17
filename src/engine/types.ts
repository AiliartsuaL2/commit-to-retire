// 게임 전체에서 쓰는 타입. 기준 문서: docs/기획서.md

// ─── 능력치 ────────────────────────────────────────────

/** 성장형 능력치 (0~100). 체력은 소모형이라 따로 둔다. */
export type StatKey = 'coding' | 'design' | 'communication' | 'domain' | 'reputation'
export type Stats = Record<StatKey, number>

/** 플레이 스타일이 분배하는 능력치 (평판은 학력·활동으로만 쌓인다) */
export type StyleStatKey = Exclude<StatKey, 'reputation'>

// ─── ID 목록 ───────────────────────────────────────────

export type EducationId =
  | 'top_cs' | 'local_cs' | 'non_major' | 'bootcamp' | 'self_taught' | 'overseas'

export type SpecialtyId = 'backend' | 'frontend' | 'mobile' | 'data_ai' | 'infra' | 'game'

export type PlayStyleId = 'builder' | 'architect' | 'communicator' | 'domain_expert'

export type CompanyTypeId =
  | 'chaebol' | 'chaebol_si' | 'bigtech' | 'foreign' | 'midsize' | 'sme_si'
  | 'agency' | 'seed' | 'series_b' | 'unicorn' | 'finance_public'

export type IndustryId =
  | 'si_sm' | 'b2b_saas' | 'b2c' | 'commerce' | 'fintech' | 'game' | 'ai' | 'public'

export type RankId =
  | 'newbie' | 'junior' | 'mid' | 'senior' | 'lead'
  | 'em' | 'director' | 'vp' | 'cto'
  | 'staff' | 'principal' | 'fellow'

export type Track = 'common' | 'manager' | 'ic'

export type FocusId = 'all_in' | 'study' | 'side_project' | 'networking' | 'job_hunt' | 'rest'

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

export type FameGrade = 'S' | 'A' | 'B' | 'C' | 'D'

export type Flag = 'married' | 'hasChild' | 'mortgage' | 'sideProject' | 'onLeave'

export type FeedPlatform = 'blinder' | 'okko' | 'jobplanet' | 'linkedout' | 'github'

export type EventCategory =
  | '장애' | '레거시' | '일정' | '사람' | '커리어' | '회사' | '업계' | '개인' | '생활'

/** 업적 진행도를 세는 카운터 (장애 대응 횟수 등) */
export type CounterKey =
  | 'incidents' | 'refactors' | 'jobChanges' | 'burnouts' | 'startupFailures' | 'exits'

// ─── 정적 데이터 정의 (src/data/*.ts) ───────────────────

export interface EducationDef {
  id: EducationId
  label: string
  emoji: string
  description: string
  statBonus: Partial<Stats>
  /** 전체 성장률 배수 (고졸 독학 = 대기만성형) */
  growthMultiplier: number
  /** 모든 회사 서류 점수 보정 */
  hiringBonus: number
  /** 특정 회사 유형 추가 보정 */
  companyBonus?: Partial<Record<CompanyTypeId, number>>
}

export interface SpecialtyDef {
  id: SpecialtyId
  label: string
  emoji: string
  /** 이 업종에서 일하면 도메인·설계 성장 보너스 */
  goodIndustries: IndustryId[]
}

export interface PlayStyleDef {
  id: PlayStyleId
  label: string
  description: string
  /** 시작 능력치 분배. 모든 스타일의 합은 같아야 한다 (STYLE_STAT_TOTAL) */
  stats: Record<StyleStatKey, number>
}

export type Level = 1 | 2 | 3 | 4

export interface CompanyTypeDef {
  id: CompanyTypeId
  label: string
  emoji: string
  /** 신입 초봉 (만 원) */
  baseSalary: number
  stockOption: boolean
  /** 능력치 성장 배수 */
  growth: number
  /** 야근 강도 1(낮음)~4(매우 높음). 체력 소모에 반영 */
  overtime: Level
  /** 연간 폐업·구조조정·인수 확률 (0~1) */
  risk: number
  /** 승진 속도 배수. 클수록 빠름 */
  promotionSpeed: number
  /** 서류 통과 기준 점수 */
  hiringBar: number
  /** 회사 이름 후보 (패러디 또는 가상) */
  names: string[]
}

export interface IndustryDef {
  id: IndustryId
  label: string
  emoji: string
  description: string
  salaryMultiplier: number
  /** 업종별 능력치 성장 배수 */
  growth: Partial<Record<StatKey, number>>
}

export interface RankDef {
  id: RankId
  label: string
  track: Track
  /** 이 직급으로 올라오기 위한 최소 총 경력(년) */
  minYears: number
  /** 이 직급으로 올라오기 위한 최소 능력치 */
  minStats: Partial<Stats>
  /** 바로 아래 직급 (승진 경로) */
  from: RankId | null
  /** 승진 시 연봉 인상률 */
  salaryBump: number
  /** 엔딩 명성 점수에 들어가는 직책 점수 */
  fameScore: number
}

export interface FocusDef {
  id: FocusId
  label: string
  emoji: string
  description: string
  /** 1년 동안 추가로 얻는 능력치 */
  statGain: Partial<Stats>
  /** 체력 변화 (회사 야근에 의한 소모와 별개) */
  stamina: number
  /** 고과 점수 보정 */
  gradeBonus: number
  /** 연말 이직 제안 수 보정 */
  offerBonus: number
  setFlags?: Flag[]
}

export interface AchievementDef {
  id: string
  title: string
  emoji: string
  description: string
  /** 엔딩 명성 점수에 더해지는 점수 */
  fame: number
}

// ─── 이벤트 ────────────────────────────────────────────

/** 선택 결과가 상태에 주는 변화 */
export interface Effects {
  stats?: Partial<Stats>
  stamina?: number
  /** 연봉 변화율 (0.1 = +10%) */
  salaryPct?: number
  /** 자산 변화 (만 원) */
  assets?: number
  /** 이번 해 고과 점수 보정 */
  gradeBonus?: number
  setFlags?: Flag[]
  clearFlags?: Flag[]
  counters?: Partial<Record<CounterKey, number>>
  achievement?: string
}

export interface EventOutcome {
  /** 같은 선택지 안의 결과 확률. 합이 1이어야 한다. 플레이어에게 보여주지 않는다 */
  chance: number
  text: string
  /** 운인지 실력인지 결과 문구에 붙는 힌트 */
  tone?: 'lucky' | 'unlucky' | 'skill'
  effects: Effects
}

export interface EventChoice {
  label: string
  /** 선택 가능 조건. 화면에 공개된다 ("소통 40 필요") */
  requires?: Partial<Stats>
  outcomes: EventOutcome[]
}

export interface EventConditions {
  minCareerYear?: number
  maxCareerYear?: number
  minAge?: number
  maxAge?: number
  companyTypes?: CompanyTypeId[]
  industries?: IndustryId[]
  ranks?: RankId[]
  specialties?: SpecialtyId[]
  flags?: Flag[]
  notFlags?: Flag[]
  /** 게임 내 달력 연도 (AI 시대 흐름 이벤트용) */
  minCalendarYear?: number
}

export interface GameEvent {
  id: string
  category: EventCategory
  emoji: string
  title: string
  text: string
  conditions?: EventConditions
  /** 등장 가중치 */
  weight: number
  /** 한 판에 한 번만 */
  once?: boolean
  choices: EventChoice[]
}

// ─── 커뮤니티 반응 ─────────────────────────────────────

export interface FeedTemplate {
  id: string
  platform: FeedPlatform
  conditions?: {
    grades?: Grade[]
    companyTypes?: CompanyTypeId[]
    industries?: IndustryId[]
    ranks?: RankId[]
    /** 올해 이런 일이 있었을 때 */
    triggers?: FeedTrigger[]
  }
  /** {name} {company} {salary} {rank} 치환 */
  texts: string[]
}

export type FeedTrigger =
  | 'promoted' | 'jobChanged' | 'burnout' | 'companyClosed' | 'exit' | 'incident' | 'raise'

export interface FeedPost {
  platform: FeedPlatform
  author: string
  text: string
  likes: number
}

// ─── 게임 상태 (localStorage에 저장되는 것) ──────────────

export interface Company {
  name: string
  type: CompanyTypeId
  industry: IndustryId
}

export interface JobOffer {
  company: Company
  rank: RankId
  salary: number
}

export interface Profile {
  name: string
  emoji: string
  startAge: number
  education: EducationId
  specialty: SpecialtyId
  playStyle: PlayStyleId
  /** 집중 육성 능력치 (최대 2개) */
  focusStats: StatKey[]
}

export interface EventLogEntry {
  eventId: string
  choiceIndex: number
  outcomeText: string
}

export interface YearRecord {
  calendarYear: number
  age: number
  company: Company
  rank: RankId
  focus: FocusId
  grade: Grade
  salaryBefore: number
  salaryAfter: number
  statsBefore: Stats
  statsAfter: Stats
  events: EventLogEntry[]
  triggers: FeedTrigger[]
  feed: FeedPost[]
}

export type Phase =
  | 'year_start'  // 올해의 집중 선택
  | 'event'       // 이벤트 선택 중
  | 'year_end'    // 연말 결과 화면
  | 'hub'         // 확인할 일 (이직 제안 등)
  | 'retired'

export type RetireReason = 'age' | 'voluntary' | 'burnout' | 'startup_quit'

export interface Retirement {
  reason: RetireReason
  fameScore: number
  fameGrade: FameGrade
  title: string
}

export interface GameState {
  version: 1
  seed: number
  /** 시드 RNG의 현재 내부 상태 — 저장 후 이어하기에도 같은 결과가 나오게 */
  rngState: number

  profile: Profile
  phase: Phase

  /** 경력 연차 (첫 해 = 1) */
  careerYear: number
  calendarYear: number
  age: number

  stats: Stats
  /** 0~100. 0이 되면 번아웃 */
  stamina: number
  /** 연봉 (만 원) */
  salary: number
  /** 자산 (만 원) */
  assets: number

  rank: RankId
  company: Company
  yearsAtCompany: number
  yearsAtRank: number

  /** 올해 선택한 집중 */
  focus: FocusId | null
  /** 올해 남은 이벤트 */
  pendingEvents: string[]
  /** 올해 고과에 더해질 점수 */
  gradeBonus: number

  offers: JobOffer[]
  flags: Flag[]
  counters: Record<CounterKey, number>
  achievements: string[]
  /** once 이벤트 재등장 방지 */
  seenEvents: string[]

  history: YearRecord[]
  retirement: Retirement | null
}
