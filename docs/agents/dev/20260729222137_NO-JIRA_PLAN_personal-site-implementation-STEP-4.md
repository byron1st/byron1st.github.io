---
Application: byron1st.github.io
JiraTicket: NO-JIRA
PlanType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
Step: 4
---

# Step 4: 전역 셸 + 테마

Part of main plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation.md)

Report: [20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-4.md](./20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-4.md)

## Depends On

Step 1 (툴체인·토큰·`root.tsx`·`routes.ts`), Step 2 (`profile` 상수와 `socials[].kind` 유니온).

## Implements

FR-0 (전역 셸), FR-1 (테마).

## 목표

모든 라우트를 감싸는 헤더·콘텐츠 컬럼·푸터를 만들고, 첫 페인트 전에 테마가 확정되는(FOUC 없는) 라이트/다크 전환을 완성한다. 이 단계가 끝나면 Step 1의 스텁 페이지가 완성된 셸 안에 들어가 있다.

## 범위

`src/components/` — `Layout`(Header + `<Outlet/>` + Footer), `Header`, `Footer`, `ThemeToggle`, `SocialLinks`, `icons/`(GitHub · X · LinkedIn · Mail · Sun · Moon).

`src/hooks/useTheme.ts` — `data-theme` 읽기/쓰기 + `localStorage` 동기화.

`src/root.tsx` — `<head>`에 pre-paint 인라인 스크립트 추가.

`src/routes.ts` — index 라우트를 `layout()`으로 감싸고 라우트 이동 시 스크롤을 맨 위로 되돌린다.

### 치수와 상태 (SPEC FR-0의 값을 그대로)

- 콘텐츠 컬럼: `max-w-2xl mx-auto pt-11 px-7 pb-30`
- 헤더: `flex justify-between items-baseline gap-6 pb-3.5 border-b border-line`. 좌측은 이름(`font-semibold tracking-tight`, `/` 링크) + 네비 `about`/`projects`/`posts`(`text-sm text-muted gap-3.5`), 우측은 테마 토글 하나(`text-faint hover:text-fg`).
- **네비 링크의 보더는 항상 존재하고 색만 바뀐다** — rest에서 `border-b border-transparent`, hover에서 `text-fg border-line`. 그래야 hover 시 텍스트가 밀리지 않는다.
- 푸터: `pt-20 mt-15 border-t border-line flex justify-between text-xs text-faint`. 좌측 `© {빌드 연도} {profile.name}`, 우측 소셜 아이콘(`gap-3.5`, `size-4`, `text-faint hover:text-fg`).
- **언어 토글과 그 옆의 구분선은 만들지 않는다.** 버튼이 하나뿐이라 구분선도 함께 사라진다.

### 테마 결정 순서와 함정

초기 결정: `localStorage["theme"]` → 없으면 `prefers-color-scheme` → 없으면 `light`. 이 결정을 **`root.tsx`의 `<head>`에 인라인 스크립트로** 넣어 첫 페인트 전에 끝낸다(framework mode에는 `index.html`이 없으므로 `dangerouslySetInnerHTML`로 삽입). 번들에 의존하면 화면이 번쩍인다.

- `localStorage` 접근이 차단된 환경(사파리 프라이빗 등)에서 스크립트가 throw하면 안 된다 — `try/catch`로 감싸고 실패 시 `prefers-color-scheme`로 진행한다.
- 프리렌더 시점에는 `document`가 없다. `useTheme`은 `typeof document === "undefined"` 가드를 두고 SSG에서 `light`를 반환한다.
- **해/달 아이콘 전환은 `dark:` 유틸리티로만** 한다(`block dark:hidden` / `hidden dark:block`). JS 상태로 분기하면 프리렌더 HTML과 hydration 결과가 어긋난다. 이 프로젝트에서 `dark:`가 정당하게 등장하는 거의 유일한 지점이다.

## Non-goals

- 각 페이지의 내용 (Step 5, 6). `Home.tsx`는 여전히 스텁이다.
- 라우트별 `meta`/SEO (Step 7)
- 반응형 세부 조정 — 단일 중앙 컬럼은 이미 좁은 화면에서 동작한다. 그리드 붕괴가 필요한 것은 Step 5·6의 stack/연도 그리드다.
- 페이지 전환 애니메이션 (금지)

## Key decisions

