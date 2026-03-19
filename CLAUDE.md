# CLAUDE.md

이 프로젝트는 앱인토스(Apps in Toss) WebView 미니앱입니다.

## 기술 스택
- React + TypeScript + Vite
- @apps-in-toss/web-framework (앱인토스 SDK)
- TDS (Toss Design System) - 비게임 미니앱 필수

## 주요 설정
- `granite.config.ts`: 앱인토스 앱 설정 (appName, 빌드 명령어 등)
- `vite.config.ts`: Vite 번들러 설정

## 빌드/실행 명령어
- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드 (dist/ 생성)
- `npx ait build` — .ait 파일 생성 (앱인토스 배포용)
- `npx ait deploy --api-key {KEY}` — 앱인토스 배포

## MCP 도구
이 프로젝트에는 `apps-in-toss` MCP 서버(ax)가 연결되어 있습니다.
앱인토스 관련 문서 검색, TDS 컴포넌트 조회, 예제 코드 참고에 활용하세요.
