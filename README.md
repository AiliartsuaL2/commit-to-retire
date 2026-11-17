# 커밋에서 은퇴까지

신입 첫 출근부터 은퇴까지, 한국 개발자의 커리어를 1년 단위로 살아보는 풍자 육성 게임.
서버 없이 브라우저에서 동작합니다.

- 기획서: [docs/기획서.md](docs/기획서.md)

## 실행

```bash
npm install
npm run dev
```

## 스택

Vite · React · TypeScript · Zustand · Tailwind CSS · Vitest

## 구조

```
src/
  engine/   게임 규칙 (순수 TS 함수, UI 의존 없음)
  data/     회사·이벤트·반응 템플릿 (JSON)
  store/    Zustand 상태 + localStorage 저장
  screens/  화면 컴포넌트
docs/       기획 문서
```
