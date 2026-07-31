---
Application: byron1st.github.io
JiraTicket: NO-JIRA
PlanType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
Step: 6
---

# Step 6: Projects + Posts + PostDetail

Report: [20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-6.md](./20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-6.md)

Part of main plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation.md)

## Depends On

Step 3 (`posts`·`groupPostsByYear`·`loadPostBody`·`readPostFiles`), Step 4 (`Layout`·`routes.ts` 중첩 구조). Step 5의 공용 컴포넌트(`SectionLabel`·`TitleMetaRow`)를 쓰므로, 병렬 실행 시 Step 5를 먼저 끝내거나 필요한 컴포넌트를 조율해야 한다.

## Implements

FR-4 (Projects), FR-5 (Posts 인덱스), FR-6 (Post 상세 + 프리렌더).

## 목표

남은 세 화면을 구현하고, **`prerender()`를 확장해 draft가 아닌 모든 포스트가 각자의 정적 HTML로 생성**되게 한다. 이 단계가 끝나면 SSG의 핵심 약속 — `/posts/{slug}` 직접 접속 시 본문이 이미 들어 있는 HTML이 응답된다 — 이 성립한다.

## 범위

### `pages/Projects.tsx` (FR-4)

래퍼 `pt-14 flex flex-col gap-7.5`, 헤더 블록 `gap-3.5`, 인트로 `text-base text-muted max-w-lg`.

각 행 `py-5 border-t border-line flex flex-col gap-1.5` — **상단 보더만.** 마지막 항목 아래에 선이 생기면 안 된다. 프로젝트명은 `link`로 가는 외부 링크(`font-semibold`, rest에 밑줄 없음, hover `text-accent`), 연도 `text-xs text-faint whitespace-nowrap`, 설명 `text-sm text-muted max-w-lg`, 기술 칩 `flex flex-wrap gap-2 pt-1` + 각 칩 `text-xs text-faint border border-line rounded-xs px-1.5 py-px`.

- `tech`가 빈 배열이면 칩 컨테이너를 렌더하지 않는다.
- `link`가 없는 프로젝트는 링크가 아닌 `<span>`으로 렌더한다.

### `pages/Posts.tsx` (FR-5)

래퍼 `pt-14 flex flex-col gap-11`. 그룹 = `grid grid-cols-[4rem_1fr] gap-5 items-start`(좌: 연도 `text-xs text-faint pt-0.5`, 우: 포스트 행들 `flex flex-col gap-2`). 각 행은 `TitleMetaRow` 형태의 `<Link>`로, **행 전체가 클릭 영역**이고 hover 시 제목이 `text-accent`가 된다. 제목 `text-base text-fg`, 날짜 `text-xs text-faint whitespace-nowrap`(`Jun 14`).

요약·태그를 표시하지 않는다. 포스트가 0개면 그룹을 렌더하지 않는다(빈 상태 문구도 없다 — 섹션 라벨만 남는다).

### `pages/PostDetail.tsx` (FR-6)

래퍼 `pt-14 flex flex-col gap-7`. 뒤로 링크 `← back to posts`(`text-xs text-faint hover:text-fg`), 제목 `<h1> text-2xl font-semibold tracking-tight max-w-md`, 날짜 `text-xs text-faint` ISO 포맷(`2026-04-02`), 본문 컨테이너 `.post-body max-w-prose`. **태그를 표시하지 않는다.**

본문은 라우트 `loader`가 `loadPostBody(slug)`로 lazy chunk를 가져온다. `ssr: false` + `prerender` 조합에서 **prerender 경로에 매칭되는 라우트는 `loader`를 쓸 수 있음이 공식 문서로 확인**됐고, 프리렌더 시 loader 결과는 `.data` 파일로 직렬화된다. `action`·`headers` export는 어느 라우트에도 두지 않는다.

### `components/PostBody.tsx` + `src/styles/post-body.css`

`PostBody`가 HTML 문자열을 `dangerouslySetInnerHTML`로 렌더하고, 스타일은 `.post-body` 스코프 CSS가 담당한다. **이 파일은 매직 넘버 없이 테마 변수만 참조**한다(`var(--spacing)`·`var(--text-base)`·`var(--color-code-bg)`·`var(--leading-relaxed)` 등). SPEC FR-7에 규칙 초안이 있다. 마크다운 산출 HTML에는 className을 붙일 수 없으므로 이 스코프 CSS가 프로젝트 유일의 컴포넌트 밖 스타일이며, 다른 곳으로 번지면 안 된다.

### `react-router.config.ts` — `prerender()` 확장

배열에서 함수로 승격한다: `getStaticPaths()`(정적 라우트 전부) + `readPostFiles()`의 draft 아닌 slug로 만든 `/posts/{slug}` 경로. **정적 라우트를 손으로 나열하지 않는다** — 그래야 나중에 페이지를 추가할 때 프리렌더 목록을 건드릴 필요가 없다(SPEC의 확장 비용 기준).

## Non-goals

- SEO `meta`·RSS·sitemap (Step 7)
- E2E (Step 8)
- 커스텀 404 — 존재하지 않는 포스트 경로는 프리렌더되지 않으므로 GitHub Pages 기본 404가 처리한다
- 신택스 하이라이팅, 태그·요약 표시, 페이지네이션
- 포스트 본문 HTML sanitize (저자 본인이 쓰는 신뢰 경계 안)

