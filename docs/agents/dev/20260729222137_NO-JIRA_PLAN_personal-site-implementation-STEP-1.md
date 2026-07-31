---
Application: byron1st.github.io
JiraTicket: NO-JIRA
PlanType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
Step: 1
---

# Step 1: 툴체인 기반

Report: [20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-1.md](./20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-1.md)

Part of main plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation.md)

## Depends On

None. 이 단계가 프로젝트의 첫 코드다.

## Implements

FR-9의 빌드 파이프라인 부분. 나머지 FR은 여기서 세운 기반 위에 올라간다.

## 목표

`pnpm install`부터 시작해 **설정 파일 일체와 최소 실행 가능한 앱 껍데기**를 세우고, `pnpm check` → `pnpm build`가 처음으로 끝까지 통과하는 상태를 만든다. 이후 모든 단계는 이 파이프라인 위에서만 움직인다.

이 단계의 성공 판정은 "화면이 예쁘다"가 아니라 **툴체인이 서로 물려 돌아간다**는 것이다: type-checked ESLint가 설정 파일까지 파싱하고, Tailwind v4가 토큰을 인식하고, React Router가 `/`를 정적 HTML로 뱉는다.

## 범위

**설정**: `tsconfig.json`, `eslint.config.ts`, `.prettierrc.json`, `vite.config.ts`, `react-router.config.ts`, `playwright.config.ts`.

**앱 최소 골격**: `src/root.tsx`(문서 셸 — `<html>`/`<head>`/`<body>` + `Meta`/`Links`/`Scripts`/`ScrollRestoration`), `src/routes.ts`(index 라우트 하나), `src/pages/Home.tsx`(텍스트만 있는 스텁).

**스타일**: `src/styles/theme.css`(SPEC 표의 색 7개를 light/`[data-theme="dark"]` 양쪽으로 + `@theme inline` 시맨틱 토큰 등록 + `@custom-variant dark` + 폰트 스택), `src/styles/fonts.css`(self-host `@font-face`).

**타입 선언**: `*.yaml`·`*.md` 모듈 앰비언트 타입(Step 2·3이 곧바로 소비한다).

### 주의할 지점

- `eslint.config.ts`는 **구성 순서가 곧 정확성**이다: `@eslint/js` recommended → `typescript-eslint` type-checked(`projectService: true`) → `eslint-plugin-react-hooks` → `eslint-plugin-prettier/recommended`. Prettier는 반드시 마지막이다. type-checked 규칙을 쓰므로 `tsconfig`가 `scripts/`·`plugins/`·`e2e/`·설정 파일까지 포함해야 한다 — 지금 비어 있는 디렉터리라도 나중 단계에서 채워진다.
- `react-router.config.ts`는 `appDirectory: "src"`, `buildDirectory: "dist"`, `ssr: false`, `prerender: ["/"]`로 시작한다. Step 6이 이 `prerender`를 함수 형태로 확장한다.
- 폰트는 `@fontsource/public-sans`·`@fontsource/jetbrains-mono`·`pretendard` 패키지의 파일을 self-host로 참조한다. weight는 400/600만, `font-display: swap`, Pretendard는 한글 `unicode-range`로 제한. **CDN URL이 산출물에 남으면 안 된다** — SPEC의 "외부 런타임 요청 0"이 깨진다.
- Vitest 설정은 `vite.config.ts`에 함께 두되, 대상은 `src/content/`와 `src/lib/`이다(`e2e/`는 Playwright 몫).

## Non-goals

- 실제 콘텐츠·YAML·Markdown (Step 2, 3)
- 헤더·푸터·테마 토글 (Step 4). 이 단계의 `Home.tsx`는 셸이 붙기 전의 스텁이다.
- `buildEnd`·피드 생성 (Step 7), CI 워크플로 (Step 8)
- 성능 최적화·번들 분석

## Key decisions

- **Vitest 설정을 `vite.config.ts`에 통합**한다. 별도 `vitest.config.ts`를 두면 Vite plugin(특히 Step 3의 markdown plugin)을 두 곳에서 관리하게 된다.
- **`prerender`는 배열로 시작**해 Step 6에서 함수로 승격한다. 지금 함수로 만들면 아직 없는 `readPostFiles()`를 가짜로 채워야 한다.
- **`src/pages/Home.tsx` 스텁을 만든다**(라우트를 `root.tsx`에 직접 두지 않는다). SPEC의 레이어 규칙상 라우트 화면은 `pages/`에 있고, Step 5가 이 파일을 실내용으로 채운다.

## 다음 단계에 노출하는 seam

