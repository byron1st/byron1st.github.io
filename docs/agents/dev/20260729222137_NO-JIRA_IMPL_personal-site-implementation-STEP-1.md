---
Application: byron1st.github.io
JiraTicket: NO-JIRA
ReportType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
ReviewBase: git diff 9daab18168e4deb8d807049507fbcc24dc28a75b
---

# Step 1: 툴체인 기반

Plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-1.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-1.md)

## Summary

Step 1의 목표는 화면이 아니라 툴체인이 서로 물려 돌아가는 최소 실행 가능 껍데기를 세우는 것이다. TypeScript strict · type-checked ESLint · Prettier · Vite 8 · React Router 8 (`ssr: false`, `prerender: ["/"]`) · Tailwind v4 토큰 · self-host 폰트 · 앰비언트 모듈 타입을 한 파이프라인으로 묶었고, `pnpm check` / `pnpm test` / `pnpm build`가 통과하며 `/`가 정적 HTML로 프리렌더된다. Convention gate: `references/ts-nextjs-convention.md` 전체 읽음; 저장소 규칙은 `AGENTS.md`가 우선(unit test 범위·의존성 금지 등).

## TODO Fulfillment
See the change: `git diff 9daab18168e4deb8d807049507fbcc24dc28a75b`. Every `path:line` anchor in this report is valid against that snapshot.

### TODO 1: `pnpm install`로 의존성을 설치하고 lockfile을 만든다 - done
- 구현: `package.json:1` / `pnpm-lock.yaml` — 확정된 의존성 설치, lockfile 생성. `isbot` peer를 `package.json:26`에 추가(react-router 런타임 peer).
- 테스트: none (설치·설정 TODO; 실행 가능한 동작 스펙 없음)
- AC: AC-4 — `pnpm check` 통과(type-checked ESLint + typecheck)
- 편차: `isbot` 명시 추가 — 플랜 must-ask(버전/패키지 임의 변경) 밖; react-router peer로 런타임에 필요해 최소 추가. 버전 상향 없음.

### TODO 2: TypeScript·ESLint·Prettier 설정을 세운다 - done
- 구현: `tsconfig.json:14-30` `compilerOptions` — `strict` + `noUncheckedIndexedAccess`, `include: ["**/*"]`로 설정·스크립트 범위 포함. `eslint.config.ts:7-30` — recommended → type-checked(`projectService: true`) → react-hooks → prettier 순서 고정. `.prettierrc.json:1` 포맷 규칙. `env.d.ts:1` Vite client + `import.meta.dirname`.
- 테스트: none (설정; `pnpm lint` / `pnpm typecheck`가 게이트)
- AC: AC-4 — `pnpm lint`가 `eslint.config.ts`·`vite.config.ts`·`react-router.config.ts`를 파싱·통과(경고 0)
- 편차: none

### TODO 3: Vite·React Router·Playwright 설정을 세운다 - done
- 구현: `vite.config.ts:6-12` — `tailwindcss()`·`reactRouter()`·`yaml()` + Vitest include `src/content/**`·`src/lib/**`. `react-router.config.ts:3-7` — `appDirectory: "src"`, `buildDirectory: "dist"`, `ssr: false`, `prerender: ["/"]`. `playwright.config.ts:9-25` — e2e dir + preview webServer.
- 테스트: none (설정; `pnpm build`가 프리렌더 게이트)
- AC: AC-1 — `pnpm build` → `dist/client/index.html` 생성
- 편차: `playwright.config.ts:3-7`에서 `@types/node` 없이 `globalThis.process`로 CI 플래그 읽음(ponytail 주석) — 의존성 추가 회피.

### TODO 4: `src/root.tsx`·`src/routes.ts`·`src/pages/Home.tsx` 스텁으로 `/` 프리렌더 - done
- 구현: `src/root.tsx:6-25` 문서 셸(`Layout` + `Outlet`). `src/routes.ts:4` `index("pages/Home.tsx")`. `src/pages/Home.tsx:1-3` 스텁 텍스트.
- 테스트: none (프레젠테이션 스텁; AGENTS.md가 컴포넌트 unit test 금지, e2e는 Step 이후)
- AC: AC-1 — `dist/client/index.html` body에 `Hwi Ahn — personal site shell`이 JS 실행 전 존재
- 편차: none

