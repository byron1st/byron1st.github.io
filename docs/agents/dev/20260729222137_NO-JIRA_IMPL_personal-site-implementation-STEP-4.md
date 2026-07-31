---
Application: byron1st.github.io
JiraTicket: NO-JIRA
ReportType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
ReviewBase: git diff 08e57a2752e4cc8f327cbd8b7fb8801fc636d8c5
---

# Step 4: 전역 셸 + 테마

Plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-4.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-4.md)

## Summary

Step 4의 목표는 모든 라우트를 감싸는 헤더·콘텐츠 컬럼·푸터 셸과, 첫 페인트 전에 테마가 확정되는 FOUC 없는 light/dark 전환을 완성하는 것이다. 인라인 SVG 아이콘, `Layout`/`Header`/`Footer`/`ThemeToggle`/`SocialLinks`, `useTheme`, `root.tsx` pre-paint 스크립트, `routes.ts` layout 중첩을 추가했고 Step 1 스텁 홈이 완성된 셸 안에 들어간다. Convention gate: `references/ts-nextjs-convention.md` 전체 읽음; 저장소 규칙은 `AGENTS.md` 우선(unit test는 `src/content/`·`src/lib/`만, presentational 컴포넌트 단위 테스트 금지, `Layout`만 content import, `dark:`는 아이콘 표시만, 언어 토글·트랜지션·`suppressHydrationWarning` 금지).

## TODO Fulfillment
See the change: `git diff 08e57a2752e4cc8f327cbd8b7fb8801fc636d8c5`. Every `path:line` anchor in this report is valid against that snapshot.

### TODO 1: 아이콘 컴포넌트(GitHub·X·LinkedIn·Mail·Sun·Moon) — done
- 구현: `src/components/icons/{GitHub,X,LinkedIn,Mail,Sun,Moon}.tsx` — 인라인 SVG, `currentColor`, `className`으로 `size-*` 위임(Step 5 홈 소셜 seam).
- 테스트: none (순수 presentational; AGENTS.md 금지). AC-1은 prerender HTML·e2e no-JS로 고정.
- AC: AC-1 — `dist/client/index.html`에 github/email SVG path 포함; moon/sun 양쪽 렌더
- 편차: none

### TODO 2: `Header` — done
- 구현: `src/components/Header.tsx:15` `Header` — 이름 `/` 링크, 네비 3개(`border-b border-transparent` / hover `text-fg border-line`), 우측 `ThemeToggle`만. 언어 토글·구분선 없음.
- 테스트: `e2e/smoke.spec.ts:39` header has only the theme toggle button; `:8` shell prerendered without JS
- AC: AC-6, AC-7 — HTML에 `border-transparent`+`hover:border-line`; header button count 1
- 편차: 이름·네비 묶음 gap은 핸드오프 18px → `gap-4.5` (플랜 미기재 세부)

### TODO 3: `Footer`와 `SocialLinks` — done
- 구현: `src/components/Footer.tsx:11` / `src/components/SocialLinks.tsx:14` `ICONS` `Record<SocialKind, …>` exhaustive 매핑, `aria-label={kind}`, email 제외 `target="_blank" rel="noreferrer"`.
- 테스트: `e2e/smoke.spec.ts:8` no-JS에서 copyright·github·email 링크 가시
- AC: AC-1 — 푸터 `© 2026 Hwi Ahn` + 프로필 socials(github, email) 프리렌더
- 편차: `SocialLinks`/`Footer`는 `import type`으로 schema 타입만 참조(런타임 content import는 `Layout`만)

### TODO 4: `Layout` + `routes.ts` layout 중첩 — done
- 구현: `src/components/Layout.tsx:8` — `profile` import(유일한 content 예외), `max-w-2xl mx-auto pt-11 px-7 pb-30`, Header + `<main><Outlet/></main>` + Footer. `src/routes.ts:4` `layout("components/Layout.tsx", [index(...)])`. 스크롤은 `root.tsx`의 기존 `ScrollRestoration`.
- 테스트: `e2e/smoke.spec.ts:8` 셸 프리렌더; `pnpm build` → `dist/client/index.html`
- AC: AC-1
- 편차: none

