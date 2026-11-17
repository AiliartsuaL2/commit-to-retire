import type { GameEvent } from '../engine/types'

// 이벤트 콘텐츠. 형식은 src/engine/types.ts의 GameEvent.
// - 선택지마다 outcomes의 chance 합은 1 (data.test.ts가 검사)
// - 확률과 능력치 판정(check)은 플레이어에게 보이지 않는다. check가 있는 선택지는 실패(unlucky)와 성공 결과가 모두 필요
// - 문구는 해요체
// - 자주 나오는 이벤트는 볼 때마다 달라지게 한다:
//   severity: true → 뽑힐 때 심각도(1 가벼움 · 2 보통 · 3 큰일)를 굴려 결과의 체력·고과·능력치 변화와 실패 확률이 달라진다
//   vars → 뽑힐 때 굴리는 변수. 문구에 {이름}으로 쓰고, 뒤에 (이)가 · (을)를 · (으)로 같은 조사 표기를 붙일 수 있다.
//          bySeverity로 심각도별 후보를 따로 둘 수 있다. {name} {company} {rank}는 언제나 쓸 수 있다
//   variants → 같은 선택지를 쓰는 다른 장면(제목·본문). 결과 문구와 어긋나지 않게 쓴다

const STARTUPS = ['seed', 'series_b', 'unicorn'] as const