### TODO 5: `theme.css`에 SPEC 색 7개·`@theme inline`·`@custom-variant dark`·폰트 스택 - done
- 구현: `src/styles/theme.css:4` `@custom-variant dark`. `src/styles/theme.css:6-24` light/dark 7색(`--site-*`). `src/styles/theme.css:26-37` `@theme inline` 시맨틱 토큰 + sans/mono 스택. `body`가 `var(--color-bg)`/`var(--color-fg)` 소비.
- 테스트: none (CSS 토큰 등록; 정적 내용이 스펙)
- AC: AC-3 — 7토큰 light/dark 양방향 등록 확인. 브라우저 토글은 Manual Verification 항목으로 남김(이 단계에 토글 UI 없음 — Non-goals).
- 편차: 중간 변수 `--site-*`를 두고 `@theme inline`에서 `--color-*`로 매핑 — Tailwind 유틸 `bg-bg`/`text-fg`와 `data-theme` 전환을 동시에 만족하기 위함.

### TODO 6: `fonts.css` self-host `@font-face` (400/600, swap, Pretendard 한글 range) - done
- Risk / Lens: high / line-by-line — 외부 런타임 요청 0 제약의 핵심 경로
- 구현: `src/styles/fonts.css:2-7` Public Sans·JetBrains Mono는 `@fontsource` latin 400/600 CSS import. `src/styles/fonts.css:14-33` Pretendard 400/600 `@font-face`, `font-display: swap`, Hangul `unicode-range`. 경로를 `../../node_modules/pretendard/...`로 두어 Vite가 woff2를 `dist/client/assets/`로 해시 번들.
- 테스트: none (정적 에셋 경로; 빌드 산출물 검색이 게이트)
- AC: AC-2 — 빌드 후 CSS font `url()` 전부 `/assets/*.{woff2,woff}`; HTML에 외부 URL 0; CSS의 유일한 `https://`는 Tailwind MIT 주석 `https://tailwindcss.com`(허용). 미해결 `pretendard/dist` 경로 0. 산출 파일: `Pretendard-Regular.subset-*.woff2`, `Pretendard-SemiBold.subset-*.woff2`.
- 편차: bare package `url("pretendard/...")`는 lightningcss/Tailwind가 상대경로로 취급해 빌드 시 resolve 실패 → `node_modules` 상대경로로 수정(Authority Boundaries Discretion 범위).

### TODO 7: `*.yaml`·`*.md` 모듈 앰비언트 타입 선언 - done
- 구현: `src/content-modules.d.ts:1-18` — `*.yaml`/`*.yml` default `unknown`, `*.md` `{ meta, html }` export.
- 테스트: none (타입 선언; `pnpm typecheck` 게이트)
- AC: AC-4 — typecheck 통과; Step 2·3이 import 가능한 시그니처 노출
- 편차: none

## Red Flags
- **RF1** `package.json:26` - 새 런타임 의존성 `isbot`: react-router peer. 버전 핀은 `^5`(기존 패키지 스타일과 동일). 플랜 본문에 명시되지 않았으나 peer로 필요.
- **RF2** `src/styles/fonts.css:19` - `node_modules` 상대 `url()`: 패키지 내부 경로 변경에 취약. pretentard 업데이트 시 경로 재확인 필요.

## Open Questions
- **OQ1** `src/styles/theme.css:6-24` - AC-3의 "브라우저에서 속성 토글 시 배경/전경색 변화"는 이 단계에 토글 UI가 없어 수동 확인만 가능. `data-theme` 전환 시 CSS 변수 재바인딩은 파일상 성립; 실제 페인트 확인은 Manual Verification.

## Plan Divergence
### Changed - details that differ from the plan
- Pretendard `url()` 경로: bare package path → `../../node_modules/pretendard/...` (lightningcss resolve 한계 우회; 산출물은 self-host 해시 에셋)
### Added - implemented but absent from the plan
- `isbot` dependency: react-router peer — **RF1**
- `env.d.ts` `import.meta.dirname` 보강: ESLint `tsconfigRootDir`용
- `playwright.config.ts` `globalThis.process` ponytail: `@types/node` 미설치 유지
### Deferred - planned but not implemented (deferred)
- None

## Key Decisions
- Vitest를 `vite.config.ts`에 통합(플랜 Key decision 준수). 별도 vitest config 없음.
- Pretendard는 패키지 CSS 전체 import 대신 커스텀 `@font-face` + Hangul `unicode-range` — Latin이 Public Sans로 폴백(SPEC 요구).

## Manual Verification
- [ ] `pnpm preview` 후 DevTools에서 `<html data-theme="dark">`로 바꾸면 배경/전경이 dark 토큰으로 바뀌는지 확인 (AC-3 브라우저 토글)
- [ ] Network 패널에서 폰트 요청이 same-origin `/assets/*.woff2`만인지 확인 (AC-2 런타임)

## Coverage
Not measured (설정·셸 단계; unit test 대상 로직 없음).