- **`Layout`만 `content/`를 import 한다.** SPEC의 레이어 규칙상 `components/`는 props만 받는 순수 프레젠테이션이지만, 셸이 `profile`을 알아야 헤더 이름과 푸터 소셜을 그릴 수 있다. 이 예외는 SPEC에 명시돼 있으며 다른 컴포넌트로 번지면 안 된다.
- **아이콘은 컴포넌트로 인라인**한다(스프라이트·아이콘 폰트·CDN 아님). 외부 요청 0 원칙과, `currentColor`로 hover 색을 물려받게 하기 위함이다.
- **`SocialLinks`는 `socials` 배열을 순회하며 `kind` → 아이콘을 매핑**한다. 없는 소셜은 항목이 없어서 자연스럽게 빠진다 — 조건부 렌더 분기를 만들지 않는다. `kind` 유니온은 exhaustive하게 다뤄, 새 `kind`가 스키마에 추가되면 타입 에러가 나게 한다.
- **푸터의 연도는 빌드 시각 기준**이다. 정적 사이트라 런타임 `new Date()`는 프리렌더 시점 값으로 굳는데, 그것이 의도한 동작이다.

## 다음 단계에 노출하는 seam

- `src/routes.ts`의 layout 중첩 구조 — Step 5·6이 이 layout의 자식으로 `/about`·`/projects`·`/posts`·`/posts/:slug`를 추가한다
- `useTheme`의 반환 형태 (`ThemeToggle` 외에는 소비자가 없을 예정)
- `Layout`이 `content/`를 import 하는 유일한 컴포넌트라는 예외 규칙
- 아이콘 컴포넌트 이름과 `size-*` 지정 방식 — Step 5의 홈 소셜 행이 같은 아이콘을 다른 크기로 쓴다

## Acceptance Contract

| ID | Observable condition | Evidence |
| --- | --- | --- |
| AC-1 | 프리렌더된 `/`의 HTML에 헤더(이름·네비 3개)·푸터(저작권·소셜 아이콘)가 **JS 실행 전에** 들어 있다 | `dist/client/index.html` 내용 |
| AC-2 | 첫 페인트 전에 `<html data-theme>`가 설정되어 다크 선호 환경에서 라이트 화면이 번쩍이지 않는다 | `<head>` 인라인 스크립트의 위치와 브라우저 확인 |
| AC-3 | `localStorage`가 차단된 환경에서도 스크립트가 throw하지 않고 `prefers-color-scheme`로 테마가 결정된다 | localStorage 차단 상태에서 콘솔 에러 없이 동작 |
| AC-4 | 토글 → 새로고침 후에도 선택한 테마가 유지된다 | 브라우저에서 토글 후 리로드 확인 |
| AC-5 | 하이드레이션 불일치 경고가 콘솔에 0건이다 (특히 해/달 아이콘) | 개발/프리뷰 실행 시 콘솔 |
| AC-6 | 헤더 네비 hover 시 텍스트 위치가 밀리지 않는다 (보더가 항상 존재) | hover 전후 레이아웃 비교 |
| AC-7 | 언어 토글 버튼과 헤더 우측 구분선이 존재하지 않는다 | 렌더된 헤더 |

## Authority Boundaries

- **Discretion**: 컴포넌트 파일 분리 방식, 아이콘 SVG path 소스(Feather/Lucide 계열 동일 두께면 자유), `useTheme` 내부 구현, 인라인 스크립트의 코드 형태, `aria-label` 문구, 스크롤 복원 구현 방식.
- **Must-ask**: 언어 토글이나 구분선을 추가하는 것, 테마 전환에 트랜지션을 넣는 것, `dark:` 접두사를 색상 유틸리티에 쓰는 것, `Layout` 외의 컴포넌트가 `content/`를 import 하는 것, 아이콘을 외부에서 로드하는 것.
- **Stop conditions**: pre-paint 스크립트와 hydration이 충돌해 경고를 없앨 수 없을 때. 임의로 `suppressHydrationWarning`을 발라 덮지 말고 중단한다.
- **Loop budget**: 3

## TODOs

- [x] 아이콘 컴포넌트(GitHub·X·LinkedIn·Mail·Sun·Moon)를 인라인 SVG로 만든다 — `currentColor` 사용 (AC-1)
- [x] `Header`를 구현한다 — 이름 링크 + 네비 3개(보더 항상 존재, 색만 전환) + 테마 토글. 언어 토글·구분선 없음 (AC-6, AC-7)
- [x] `Footer`와 `SocialLinks`를 구현한다 — `socials` 배열 순회, `kind` exhaustive 매핑, `aria-label` 부여 (AC-1)
- [x] `Layout`으로 헤더·`<Outlet/>`·푸터를 감싸고 콘텐츠 컬럼 치수를 적용한다. `routes.ts`를 layout 중첩 구조로 바꾸고 스크롤 최상단 복원을 건다 (AC-1)
- [x] `root.tsx`의 `<head>`에 pre-paint 테마 스크립트를 인라인한다 — `localStorage` → `prefers-color-scheme` → `light`, `try/catch` (AC-2, AC-3)
- [x] `useTheme`과 `ThemeToggle`을 구현한다 — SSG 가드, 토글 시 `data-theme` 갱신 + `localStorage` 저장, 아이콘 전환은 `dark:` 유틸리티로만 (AC-4, AC-5)