export const events: GameEvent[] = [
  // ─── 장애 ──────────────────────────────────────────────
  {
    id: 'friday_deploy',
    category: '장애',
    emoji: '🚨',
    title: '금요일 {hour}시 배포',
    text: "팀장이 '{change} 정도는 간단하니까 지금 배포하고 퇴근하자'고 해요.",
    weight: 10,
    severity: true,
    vars: {
      hour: { min: 17, max: 19 },
      change: {
        bySeverity: [
          ['버튼 문구 수정', '오타 수정', '배너 이미지 교체'],
          ['쿠폰 기능', '검색 필터 개편', '알림 설정 화면'],
          ['결제 모듈 교체', '회원 DB 마이그레이션', '로그인 방식 개편'],
        ],
      },
    },
    variants: [
      {
        title: '연휴 전날 배포',
        text: "내일부터 연휴예요. 팀장이 '{change} 정도는 올리고 가자'고 해요. 다들 벌써 가방을 싸고 있어요.",
      },
      {
        title: '공지 없는 {hour}시 배포',
        text: "오늘은 금요일이에요. 팀장이 '{change} 정도는 공지 없이 조용히 올리자'고 해요.",
      },
    ],
    choices: [
      {
        label: '그냥 배포한다',
        outcomes: [
          { chance: 0.6, text: '무사히 퇴근했어요.', tone: 'lucky', effects: {} },
          {
            chance: 0.4,
            text: '{change}(이)가 터져서 주말 내내 롤백했어요.',
            tone: 'unlucky',
            effects: { stamina: -20, stats: { reputation: -2 }, counters: { incidents: 1 }, achievement: 'weekend_rollback' },
          },
        ],
      },
      {
        label: '월요일에 하자고 설득한다',
        check: { communication: 40 },
        outcomes: [
          { chance: 0.7, text: '팀장이 마지못해 동의했어요.', tone: 'skill', effects: { stats: { communication: 2 } } },
          {
            chance: 0.3,
            text: "팀장이 '말 많네' 하며 그냥 배포했어요. 주말이 날아갔어요.",
            tone: 'unlucky',
            effects: { stamina: -15, counters: { incidents: 1 }, achievement: 'weekend_rollback' },
          },
        ],
      },
    ],
  },
  {
    id: 'dawn_db_lock',
    category: '장애',
    emoji: '🌙',
    title: '새벽 {hour}시 DB 락',
    text: '알림이 울려요. {table} 테이블에 락이 걸려서 {scope}.',
    weight: 8,
    severity: true,
    vars: {
      hour: { min: 2, max: 5 },
      table: ['주문', '결제', '회원', '재고', '정산'],
      scope: {
        bySeverity: [
          ['관리자 화면이 느려졌어요', '일부 요청이 밀리고 있어요'],
          ['서비스가 멈췄어요', '앱이 계속 로딩만 돌아요'],
          ['서비스 전체가 멈췄고 대표님 전화가 오고 있어요', '서비스 전체가 멈췄고 실시간 검색어에 올랐어요'],
        ],
      },
      minutes: { bySeverity: [{ min: 5, max: 15 }, { min: 20, max: 40 }, { min: 50, max: 90 }] },
    },
    variants: [
      {
        title: '연휴 새벽 {hour}시 DB 락',
        text: '연휴 당직인데 알림이 울려요. {table} 테이블에 락이 걸려서 {scope}.',
      },
    ],
    choices: [
      {
        label: '혼자 원인을 찾는다',
        check: { coding: 50 },
        outcomes: [
          { chance: 0.7, text: '{minutes}분 만에 범인 쿼리를 찾아 죽였어요. 아침에 팀장이 칭찬했어요.', tone: 'skill', effects: { stamina: -8, gradeBonus: 8, counters: { incidents: 1 } } },
          { chance: 0.3, text: '해 뜰 때까지 헤맸어요. 결국 선배가 5분 만에 해결했어요.', tone: 'unlucky', effects: { stamina: -15, stats: { coding: 2 }, counters: { incidents: 1 } } },
        ],
      },
      {
        label: '선배를 깨운다',
        outcomes: [
          { chance: 1, text: '선배가 해결했어요. 대신 선배 눈빛이 일주일 동안 차가웠어요.', effects: { stamina: -5, stats: { domain: 2 }, counters: { incidents: 1 } } },
        ],
      },
      {
        label: '못 본 척 다시 잔다',
        outcomes: [
          { chance: 0.4, text: '다른 사람이 처리했어요. 아무도 모르는 것 같아요.', tone: 'lucky', effects: { stamina: 5 } },
          { chance: 0.6, text: '아침 회의에서 알림 수신 기록이 공개됐어요.', tone: 'unlucky', effects: { gradeBonus: -20, stats: { reputation: -3 } } },
        ],
      },
    ],
  },
  {
    id: 'black_friday',
    category: '장애',
    emoji: '🛒',
    title: '블랙프라이데이 트래픽 폭주',
    text: '평소의 30배 트래픽이 몰려와요. 결제 서버 응답이 10초를 넘겼어요.',
    weight: 8,
    conditions: { industries: ['commerce', 'b2c'] },
    choices: [
      {
        label: '긴급 스케일아웃을 주도한다',
        check: { design: 50 },
        outcomes: [
          { chance: 0.75, text: '서버를 늘리고 캐시를 붙여 버텼어요. 사내 공지에 이름이 올라갔어요.', tone: 'skill', effects: { stamina: -15, gradeBonus: 15, stats: { reputation: 3 }, counters: { incidents: 1 } } },
          { chance: 0.25, text: '늘린 서버가 DB를 더 괴롭혔어요. 매출 손실 보고서를 썼어요.', tone: 'unlucky', effects: { stamina: -20, gradeBonus: -5, stats: { design: 3 }, counters: { incidents: 1 } } },
        ],
      },
      {
        label: '시키는 대로 로그만 본다',
        outcomes: [
          { chance: 1, text: '밤새 로그를 봤어요. 많이 배웠지만 아무도 기억하지 않아요.', effects: { stamina: -12, stats: { domain: 3 }, counters: { incidents: 1 } } },
        ],
      },
    ],
  },

  // ─── 레거시 ────────────────────────────────────────────
  {
    id: 'legacy_no_comment',
    category: '레거시',
    emoji: '🦴',
    title: '주석 없는 {age}년 된 코드',
    text: '{lines}줄짜리 함수를 고쳐야 해요. 변수 이름이 전부 {names} 같은 식이에요.',
    weight: 9,
    severity: true,
    vars: {
      age: { min: 8, max: 25 },
      lines: { bySeverity: [['300', '500'], ['2,000', '3,000'], ['8,000', '12,000']] },
      names: ['a1, a2, temp3', 'data, data2, dataFinal', 'x, xx, xxx', 'tmp, tmp_new, tmp_real'],
    },
    variants: [
      {
        title: '퇴사자가 남긴 {age}년 된 배치',
        text: '아무도 내용을 모르는 {lines}줄짜리 배치를 고쳐야 해요. 변수 이름이 전부 {names} 같은 식이에요.',
      },
      {
        title: '외주사가 납품하고 사라진 코드',
        text: '{age}년 전 외주사가 납품한 {lines}줄짜리 함수를 고쳐야 해요. 외주사는 폐업했고 변수 이름이 전부 {names} 같은 식이에요.',
      },
    ],
    choices: [
      {
        label: '이참에 리팩토링한다',
        check: { design: 40 },
        outcomes: [
          { chance: 0.6, text: '깔끔하게 쪼갰어요. 다음 사람은 덜 울 거예요.', tone: 'skill', effects: { stamina: -10, stats: { design: 4 }, counters: { refactors: 1 } } },
          { chance: 0.4, text: '리팩토링하다 숨은 정산 로직을 깨뜨렸어요. 경위서를 썼어요.', tone: 'unlucky', effects: { stamina: -10, gradeBonus: -15, stats: { design: 2 }, counters: { refactors: 1 } } },
        ],
      },
      {
        label: '필요한 한 줄만 고친다',
        outcomes: [
          { chance: 1, text: '한 줄 고치고 조용히 커밋했어요. 기술 부채가 또 쌓였어요.', effects: { stats: { domain: 1 } } },
        ],
      },
    ],
  },
  {
    id: 'do_not_touch',
    category: '레거시',
    emoji: '⚠️',
    title: '"건드리지 마시오" 모듈',
    text: '주석에 "{warning}. {year}년 {author}"(이)라고 적혀 있어요. 그런데 여기에 버그가 있어요.',
    weight: 6,
    severity: true,
    vars: {
      warning: ['이 코드는 건드리지 마시오', '수정 금지. 이유는 묻지 마시오', '여기를 고치면 정산이 틀어짐', '건드리면 책임 못 짐'],
      year: { min: 2009, max: 2019 },
      author: ['김OO', '박OO', '퇴사한 CTO', '전설의 최 과장'],
      nights: { bySeverity: [['하룻밤을'], ['이틀 밤을', '3일 밤을'], ['일주일 내내 밤을']] },
    },
    choices: [
      {
        label: '용기를 내서 고친다',
        outcomes: [
          { chance: 0.5, text: '고쳤어요! {author} 님이 왜 그렇게 적었는지는 끝내 몰라요.', tone: 'lucky', effects: { gradeBonus: 10, stats: { coding: 2 }, counters: { refactors: 1 } } },
          { chance: 0.5, text: '왜 건드리지 말라고 했는지 알게 됐어요. {nights} 샜어요.', tone: 'unlucky', effects: { stamina: -20, stats: { coding: 3, domain: 3 }, counters: { incidents: 1 } } },
        ],
      },
      {
        label: '바깥에서 우회 코드를 덧댄다',
        outcomes: [
          { chance: 1, text: '우회 코드 위에 "이 코드도 건드리지 마시오"라고 적었어요.', effects: { stats: { domain: 1 } } },
        ],
      },
    ],
  },
  {
    id: 'predecessor_quit',
    category: '레거시',
    emoji: '📦',
    title: '전임자 퇴사, 인수인계 {days}',
    text: '{systems}(을)를 맡던 {who}(이)가 퇴사해요. 인수인계 문서라고 받은 건 {doc}뿐이에요.',
    weight: 7,
    severity: true,
    vars: {
      days: ['하루', '이틀', '사흘'],
      who: ['선배', '사수', '옆자리 과장님', '팀의 유일한 시니어'],
      systems: {
        bySeverity: [
          ['배치 하나', '관리자 화면 하나'],
          ['시스템 세 개', '서비스 두 개와 배치 전부'],
          ['결제 시스템 전체', '아무도 모르는 시스템 다섯 개'],
        ],
      },
      doc: ['노션 페이지 한 장', '5년 전 위키 링크 하나', '"코드 보면 알아요" 한 줄', '제목만 있는 빈 문서'],
    },
    conditions: { minCareerYear: 2 },
    choices: [
      {
        label: '남은 {days} 동안 질문 폭격을 한다',
        check: { communication: 35 },
        outcomes: [
          { chance: 0.8, text: '{who}(이)가 퇴사 전날까지 시달렸지만 덕분에 살았어요.', tone: 'skill', effects: { stamina: -8, stats: { domain: 5 } } },
          { chance: 0.2, text: "질문할 때마다 {who}(이)가 '그건 나도 몰라'만 반복했어요.", tone: 'unlucky', effects: { stamina: -8, stats: { domain: 2 } } },
        ],
      },
      {
        label: '코드 보면 알겠지 하고 보낸다',
        outcomes: [
          { chance: 0.3, text: '코드가 생각보다 읽기 쉬웠어요.', tone: 'lucky', effects: { stats: { domain: 3 } } },
          { chance: 0.7, text: '첫 장애 때 {who}에게 카톡했는데 읽씹당했어요.', tone: 'unlucky', effects: { stamina: -15, stats: { domain: 4 }, counters: { incidents: 1 } } },
        ],
      },
    ],
  },

  {
    id: 'onboarding_reality',
    category: '레거시',
    emoji: '🫥',
    title: '온보딩 끝, 현실 시작',
    text: '일주일 온보딩이 끝나고 레포를 열었어요. 테스트 0개, 배포는 FTP, 문서는 3년 전 위키가 전부예요. 면접 때 들은 이야기와 많이 달라요.',
    // 신입 첫 회사에서는 비교 대상이 없어서 안 나온다. 이직한 첫해에만, 자주 나온다
    weight: 40,
    conditions: { maxYearsAtCompany: 0, minJobChanges: 1 },
    choices: [
      {
        label: '개선안을 정리해서 제안한다',
        check: { communication: 45, design: 45 },
        outcomes: [
          { chance: 0.6, text: '팀장이 반가워하며 CI 도입을 맡겼어요. 새 회사에서 존재감이 생겼어요.', tone: 'skill', effects: { stats: { design: 3, reputation: 1 }, gradeBonus: 10 } },
          { chance: 0.4, text: '"원래 이렇게 해 왔어요" 한마디로 끝났어요. 들어오자마자 불평하는 사람으로 찍혔어요.', tone: 'unlucky', effects: { gradeBonus: -10, stamina: -5 } },
        ],
      },
      {
        label: '혼자서라도 CI를 붙인다',
        check: { coding: 55 },
        outcomes: [
          { chance: 0.6, text: '조용히 붙여 둔 자동 배포를 팀원들이 하나둘 쓰기 시작했어요.', tone: 'skill', effects: { stats: { coding: 2, design: 2, reputation: 2 }, counters: { refactors: 1 } } },
          { chance: 0.4, text: '내 PR만 빌드가 깨져서 "왜 혼자 다르게 하냐"는 눈총을 받았어요.', tone: 'unlucky', effects: { stamina: -10, gradeBonus: -5 } },
        ],
      },
      {
        label: '일단 적응한다',
        outcomes: [
          { chance: 1, text: '3개월이 지나니 FTP 배포도 손에 익었어요. 이게 맞나 싶지만요.', effects: { stats: { domain: 3 }, stamina: -5 } },
        ],
      },
    ],
  },

  {
    id: 'late_realization',
    category: '레거시',
    emoji: '🍻',
    title: '우리 회사만 이상했어요',
    text: '대학 동기 모임에서 다들 "CI 안 돌려?", "코드리뷰 안 해?"라고 물어요. 3년 가까이 다니면서 원래 다 이런 줄 알았어요.',
    // 신입은 첫 회사의 문제를 모르다가 2~3년차에 비교 대상을 만나 깨닫는다 (이직 후 버전은 onboarding_reality)
    weight: 12,
    once: true,
    conditions: { minCareerYear: 2, maxCareerYear: 3, maxJobChanges: 0 },
    choices: [
      {
        label: '이직 준비를 시작한다',
        outcomes: [
          { chance: 1, text: '링크드아웃 프로필을 3년 만에 업데이트했어요. 헤드헌터 연락이 오기 시작했어요.', effects: { offerBonus: 2, stats: { reputation: 1 } } },
        ],
      },
      {
        label: '우리 회사부터 바꿔본다',
        check: { communication: 45, design: 40 },
        outcomes: [
          { chance: 0.6, text: '팀에 코드리뷰를 도입했어요. 선배들도 처음엔 투덜대더니 이제는 먼저 리뷰를 요청해요.', tone: 'skill', effects: { stats: { design: 3, communication: 2, reputation: 1 }, gradeBonus: 5 } },
          { chance: 0.4, text: '"연차도 낮은 사람이 뭘 안다고"라는 말을 들었어요.', tone: 'unlucky', effects: { gradeBonus: -10, stamina: -10 } },
        ],
      },
      {
        label: '모르는 게 약이었다',
        outcomes: [
          { chance: 1, text: '동기 단톡방 알림을 껐어요. 오늘도 FTP로 배포해요.', effects: { stamina: 5, stats: { domain: 2 } } },
        ],
      },
    ],
  },

  // ─── 일정 ──────────────────────────────────────────────
  {
    id: 'spec_change_d3',
    category: '일정',
    emoji: '📅',
    title: '오픈 D-{days}, 기획 변경',
    text: '기획자가 "아주 작은 변경"이라며 {change}(을)를 바꿔 왔어요. 오픈일은 그대로예요.',
    weight: 9,
    severity: true,
    vars: {
      days: { min: 2, max: 5 },
      change: {
        bySeverity: [
          ['버튼 위치', '문구 몇 개', '메인 색상'],
          ['화면 흐름 전체', '회원가입 단계', '검색 결과 화면'],
          ['결제 방식', '서비스 컨셉', '타깃 고객'],
        ],
      },
    },
    variants: [
      {
        title: '오픈 D-{days}, 대표님의 한마디',
        text: '대표님이 시연을 보더니 "{change}만 좀 바꾸자"고 했어요. 오픈일은 그대로예요.',
      },
      {
        title: '오픈 D-{days}, 고객사 요청',
        text: '고객사 담당자가 "{change}만 수정해 주세요"라고 메일을 보냈어요. 계약서의 오픈일은 그대로예요.',
        conditions: { industries: ['si_sm', 'public'] },
      },
    ],
    choices: [
      {
        label: '밤새서 맞춘다',
        outcomes: [
          { chance: 0.7, text: '오픈은 지켰어요. 거울 속 내가 낯설어요.', effects: { stamina: -20, gradeBonus: 10 } },
          { chance: 0.3, text: '오픈 당일 버그가 터졌어요. 밤샌 보람이 없었어요.', tone: 'unlucky', effects: { stamina: -25, gradeBonus: -5, counters: { incidents: 1 } } },
        ],
      },
      {
        label: '범위를 줄이자고 협상한다',
        check: { communication: 50 },
        outcomes: [
          { chance: 0.8, text: '핵심만 넣고 나머지는 2차 오픈으로 미뤘어요.', tone: 'skill', effects: { stats: { communication: 3 }, gradeBonus: 5 } },
          { chance: 0.2, text: '임원이 "그냥 다 해"라고 했어요.', tone: 'unlucky', effects: { stamina: -15 } },
        ],
      },
    ],
  },
  {
    id: 'simple_by_tomorrow',
    category: '일정',
    emoji: '⏰',
    title: '"간단한 거니까 {when}"',
    text: '{who}(이)가 {feature} 기능을 {when} 해 달래요. 열어 보니 {needs}(이)가 다 필요해요.',
    weight: 8,
    severity: true,
    vars: {
      who: ['팀장', '기획자', '옆 팀 팀장', '대표님'],
      when: ['내일까지', '오늘 퇴근 전까지', '이번 주 안에'],
      feature: {
        bySeverity: [
          ['엑셀 다운로드', '정렬 옵션', '관리자 메모 칸'],
          ['통계 대시보드', '알림 발송', '권한 관리 화면'],
          ['정산 시스템', '추천 알고리즘', '다국어 지원'],
        ],
      },
      needs: ['권한·필터·대용량 처리', '예외 처리·로그·테스트', '외부 연동·보안 검토·데이터 이전'],
    },
    choices: [
      {
        label: '일단 된다고 한다',
        outcomes: [
          { chance: 0.5, text: '대충 만들어서 넘겼어요. 3개월 뒤 대용량에서 터졌어요.', tone: 'unlucky', effects: { stamina: -10, counters: { incidents: 1 } } },
          { chance: 0.5, text: '어떻게든 해냈어요. {who}(은)는 역시 간단했다고 생각해요.', effects: { stamina: -15, stats: { coding: 2 } } },
        ],
      },
      {
        label: '작업 범위를 쪼개서 일정을 다시 잡는다',
        check: { design: 45 },
        outcomes: [
          { chance: 0.7, text: '{who}(이)가 "이게 이렇게 큰 거였어?"라며 일주일을 줬어요.', tone: 'skill', effects: { stats: { design: 2, communication: 2 } } },
          { chance: 0.3, text: '{who}(이)가 "그래서 {when} 되냐고"라고 다시 물었어요. 밤을 샜어요.', tone: 'unlucky', effects: { stamina: -15, stats: { design: 1 } } },
        ],
      },
    ],
  },

  // ─── 사람 ──────────────────────────────────────────────
  {
    id: 'soju_shower',
    category: '사람',
    emoji: '🍶',
    title: '회식 자리 소주 세례',
    text: '2차 노래방 가기 전, 취한 동료가 갑자기 내 얼굴에 소주를 뿌렸어요. 다들 얼어붙었어요.',
    // TODO: 지인 공유 단계라 일부러 자주 나오게 둠 (한 판 약 87%). 나중에 1로 낮춰 레어 이벤트로 (기획서 13장)
    weight: 6,
    once: true,
    choices: [
      {
        label: '웃으며 넘긴다',
        outcomes: [
          { chance: 0.6, text: '"아 시원하다~" 한마디에 분위기가 풀렸어요. 다음 날 동료가 커피를 사 왔어요.', tone: 'skill', effects: { stamina: -5, stats: { communication: 3 }, achievement: 'soju_shower' } },
          { chance: 0.4, text: '웃어넘겼더니 그 동료가 회식 때마다 같은 장난을 쳐요.', tone: 'unlucky', effects: { stamina: -15, achievement: 'soju_shower' } },
        ],
      },
      {
        label: '맥주로 맞받아친다',
        outcomes: [
          { chance: 0.5, text: '테이블 전체가 물싸움판이 됐어요. 팀 회식 레전드로 남았어요.', tone: 'lucky', effects: { stats: { communication: 4, reputation: 1 }, achievement: 'soju_shower' } },
          { chance: 0.5, text: '사장님이 경찰을 불렀어요. 다음 날 인사팀 면담을 했어요.', tone: 'unlucky', effects: { gradeBonus: -15, stats: { reputation: -2 }, achievement: 'soju_shower' } },
        ],
      },
      {
        label: '다음 날 인사팀에 신고한다',
        outcomes: [
          { chance: 0.6, text: '동료가 징계를 받고 정식으로 사과했어요. 회식 문화도 조금 바뀌었어요.', tone: 'skill', effects: { stamina: 5, achievement: 'soju_shower' } },
          { chance: 0.4, text: '흐지부지 끝났고 "예민한 사람"이라는 뒷말만 남았어요.', tone: 'unlucky', effects: { stats: { communication: -2 }, gradeBonus: -5, achievement: 'soju_shower' } },
        ],
      },
      {
        label: '블라인더에 올린다',
        outcomes: [
          { chance: 0.5, text: '글이 조회수 10만을 찍고 기사까지 났어요. 회사가 공식 사과문을 냈어요.', tone: 'lucky', effects: { stats: { reputation: 3 }, achievement: 'soju_shower' } },
          { chance: 0.5, text: '세 줄 만에 회사 사람들이 글쓴이를 특정했어요. 팀 분위기가 싸해졌어요.', tone: 'unlucky', effects: { gradeBonus: -10, stamina: -10, achievement: 'soju_shower' } },
        ],
      },
    ],
  },
  {
    id: 'kkondae_pm',
    category: '사람',
    emoji: '🙄',
    title: '"{quote}"',
    text: '{who}(이)가 회의에서 기술 검토 없이 일정을 확정하고, 질문하자 이렇게 말했어요.',
    weight: 7,
    vars: {
      who: ['PM', '기획 팀장', '사업부 이사', '영업 담당'],
      quote: [
        '개발자는 코딩만 하면 되잖아요',
        '그건 개발에서 알아서 해야죠',
        '기술적인 건 모르겠고 날짜만 맞춰 주세요',
        '다른 회사는 이틀이면 한다던데요',
      ],
    },
    choices: [
      {
        label: '데이터로 반박한다',
        check: { communication: 45, domain: 40 },
        outcomes: [
          { chance: 0.7, text: '지난 프로젝트 지연 통계를 보여줬더니 {who}(이)가 조용해졌어요.', tone: 'skill', effects: { stats: { communication: 3 }, gradeBonus: 5 } },
          { chance: 0.3, text: '맞는 말이었지만 임원이 {who} 편을 들었어요.', tone: 'unlucky', effects: { gradeBonus: -5 } },
        ],
      },
      {
        label: '참고 코딩만 한다',
        outcomes: [
          { chance: 1, text: '예상대로 일정이 밀렸고, 책임은 개발팀이 졌어요.', effects: { stamina: -10, gradeBonus: -5 } },
        ],
      },
    ],
  },
  {
    id: 'genius_junior',
    category: '사람',
    emoji: '🧒',
    title: '천재 신입이 들어왔어요',
    text: '신입이 첫 주에 내 코드의 버그 다섯 개를 찾아서 PR을 올렸어요.',
    weight: 5,
    conditions: { minCareerYear: 4 },
    choices: [
      {
        label: '제대로 키워 준다',
        outcomes: [
          { chance: 1, text: '멘토링하면서 나도 많이 배웠어요. 신입은 1년 만에 팀 에이스가 됐어요.', tone: 'skill', effects: { stats: { communication: 4, design: 2 } } },
        ],
      },
      {
        label: '경쟁심에 불타 공부한다',
        outcomes: [
          { chance: 1, text: '자존심 때문에 주말마다 공부했어요. 실력은 늘었는데 피곤해요.', effects: { stamina: -12, stats: { coding: 5 } } },
        ],
      },
    ],
  },
  {
    id: 'code_review_war',
    category: '사람',
    emoji: '💬',
    title: '코드리뷰 코멘트 147개',
    text: '내 PR에 시니어가 코멘트 147개를 달았어요. 절반은 들여쓰기 취향이에요.',
    weight: 7,
    conditions: { maxCareerYear: 12 },
    choices: [
      {
        label: '하나하나 다 반영한다',
        outcomes: [
          { chance: 1, text: '다 고쳤어요. 시니어의 취향을 완벽히 외우게 됐어요.', effects: { stamina: -8, stats: { coding: 3 } } },
        ],
      },
      {
        label: '린터 규칙으로 정리하자고 제안한다',
        check: { communication: 40 },
        outcomes: [
          { chance: 0.7, text: '팀 전체에 린터가 도입됐어요. 다들 고마워해요.', tone: 'skill', effects: { stats: { design: 2, reputation: 1 }, gradeBonus: 5 } },
          { chance: 0.3, text: '시니어가 "내 리뷰가 불만이냐"며 삐졌어요.', tone: 'unlucky', effects: { gradeBonus: -5 } },
        ],
      },
    ],
  },

  // ─── 커리어 ────────────────────────────────────────────
  {
    id: 'headhunter',
    category: '커리어',
    emoji: '📞',
    title: '헤드헌터의 연락',
    text: '{channel}(으)로 헤드헌터가 연락했어요. "연봉 {raise}% 인상 가능한 포지션이 있어요."',
    weight: 6,
    vars: {
      channel: ['링크드아웃', '메일', '문자', '전화'],
      raise: { min: 20, max: 40 },
    },
    variants: [
      {
        title: '전 동료의 스카우트',
        text: '이직한 전 동료가 {channel}(으)로 연락했어요. "우리 회사 올래? 연봉 {raise}%는 더 줄 거야."',
      },
    ],
    conditions: { minCareerYear: 3 },
    choices: [
      {
        label: '이 제안을 들고 연봉 협상을 한다',
        check: { communication: 50 },
        outcomes: [
          { chance: 0.6, text: '회사가 카운터 오퍼로 연봉을 올려 줬어요.', tone: 'skill', effects: { salaryPct: 0.1 } },
          { chance: 0.4, text: '"그럼 거기 가세요"라는 답이 돌아왔어요. 분위기가 어색해요.', tone: 'unlucky', effects: { gradeBonus: -10 } },
        ],
      },
      {
        label: '정중히 거절한다',
        outcomes: [
          { chance: 1, text: '"다음에 또 연락할게요"라는 답이 왔어요.', effects: { stats: { reputation: 1 } } },
        ],
      },
    ],
  },
  {
    id: 'stock_vs_salary',
    category: '커리어',
    emoji: '📜',
    title: '스톡옵션이냐 연봉이냐',
    text: '대표가 연봉 협상 자리에서 "인상 대신 스톡옵션을 더 줄게요"라고 해요.',
    weight: 7,
    conditions: { companyTypes: [...STARTUPS] },
    choices: [
      {
        label: '스톡옵션을 받는다',
        outcomes: [
          { chance: 0.3, text: '회사 가치가 올라 스톡옵션 일부를 팔았어요.', tone: 'lucky', effects: { assets: 8000 } },
          { chance: 0.7, text: '종이 한 장을 받았어요. 언젠가는 돈이 되겠죠?', effects: {} },
        ],
      },
      {
        label: '현금이 최고다',
        outcomes: [
          { chance: 1, text: '연봉이 조금 올랐어요. 대표 표정이 조금 서운해 보여요.', effects: { salaryPct: 0.06, gradeBonus: -3 } },
        ],
      },
    ],
  },

  // ─── 회사 ──────────────────────────────────────────────
  {
    id: 'layoff_rumor',
    category: '회사',
    emoji: '😰',
    title: '구조조정 소문',
    text: '블라인더에 "다음 달 개발 조직 30% 감축"이라는 글이 올라왔어요.',
    weight: 5,
    choices: [
      {
        label: '눈에 띄는 성과를 만든다',
        outcomes: [
          { chance: 1, text: '야근하며 성과를 쌓았어요. 소문은 소문으로 끝났어요.', effects: { stamina: -15, gradeBonus: 10 } },
        ],
      },
      {
        label: '조용히 이력서를 업데이트한다',
        outcomes: [
          { chance: 1, text: '이력서를 정리하다 보니 내가 뭘 했는지 돌아보게 됐어요.', effects: { stats: { reputation: 2 }, gradeBonus: -5 } },
        ],
      },
    ],
  },
  {
    id: 'si_client_demand',
    category: '회사',
    emoji: '🤝',
    title: '갑님의 요구사항',
    text: '고객사 부장님이 "버튼 색이 마음에 안 드니 오늘 밤까지 시안 10개"를 요청했어요.',
    weight: 9,
    conditions: { industries: ['si_sm', 'public'] },
    choices: [
      {
        label: '10개 다 만든다',
        outcomes: [
          { chance: 1, text: '부장님이 결국 첫 번째 시안을 골랐어요.', effects: { stamina: -15, stats: { domain: 2 }, gradeBonus: 5 } },
        ],
      },
      {
        label: '3개만 만들고 설득한다',
        check: { communication: 45 },
        outcomes: [
          { chance: 0.6, text: '"전문가 의견이 그렇다면야" 하며 넘어갔어요.', tone: 'skill', effects: { stats: { communication: 3 } } },
          { chance: 0.4, text: '부장님이 우리 회사 대표에게 전화했어요.', tone: 'unlucky', effects: { gradeBonus: -15 } },
        ],
      },
    ],
  },
  {
    id: 'game_crunch',
    category: '회사',
    emoji: '🎮',
    title: '출시 전 크런치 모드',
    text: '출시 6주 전, 회사가 "주 6일 근무 + 야식 제공"을 공지했어요.',
    weight: 9,
    conditions: { industries: ['game'] },
    choices: [
      {
        label: '불태운다',
        outcomes: [
          { chance: 0.4, text: '게임이 대박 났어요! 성과급이 나왔어요.', tone: 'lucky', effects: { stamina: -25, assets: 3000, stats: { reputation: 3 }, gradeBonus: 10 } },
          { chance: 0.6, text: '출시는 했는데 리뷰 평점이 2.1이에요.', tone: 'unlucky', effects: { stamina: -25, stats: { coding: 3 } } },
        ],
      },
      {
        label: '정시 퇴근을 지킨다',
        outcomes: [
          { chance: 1, text: '몸은 지켰지만 "팀워크가 부족하다"는 평가를 받았어요.', effects: { gradeBonus: -15 } },
        ],
      },
    ],
  },
  {
    id: 'security_audit',
    category: '회사',
    emoji: '🔒',
    title: '금융감독원 보안 감사',
    text: '감사 기간이에요. 3년치 접근 로그와 개발 산출물을 내일까지 정리해야 해요.',
    weight: 8,
    conditions: { industries: ['fintech'] },
    choices: [
      {
        label: '꼼꼼하게 정리한다',
        outcomes: [
          { chance: 1, text: '지적 사항 0건으로 끝났어요. 아무도 축하해 주지 않았지만요.', effects: { stamina: -12, stats: { domain: 4 } } },
        ],
      },
      {
        label: '자동화 스크립트를 짠다',
        check: { coding: 55 },
        outcomes: [
          { chance: 0.8, text: '다음 감사부터는 버튼 하나로 끝나요. 팀의 영웅이 됐어요.', tone: 'skill', effects: { stats: { coding: 2, reputation: 2 }, gradeBonus: 10 } },
          { chance: 0.2, text: '스크립트가 로그 일부를 빼먹어서 지적을 받았어요.', tone: 'unlucky', effects: { gradeBonus: -10 } },
        ],
      },
    ],
  },

  // ─── 업계 ──────────────────────────────────────────────
  {
    id: 'ai_replaces_me',
    category: '업계',
    emoji: '🤖',
    title: 'AI가 내 업무를 대신해요',
    text: '회사가 {tool}(을)를 도입했어요. 내가 하던 {task}(을)를 AI가 {minutes}분 만에 끝내요.',
    weight: 8,
    vars: {
      tool: ['AI 코딩 에이전트', 'AI 페어 프로그래머', '사내 AI 개발 봇'],
      task: ['CRUD 작업', '테스트 코드 작성', 'API 문서 정리', '버그 수정'],
      minutes: { min: 5, max: 30 },
    },
    variants: [
      {
        title: '후배가 AI로 나보다 빨라요',
        text: '입사 1년 차 후배가 {tool}(으)로 내가 일주일 걸리던 {task}(을)를 {minutes}분 만에 끝냈어요.',
        conditions: { minCareerYear: 5 },
      },
      {
        title: 'AI 도입 후 팀 정원 조정',
        text: '{tool} 도입 뒤 팀 정원을 줄인다는 얘기가 돌아요. 내가 하던 {task}(은)는 이제 AI가 {minutes}분이면 해요.',
      },
    ],
    conditions: { minCalendarYear: 2028 },
    choices: [
      {
        label: 'AI를 부리는 사람이 된다',
        outcomes: [
          { chance: 1, text: 'AI에게 맡기고 나는 설계와 리뷰에 집중했어요.', tone: 'skill', effects: { stats: { design: 4, coding: -2 }, gradeBonus: 5 } },
        ],
      },
      {
        label: '손코딩의 가치를 믿는다',
        outcomes: [
          { chance: 0.3, text: 'AI가 만든 버그를 내가 잡았어요. 장인 정신이 빛났어요.', tone: 'lucky', effects: { stats: { coding: 3 } } },
          { chance: 0.7, text: '내 생산성이 팀 꼴찌가 됐어요.', tone: 'unlucky', effects: { gradeBonus: -15 } },
        ],
      },
    ],
  },
  {
    id: 'msa_hype',
    category: '업계',
    emoji: '🧱',
    title: '전사 마이크로서비스 전환',
    text: 'CTO가 컨퍼런스를 다녀오더니 모놀리스를 서비스 40개로 쪼개자고 해요.',
    weight: 6,
    conditions: { minCareerYear: 3 },
    choices: [
      {
        label: '전환 TF에 자원한다',
        outcomes: [
          { chance: 0.5, text: '성공적으로 쪼갰어요. 이력서에 쓸 줄이 생겼어요.', tone: 'lucky', effects: { stamina: -15, stats: { design: 5, reputation: 2 } } },
          { chance: 0.5, text: '분산 모놀리스가 탄생했어요. 장애가 40배가 됐어요.', tone: 'unlucky', effects: { stamina: -20, stats: { design: 4 }, counters: { incidents: 1 } } },
        ],
      },
      {
        label: '"우리 규모엔 과해요"라고 말한다',
        check: { design: 55, communication: 45 },
        outcomes: [
          { chance: 0.6, text: 'CTO가 설득됐어요. 1년 뒤 다른 회사의 실패 사례를 보며 안도했어요.', tone: 'skill', effects: { stats: { reputation: 2 }, gradeBonus: 10 } },
          { chance: 0.4, text: '"변화를 두려워하는 사람"으로 찍혔어요.', tone: 'unlucky', effects: { gradeBonus: -10 } },
        ],
      },
    ],
  },

  // ─── 개인 ──────────────────────────────────────────────
  {
    id: 'blog_viral',
    category: '개인',
    emoji: '✍️',
    title: '기술 블로그가 터졌어요',
    text: '삽질 기록을 정리한 글이 개발자 커뮤니티 메인에 올라갔어요.',
    weight: 5,
    choices: [
      {
        label: '시리즈로 연재한다',
        outcomes: [
          { chance: 1, text: '구독자가 늘고 컨퍼런스 연락도 왔어요.', tone: 'skill', effects: { stamina: -8, stats: { reputation: 5, communication: 2 } } },
        ],
      },
      {
        label: '한 번의 행운으로 남긴다',
        outcomes: [
          { chance: 1, text: '댓글 몇 개에 뿌듯해하고 끝냈어요.', effects: { stats: { reputation: 2 } } },
        ],
      },
    ],
  },
  {
    id: 'opensource_pr',
    category: '개인',
    emoji: '🐙',
    title: '유명 오픈소스에 PR',
    text: '자주 쓰던 라이브러리에서 버그를 발견했어요. 메인테이너는 무섭기로 유명해요.',
    weight: 5,
    choices: [
      {
        label: '테스트까지 붙여서 PR을 올린다',
        check: { coding: 55 },
        outcomes: [
          { chance: 0.6, text: 'PR이 머지됐어요! 컨트리뷰터 목록에 내 이름이 올라갔어요.', tone: 'skill', effects: { stats: { reputation: 5, coding: 2 } } },
          { chance: 0.4, text: '"이건 의도된 동작입니다"라는 한 줄과 함께 닫혔어요.', tone: 'unlucky', effects: { stats: { coding: 2 } } },
        ],
      },
      {
        label: '이슈만 남긴다',
        outcomes: [
          { chance: 1, text: '다른 사람이 내 이슈를 보고 고쳤어요. 이슈에 👍 32개.', effects: { stats: { reputation: 1 } } },
        ],
      },
    ],
  },
  {
    id: 'conference_talk',
    category: '개인',
    emoji: '🎤',
    title: '컨퍼런스 발표 제안',
    text: '개발자 컨퍼런스에서 30분 발표를 해 달라는 연락이 왔어요. 청중은 800명이에요.',
    weight: 5,
    conditions: { minCareerYear: 4 },
    choices: [
      {
        label: '수락한다',
        outcomes: [
          { chance: 0.7, text: '발표 영상 조회수가 2만을 넘었어요.', tone: 'skill', effects: { stamina: -10, stats: { reputation: 6, communication: 3 } } },
          { chance: 0.3, text: '긴장해서 데모가 멈췄어요. 그래도 끝까지 해냈어요.', tone: 'unlucky', effects: { stamina: -15, stats: { reputation: 2, communication: 4 } } },
        ],
      },
      {
        label: '바쁘다며 거절한다',
        outcomes: [
          { chance: 1, text: '대신 나간 동기가 업계 스타가 됐어요.', effects: {} },
        ],
      },
    ],
  },

  // ─── 생활 ──────────────────────────────────────────────
  {
    id: 'marriage',
    category: '생활',
    emoji: '💍',
    title: '결혼',
    text: '오래 만난 사람과 결혼 이야기가 나왔어요.',
    weight: 6,
    once: true,
    conditions: { minAge: 28, maxAge: 42, notFlags: ['married'] },
    choices: [
      {
        label: '결혼한다',
        outcomes: [
          { chance: 1, text: '결혼했어요! 축의금 정산은 아직 못 했어요.', effects: { assets: -3000, stamina: 10, setFlags: ['married'] } },
        ],
      },
      {
        label: '커리어가 먼저다',
        outcomes: [
          { chance: 1, text: '일에 집중하기로 했어요. 명절이 조금 길게 느껴져요.', effects: { gradeBonus: 5 } },
        ],
      },
    ],
  },
  {
    id: 'baby',
    category: '생활',
    emoji: '👶',
    title: '아기가 태어났어요',
    text: '가족이 한 명 늘었어요. 육아휴직을 쓸지 고민돼요.',
    weight: 8,
    once: true,
    conditions: { flags: ['married'], notFlags: ['hasChild'], maxAge: 45 },
    choices: [
      {
        label: '육아휴직을 쓴다',
        outcomes: [
          { chance: 1, text: '아이의 첫 걸음마를 직접 봤어요. 복귀하니 코드베이스가 낯설어요.', effects: { stamina: 25, gradeBonus: -25, setFlags: ['hasChild'], achievement: 'parental_leave' } },
        ],
      },
      {
        label: '계속 일한다',
        outcomes: [
          { chance: 1, text: '퇴근하면 육아 2교대가 시작돼요.', effects: { stamina: -20, setFlags: ['hasChild'] } },
        ],
      },
    ],
  },
  {
    id: 'mortgage',
    category: '생활',
    emoji: '🏠',
    title: '내 집 마련',
    text: '부동산 앱을 보다가 "지금 아니면 못 산다"는 생각이 들었어요.',
    weight: 5,
    once: true,
    conditions: { minAge: 32, notFlags: ['mortgage'] },
    choices: [
      {
        label: '영끌해서 산다',
        outcomes: [
          { chance: 0.5, text: '집값이 올랐어요! 대출 이자는 여전히 무서워요.', tone: 'lucky', effects: { assets: 10000, setFlags: ['mortgage'] } },
          { chance: 0.5, text: '사자마자 금리가 올랐어요. 월급의 절반이 이자예요.', tone: 'unlucky', effects: { assets: -5000, stamina: -10, setFlags: ['mortgage'] } },
        ],
      },
      {
        label: '전세로 버틴다',
        outcomes: [
          { chance: 1, text: '2년마다 이사 걱정을 하지만 마음은 가벼워요.', effects: {} },
        ],
      },
    ],
  },
  {
    id: 'parent_sick',
    category: '생활',
    emoji: '🏥',
    title: '부모님이 편찮으세요',
    text: '부모님이 입원하셨어요. 병원과 회사를 오가야 해요.',
    weight: 4,
    once: true,
    conditions: { minAge: 35 },
    choices: [
      {
        label: '휴직하고 곁을 지킨다',
        outcomes: [
          { chance: 1, text: '부모님이 회복하셨어요. 그 시간을 후회하지 않아요.', effects: { gradeBonus: -20, assets: -2000 } },
        ],
      },
      {
        label: '일과 병행한다',
        outcomes: [
          { chance: 1, text: '퇴근 후 병원으로 가는 1년을 보냈어요.', effects: { stamina: -25, assets: -2000 } },
        ],
      },
    ],
  },
]