### TODO 5: `root.tsx` pre-paint 테마 스크립트 — done
- 구현: `src/root.tsx:7` `THEME_BOOT` — `localStorage` → `prefers-color-scheme` → `light`, 이중 `try/catch`. `<html>`에 `data-theme` React 속성을 두지 않아 pre-paint 스크립트와 hydration이 싸우지 않음(`suppressHydrationWarning` 미사용).
- 테스트: 빌드 HTML head 스크립트 문자열 확인; 브라우저에서 localStorage 차단 + dark 선호 시 `data-theme=dark`·pageerror 0
- AC: AC-2, AC-3
- 편차: 순수 결정식은 `src/lib/theme.ts` `resolveTheme`로 단위 테스트 가능 형태로 분리(인라인 스크립트는 import 불가해 동일 규칙을 문자열로 유지)

### TODO 6: `useTheme`과 `ThemeToggle` — done
- 구현: `src/hooks/useTheme.ts:21` — SSG `typeof document === "undefined"` → `light`; 토글 시 attribute + `localStorage`(try/catch). `src/components/ThemeToggle.tsx:5` — 아이콘은 `block dark:hidden` / `hidden dark:block`만.
- 테스트: `src/lib/theme.test.ts` resolve 순서 3케이스; `e2e/smoke.spec.ts:25` 토글→리로드 유지; 브라우저 light/dark 선호에서 hydration console 0
- AC: AC-4, AC-5
- 편차: `aria-label` 고정 `"Toggle theme"` — 상태 의존 라벨이 hydration 불일치를 만들지 않게

## Red Flags
- **RF1** `src/root.tsx:7-8` / 빌드 HTML — pre-paint 스크립트 결정 로직이 `resolveTheme`와 문자열로 이중 존재. 규칙 변경 시 둘 다 고쳐야 함.
- **RF2** `src/components/SocialLinks.tsx:3` / `Footer.tsx:1` — `import type`으로 `content/schema` 참조. 런타임 의존은 없으나 레이어 경계를 타입 경로로 느슨히 연결함.

## Open Questions
- **OQ1** `dist/client/index.html` head 순서 — 빌드 산출물에서 modulepreload가 테마 스크립트보다 앞에 온다. 스크립트는 여전히 CSS 링크 앞이라 FOUC 방지 의은 충족; RR/Vite가 head 자식을 재배치하는지는 후속 관찰 여지.

## Plan Divergence
### Changed - details that differ from the plan
- 테마 결정 순수 함수를 `src/lib/theme.ts`로 추출해 unit test (플랜은 `useTheme` 위치만 명시; 인라인 스크립트는 계속 self-contained)
### Added - implemented but absent from the plan
- `src/lib/theme.ts` + `theme.test.ts` — AC 결정 순서의 실행 가능 스펙
- e2e 확장: no-JS 셸, 테마 지속, header 버튼 1개 (AC-1/4/7)
### Deferred - planned but not implemented (deferred)
- None

## Key Decisions
- `<html data-theme>`를 React props로 두지 않음 — pre-paint 스크립트·`useTheme`만 DOM attribute를 소유해 hydration 경고를 `suppressHydrationWarning` 없이 제거
- 아이콘 표시는 JS 상태 분기 금지, `dark:` 유틸만 (플랜 강제)

## Manual Verification
- [x] `dist/client/index.html`에 헤더(이름·네비 3)·푸터(©·소셜) JS 없이 존재 (AC-1)
- [x] head 인라인 스크립트가 localStorage→prefers→light (AC-2)
- [x] localStorage 차단 + dark 선호 → `data-theme=dark`, pageerror 없음 (AC-3)
- [x] e2e 토글 후 리로드 유지 (AC-4)
- [x] light/dark 선호 로드 시 hydration console 0 (AC-5)
- [x] 네비 클래스에 rest/hover border 공존 (AC-6)
- [x] 언어 토글·구분선 없음, header button 1 (AC-7)
