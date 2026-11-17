import type { FeedPlatform, FeedTemplate, RankId } from '../engine/types'

export const platformLabels: Record<FeedPlatform, string> = {
  blinder: '블라인더',
  okko: 'OKKO',
  jobplanet: '잡행성',
  linkedout: '링크드아웃',
  github: '깃허브 이슈',
}

const EARLY_RANKS: RankId[] = ['newbie', 'junior']
const SENIOR_UP: RankId[] = ['senior', 'lead', 'em', 'director', 'vp', 'cto', 'staff', 'principal', 'fellow']

// 연말 커뮤니티 반응 템플릿. 게임 속 게시글이라 화면 문구(해요체)와 달리 커뮤니티 말투를 쓴다.
// 조건이 많을수록 뽑힐 가중치가 높다 (engine/feed.ts). jobChanged 트리거는 아직 엔진에서 나오지 않는다.
export const feedTemplates: FeedTemplate[] = [
  // ─── 조건 없음 (언제나 나올 수 있다) ─────────────────────
  {
    id: 'blinder_salary_check',
    platform: 'blinder',
    texts: [
      '{company} {rank}인데 연봉 {salary}면 평균임? 인증은 못 함',
      '{company} {rank} {salary} 받는데 이직각임? 댓글로 팩폭 부탁',
    ],
  },
  {
    id: 'blinder_friday_deploy',
    platform: 'blinder',
    texts: [
      '금요일 오후 5시에 배포하자는 사람 누구냐. {company}에 실존함',
      '{company} 오늘도 회의하느라 일을 못 해서 일하려고 야근함',
    ],
  },
  {
    id: 'okko_career_question',
    platform: 'okko',
    texts: [
      '{rank} 때는 뭘 공부해야 할까요? (답변 1: 기본기요. 답변 2: 검색은 해보셨나요)',
      'AI가 코드 다 짜주는데 개발자 계속 해도 될까요? 매년 올라오는 질문인 건 압니다',
    ],
  },
  {
    id: 'okko_temp_code',
    platform: 'okko',
    texts: ['주석에 "임시 코드, 다음 주에 삭제"라고 적혀 있는데 작성일이 9년 전입니다. 지워도 될까요?'],
  },
  {
    id: 'jobplanet_lunch_review',
    platform: 'jobplanet',
    texts: [
      '★★★☆☆ {company}: 장점은 점심이 맛있음. 단점은 점심 빼고 전부.',
      '★★☆☆☆ {company}: 가족 같은 회사. 가족이라 야근수당이 없음.',
    ],
  },
  {
    id: 'linkedout_year_review',
    platform: 'linkedout',
    texts: [
      '올해도 {company}에서 많이 배웠습니다. 배운 건 주로 야근이지만 겸손하게 적어봅니다 🙏 #회고 #성장',
      '{company} {rank}의 1년, 실패도 자산입니다. 자산이 꽤 많이 쌓였습니다 #회고 #인사이트',
    ],
  },
  {
    id: 'github_works_on_my_machine',
    platform: 'github',
    texts: [
      'Issue #4821: 제 로컬에서는 되는데요? · 라벨: wontfix',
      'PR 리뷰: "LGTM" · 변경 3,000줄, 리뷰에 걸린 시간 12초',
    ],
  },
  {
    id: 'github_todo_overflow',
    platform: 'github',
    texts: ['Issue: TODO 주석이 코드보다 많습니다 · 답변: 그것도 TODO에 넣어 두겠습니다'],
  },

  // ─── 고과 ───────────────────────────────────────────────
  {
    id: 'blinder_raise_s',
    platform: 'blinder',
    conditions: { grades: ['S'] },
    texts: [
      '{company} 올해 S 받은 사람 있음? 연봉 {salary} 찍었다는 소문 돌던데',
      '{company} {name} S 받았다며. 그 팀은 일을 그 사람 혼자 하나 봄',
    ],
  },
  {
    id: 'linkedout_grade_s',
    platform: 'linkedout',
    conditions: { grades: ['S'] },
    texts: ['{company}에서 올해 최고 등급 평가를 받았습니다. 운이 좋았을 뿐입니다 (전혀 그렇게 생각 안 함) #겸손 #감사'],
  },
  {
    id: 'blinder_grade_a',
    platform: 'blinder',
    conditions: { grades: ['A'] },
    texts: [
      '{company} A 받고 {salary} 됐는데 계산기 두드려보니 물가 상승률이 이김',
      'A 받았는데 S는 누가 받는 거냐. {company}는 S가 전설 속 등급임',
    ],
  },
  {
    id: 'jobplanet_grade_low',
    platform: 'jobplanet',
    conditions: { grades: ['C', 'D'] },
    texts: ['★☆☆☆☆ {company}: 평가 기준이 불투명함. (작성자는 방금 올해 고과를 확인함)'],
  },
  {
    id: 'okko_grade_low',
    platform: 'okko',
    conditions: { grades: ['C', 'D'] },
    texts: ['고과 바닥 찍었는데 이직할 때 티 나나요? 참고로 저는 잘못 없고 팀장이 문제입니다'],
  },
  {
    id: 'github_grade_low',
    platform: 'github',
    conditions: { grades: ['C', 'D'] },
    texts: ['PR #77 "{name}의 올해 성과" · 상태: Changes requested · 리뷰어: 팀장'],
  },

  // ─── 올해 일어난 일 ─────────────────────────────────────
  {
    id: 'linkedout_promoted',
    platform: 'linkedout',
    conditions: { triggers: ['promoted'] },
    texts: [
      '{company}에서 {rank} 직책으로 새로운 여정을 시작합니다. 함께해 주신 모든 분께 감사드립니다 🙏 #성장 #도전',
      '승진 소식을 전합니다. 이제 {company}의 {rank}입니다. 연봉이 {salary}라는 건 굳이 적지 않겠습니다 #감사',
    ],
  },
  {
    id: 'blinder_promoted',
    platform: 'blinder',
    conditions: { triggers: ['promoted'] },
    texts: ['{company} {name} 이번에 {rank} 달았다며? 축하는 하는데 일은 그대로고 책임만 는다더라'],
  },
  {
    id: 'okko_burnout',
    platform: 'okko',
    conditions: { triggers: ['burnout'] },
    texts: ['번아웃 와서 모니터만 3시간째 보고 있습니다. 다들 어떻게 버티시나요? (답변: 못 버팁니다)'],
  },
  {
    id: 'blinder_burnout',
    platform: 'blinder',
    conditions: { triggers: ['burnout'] },
    texts: ['{company} {name} 요즘 안 보이던데 번아웃 왔다더라. 남 일 같지 않아서 나도 연차 냄'],
  },
  {
    id: 'github_burnout',
    platform: 'github',
    conditions: { triggers: ['burnout'] },
    texts: ['Issue: 메인테이너가 응답이 없습니다 · 마지막 커밋 메시지: "쉬고 싶다"'],
  },
  {
    id: 'blinder_company_closed',
    platform: 'blinder',
    conditions: { triggers: ['companyClosed'] },
    texts: [
      '{company} 문 닫는다는 글 올라옴. 어제까지 "우리는 가족"이라더니 가족 해체됨',
      '{company} 폐업 실화냐. 스톡옵션 계약서로 벽지 바르면 몇 평 나옴?',
    ],
  },
  {
    id: 'jobplanet_company_closed',
    platform: 'jobplanet',
    conditions: { triggers: ['companyClosed'] },
    texts: ['★☆☆☆☆ {company}: 리뷰 쓰는 사이에 회사가 없어짐. 간식 창고는 좋았음.'],
  },
  {
    id: 'blinder_layoff',
    platform: 'blinder',
    conditions: { triggers: ['layoff'] },
    texts: ['{company} 권고사직 돈다. 면담 잡혔는데 회의실 이름이 "희망"임'],
  },
  {
    id: 'linkedout_layoff',
    platform: 'linkedout',
    conditions: { triggers: ['layoff'] },
    texts: ['{company}에서의 여정을 마무리하고 새로운 기회를 찾습니다. 자발적이라고는 안 했습니다 #구직중 #새출발'],
  },
  {
    id: 'linkedout_exit',
    platform: 'linkedout',
    conditions: { triggers: ['exit'] },
    texts: ['회사의 엑싯을 함께했습니다. 스톡옵션만 믿고 버틴 지난날의 저에게 박수를 보냅니다 #엑싯 #존버'],
  },
  {
    id: 'blinder_exit',
    platform: 'blinder',
    conditions: { triggers: ['exit'] },
    texts: ['{name}네 회사 엑싯했다며? 스톡옵션 있는 사람들 오늘 표정 관리 안 되던데. 부럽다'],
  },
  {
    id: 'github_incident',
    platform: 'github',
    conditions: { triggers: ['incident'] },
    texts: [
      'Issue: 새벽 3시 프로덕션 장애 · 원인: 금요일 배포 · 재발 방지책: "주의하겠습니다"',
      'hotfix: 진짜 최종 수정 (final_진짜최종_v3) · 리뷰 없이 머지됨',
    ],
  },
  {
    id: 'blinder_incident',
    platform: 'blinder',
    conditions: { triggers: ['incident'] },
    texts: ['{company} 장애 난 거 누가 배포했냐. 범인 찾지 말고 회고하자더니 다들 범인만 찾음'],
  },
  {
    id: 'okko_incident',
    platform: 'okko',
    conditions: { triggers: ['incident'] },
    texts: ['장애 회고 문서에 원인을 "휴먼 에러"라고만 적으면 안 되나요? 그 휴먼이 접니다'],
  },

  // ─── 회사 유형 ──────────────────────────────────────────
  {
    id: 'jobplanet_si_project',
    platform: 'jobplanet',
    conditions: { companyTypes: ['sme_si', 'agency'] },
    texts: [
      '★★☆☆☆ {company}: 프로젝트 끝나면 쉴 줄 알았는데 다음 프로젝트가 어제 시작됨.',
      '★★☆☆☆ {company}: 요구사항은 매일 바뀌는데 오픈일만 안 바뀜.',
    ],
  },
  {
    id: 'blinder_startup_rocket',
    platform: 'blinder',
    conditions: { companyTypes: ['seed', 'series_b'] },
    texts: [
      '{company} 대표님이 또 "우리는 로켓"이라고 함. 연료는 내 주말인 듯',
      '{company} 스톡옵션 행사가 계산해봤는데 그냥 로또 사는 게 나음',
    ],
  },
  {
    id: 'blinder_bigtech_flex',
    platform: 'blinder',
    conditions: { companyTypes: ['bigtech', 'unicorn'] },
    texts: ['{company} 다닌다고 하면 다들 부러워하는데 나는 판교 점심 줄이 제일 힘듦. 연봉은 {salary}'],
  },
  {
    id: 'jobplanet_chaebol_report',
    platform: 'jobplanet',
    conditions: { companyTypes: ['chaebol', 'chaebol_si'] },
    texts: ['★★★☆☆ {company}: 코딩 실력보다 보고서 장표 실력이 늘어남. 복지는 좋음.'],
  },
  {
    id: 'okko_finance_public',
    platform: 'okko',
    conditions: { companyTypes: ['finance_public'] },
    texts: ['{company}인데 망분리라 검색도 못 하고 개발합니다. 이직해야 할까요? (답변: 칼퇴하시잖아요. 참으세요)'],
  },
  {
    id: 'blinder_dispatch_newbie',
    platform: 'blinder',
    conditions: { companyTypes: ['sme_si', 'agency'], ranks: EARLY_RANKS },
    texts: ['{company} 입사하자마자 파견 나와서 본사 사람 얼굴을 모름. 내 회사가 어디지'],
  },

  // ─── 업종 ───────────────────────────────────────────────
  {
    id: 'okko_si_escape',
    platform: 'okko',
    conditions: { industries: ['si_sm'] },
    texts: ['SI에서 {rank}까지 했는데 서비스 회사 갈 수 있나요? 매주 올라오는 질문인 건 압니다'],
  },
  {
    id: 'github_game_crunch',
    platform: 'github',
    conditions: { industries: ['game'] },
    texts: ['Issue: 출시 D-7인데 빌드가 깨졌습니다 · 댓글: 크런치 3주차라 다들 반응이 없습니다'],
  },
  {
    id: 'blinder_fintech_audit',
    platform: 'blinder',
    conditions: { industries: ['fintech'] },
    texts: ['{company} 보안 감사 또 나옴. 올해 짠 코드보다 낸 증적 자료가 더 많음'],
  },
  {
    id: 'jobplanet_commerce_holiday',
    platform: 'jobplanet',
    conditions: { industries: ['commerce'] },
    texts: ['★★★☆☆ {company}: 블프와 명절마다 비상 대기. 달력의 빨간 날은 우리와 무관함.'],
  },
  {
    id: 'linkedout_ai_insight',
    platform: 'linkedout',
    conditions: { industries: ['ai'] },
    texts: ['AI 업계 {rank}의 내년 전망을 공유합니다. 결론: 저도 내년에 뭐가 나올지 모릅니다 #AI #인사이트'],
  },

  // ─── 직급 ───────────────────────────────────────────────
  {
    id: 'okko_no_mentor',
    platform: 'okko',
    conditions: { ranks: EARLY_RANKS },
    texts: ['사수가 없습니다. 제가 짠 코드가 리뷰 없이 그대로 운영에 나가는데 정상인가요?'],
  },
  {
    id: 'github_first_pr',
    platform: 'github',
    conditions: { ranks: EARLY_RANKS },
    texts: ['PR: 오타 수정 (첫 기여입니다!) · 리뷰 코멘트 47개 달림'],
  },
  {
    id: 'linkedout_senior_advice',
    platform: 'linkedout',
    conditions: { ranks: SENIOR_UP },
    texts: ['주니어분들께 드리는 조언: 결국 코드보다 사람입니다. (본인은 하루에 회의만 6개) #리더십 #조언'],
  },
  {
    id: 'okko_senior_question',
    platform: 'okko',
    conditions: { ranks: SENIOR_UP },
    texts: ['요즘 주니어들은 왜 질문을 안 할까요? (댓글: 질문하면 "검색은 해봤니"라고 하셔서요)'],
  },
]