## Key decisions

- **본문은 라우트 `loader`로 가져온다.** 컴포넌트에서 직접 lazy import 하지 않는 이유는, loader 결과가 프리렌더 시 `.data`로 직렬화되어 클라이언트 내비게이션에서도 본문이 재활용되기 때문이다. 인덱스 페이지 번들에 본문이 들어가지 않는다는 성능 전제도 이 분리에서 나온다.
- **`prerender()`는 `readPostFiles()`(Node 어댑터)를 쓴다.** `src/content/posts.ts`는 `import.meta.glob` 때문에 config 파일에서 import 할 수 없다 (메인 플랜의 핵심 구조 결정 참조).
- **`.post-body` 스코프 CSS를 택하고 hast→React 매핑 대안은 반려**한다(SPEC Open Question 4의 결정). 대안은 스타일을 100% 컴포넌트로 통일하지만 코드가 ~50줄 늘어난다.
- **프로젝트 행은 상단 보더만** 쓴다. 하단 보더 + `last:border-0` 조합보다 규칙이 단순하고, 마지막 항목 아래 선이 생기는 실수가 구조적으로 불가능하다.

## 다음 단계에 노출하는 seam

- 확장된 `prerender()`가 반환하는 **경로 집합** = Step 7의 sitemap 소스. 두 산출물이 같은 함수에서 나와야 누락이 구조적으로 불가능해진다.
- `pages/Projects.tsx`·`Posts.tsx`·`PostDetail.tsx` 라우트 모듈 — Step 7이 `meta` export를 붙인다. PostDetail의 `meta`는 loader 데이터(포스트 제목·요약)를 참조한다.

## Acceptance Contract

| ID | Observable condition | Evidence |
| --- | --- | --- |
| AC-1 | `dist/client/posts/{slug}/index.html`이 draft 아닌 포스트 수만큼 생성되고, draft 포스트의 slug 디렉터리는 생성되지 않는다 | 빌드 산출물 디렉터리 목록 |
| AC-2 | 그 HTML 파일 안에 포스트 본문 HTML이 **이미 들어 있다**(JS 실행 전) | `dist/client/posts/{slug}/index.html` 내용 |
| AC-3 | 프로젝트 목록의 마지막 항목 아래에 보더가 없다 | 렌더된 `/projects` |
| AC-4 | `link` 없는 프로젝트가 `<a>`가 아닌 `<span>`으로, `tech`가 빈 프로젝트는 칩 컨테이너 없이 렌더된다 | 해당 케이스의 렌더 결과 |
| AC-5 | 포스트 인덱스에 요약·태그가 없고, 행 전체가 링크이며 연도 그룹이 내림차순이다 | 렌더된 `/posts` |
| AC-6 | `src/styles/post-body.css`가 리터럴 px/색상 값 없이 테마 변수만 참조한다 | 해당 CSS 파일 내용 |
| AC-7 | `prerender()`가 정적 라우트를 하드코딩하지 않고 `getStaticPaths()`로 얻는다 | `react-router.config.ts` 내용 |

## Authority Boundaries

- **Discretion**: JSX 구조와 컴포넌트 분해, loader의 반환 형태, `.post-body` CSS 규칙의 세부(선택자·간격), 뒤로 링크 문구, 그룹 순회 구현.
- **Must-ask**: 라우트에 `action`·`headers`를 추가하는 것, 본문 HTML에 sanitize를 넣는 것, 신택스 하이라이터 도입, 커스텀 404 추가, `prerender()`에 정적 경로를 손으로 나열하는 것, `.post-body` 밖으로 스코프 CSS를 확장하는 것, 포스트 목록에 요약·태그를 노출하는 것.
- **Stop conditions**: `ssr: false` + `prerender` 조합에서 `loader`가 기대대로 동작하지 않을 때(문서상 허용되지만 실제 빌드가 거부할 경우) — `clientLoader`로 바꾸는 것은 프리렌더 산출물의 성격을 바꾸는 방향 변경이므로 임의로 하지 말고 중단한다.
- **Loop budget**: 3

## TODOs

- [x] `pages/Projects.tsx`와 `/projects` 라우트를 구현한다 — 상단 보더만, 빈 `tech`는 칩 컨테이너 생략, `link` 없으면 `<span>` (AC-3, AC-4)
- [x] `pages/Posts.tsx`와 `/posts` 라우트를 구현한다 — 연도 그리드, 행 전체가 링크, 요약·태그 없음, 포스트 0개면 그룹 미렌더 (AC-5)
- [x] `components/PostBody.tsx`와 `src/styles/post-body.css`를 만든다 — 테마 변수만 참조, 매직 넘버 0 (AC-6)
- [x] `pages/PostDetail.tsx`와 `/posts/:slug` 라우트를 구현한다 — 라우트 `loader`에서 `loadPostBody(slug)` 호출, 날짜는 ISO 포맷, 태그 없음 (AC-2)
- [x] `react-router.config.ts`의 `prerender()`를 `getStaticPaths()` + draft 아닌 포스트 slug로 확장한다 (AC-1, AC-7)
- [x] 빌드 산출물에서 draft 제외와 본문 인라인을 확인한다 (AC-1, AC-2)