- 색 토큰 이름: `--color-bg` `--color-fg` `--color-muted` `--color-faint` `--color-line` `--color-code-bg` `--color-accent` (Tailwind 유틸리티 `bg-bg`·`text-fg`·… 로 소비된다)
- `src/routes.ts` — 라우트 트리의 유일한 정의처. Step 4가 layout으로 감싸고, Step 5·6이 자식 라우트를 추가한다.
- `src/root.tsx` — 스타일 import 지점이자 Step 4의 pre-paint 스크립트가 들어갈 자리
- `react-router.config.ts` — Step 6의 `prerender()` 확장, Step 7의 `buildEnd()` 추가 지점
- `*.yaml`·`*.md` 앰비언트 타입 선언 — Step 2·3이 의존

## Acceptance Contract

| ID | Observable condition | Evidence |
| --- | --- | --- |
| AC-1 | `pnpm build`가 `dist/client/index.html`을 생성하고, 그 HTML 안에 `Home.tsx` 스텁의 텍스트가 **JS 실행 전에 이미 들어 있다** | 생성된 `index.html`의 본문에 스텁 문자열이 존재 |
| AC-2 | 빌드 산출물의 CSS·HTML에 외부 호스트 URL(폰트 CDN 포함)이 0건이다 | `dist/client/` 전체에서 `https://` 외부 참조 검색 결과 0건 |
| AC-3 | SPEC 색 토큰 7개가 light/dark 양쪽 값으로 `theme.css`에 등록되고, `<html data-theme="dark">`로 바꾸면 실제 색이 전환된다 | `theme.css` 내용 + 브라우저에서 속성 토글 시 배경/전경색 변화 확인 |
| AC-4 | type-checked ESLint가 `eslint.config.ts`·`vite.config.ts`·`react-router.config.ts` 자신을 포함해 파싱하며 경고 0으로 통과한다 | `pnpm lint`가 설정 파일을 무시하지 않고 통과 |

## Authority Boundaries

- **Discretion**: 설정 파일 내부의 구체적 옵션값, `tsconfig` 세부 플래그, 폰트 서브셋 파일을 참조하는 방식(패키지 CSS import vs 직접 `@font-face` 작성), 스텁 페이지의 문구, Vitest include/exclude 패턴.
- **Must-ask**: 의존성 추가·제거·버전 변경(`package.json`은 이미 확정됐다 — 특히 `typescript`를 6.0.x 위로 올리거나 `react-router-dom`/`@vitejs/plugin-react`를 설치하는 것은 `AGENTS.md`가 금지), `appDirectory`/`buildDirectory`/`ssr` 값 변경, Prettier를 ESLint 밖의 별도 스텝으로 분리하는 것.
- **Stop conditions**: `@react-router/dev` 8 + Vite 8 + Tailwind v4 조합에서 peer/런타임 충돌이 발생해 설정만으로 해소되지 않을 때. TypeScript 6.0.x에서 typescript-eslint가 동작하지 않을 때. 어느 쪽이든 임의로 버전을 올리지 말고 중단한다.
- **Loop budget**: 3

## TODOs

- [x] `pnpm install`로 의존성을 설치하고 lockfile을 만든다 (AC-4)
- [x] TypeScript·ESLint·Prettier 설정을 세운다 — strict + `noUncheckedIndexedAccess`, flat config 구성 순서 고정, 설정·테스트 파일까지 타입 정보 범위에 포함 (AC-4)
- [x] Vite·React Router·Playwright 설정을 세운다 — `reactRouter()`·`tailwindcss()`·`yaml()` plugin, `appDirectory: "src"`, `buildDirectory: "dist"`, `ssr: false`, `prerender: ["/"]`, Vitest 대상은 `src/content/`·`src/lib/` (AC-1)
- [x] `src/root.tsx`·`src/routes.ts`·`src/pages/Home.tsx` 스텁으로 `/` 하나가 프리렌더되는 최소 앱을 만든다 (AC-1)
- [x] `src/styles/theme.css`에 SPEC 표의 색 7개와 `@theme inline` 시맨틱 토큰, `@custom-variant dark`, 폰트 스택을 등록한다 (AC-3)
- [x] `src/styles/fonts.css`에 Public Sans·Pretendard·JetBrains Mono를 self-host `@font-face`로 정의한다 — weight 400/600, `font-display: swap`, Pretendard는 한글 `unicode-range` 한정 (AC-2)
- [x] `*.yaml`·`*.md` 모듈 앰비언트 타입을 선언해 Step 2·3이 곧바로 import 할 수 있게 한다 (AC-4)
