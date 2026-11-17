# 커밋에서 은퇴까지 — 작업 규칙

기획의 기준 문서는 `docs/기획서.md`. 규칙·수치가 바뀌면 기획서도 같이 고친다.

## 구조 원칙
- `src/engine/`은 순수 함수만. React·DOM·localStorage를 import하지 않는다.
- 랜덤은 항상 주입받은 시드 RNG를 쓴다 (`Math.random` 금지). 같은 시드 = 같은 결과.
- 콘텐츠(이벤트, 회사, 반응 문구)는 로직과 분리해 `src/data/*.ts`에 타입이 붙은 배열로 둔다. 타입은 `src/engine/types.ts`.
- 콘텐츠를 추가·수정하면 `npm test`(데이터 무결성 검사)와 `npm run build`가 통과해야 한다.
- 화면 문구는 한국어, 해요체.
- 실존 회사·커뮤니티는 패러디 이름만 쓴다 (블라인더, OKKO, 잡행성, 네모버 등).

## 명령
- `npm run dev` 개발 서버
- `npm test` 엔진 테스트 (Vitest)
- `npm run build` 타입 체크 + 빌드
- `npm run deploy` 빌드 후 Cloudflare에 배포 (https://commit-to-retire.commit-to-retire.workers.dev)
- `npm run balance` 봇 1,800판 자동 플레이 → 직책·엔딩·연봉 분포 리포트. 수치를 바꾸면 돌려서 확인한다

## 엔진 흐름
`createGame` → (`startYear` → `chooseEventOption`* → `finishYear` → `acknowledgeYear` → 허브: `acceptOffer`/`declineOffers`/`chooseTrack`/`nextYear`/`retireNow`) 반복 → `retired`.
모든 함수는 상태를 복사해 새 상태를 돌려준다. 밸런스 규칙은 `src/engine/year.ts`·`rules.ts`, 수치는 `src/data/`.

## 화면
- 모바일 우선: `ui/`의 `Screen`(최대 폭 28rem, 하단 고정 버튼) 안에 만든다. 375px 폭에서 가로 스크롤이 생기면 안 된다.
- 화면은 `GameState.phase`로 고른다 (`App.tsx`). 상태 변경은 `store/game.ts`의 액션만 쓴다.
- 이모지는 합성 이모지(🧑‍💻 같은 ZWJ)를 쓰지 않는다. Windows 10에서 두 글자로 깨진다.
