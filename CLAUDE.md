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
