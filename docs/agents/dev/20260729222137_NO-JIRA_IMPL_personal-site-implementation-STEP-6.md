---
Application: byron1st.github.io
JiraTicket: NO-JIRA
ReportType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
ReviewBase: git diff 4dab84815c765751e7a70a5fc0ca34fba0d0beed
---

# Step 6: Projects + Posts + PostDetail

Plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-6.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-6.md)

## Summary

Step 6의 목표는 FR-4 Projects, FR-5 Posts 인덱스, FR-6 Post 상세를 구현하고 `prerender()`를 `getStaticPaths()` + `readPostFiles()` 기반으로 승격해 draft가 아닌 포스트마다 본문이 인라인된 정적 HTML을 생성하는 것이다. `ssr: false` + route `loader` + prerender 조합은 빌드에서 실제로 통과했고(`.data` + `index.html`), `clientLoader`로의 방향 변경은 불필요했다. Convention gate: `references/ts-nextjs-convention.md` 전체 읽음; 저장소 규칙은 `AGENTS.md` 우선(presentational 단위 테스트 금지 → content/lib 외 신규 단위 테스트 없음, arbitrary value는 연도 그리드 `grid-cols-[4rem_1fr]`만 추가).

## TODO Fulfillment
See the change: `git diff 4dab84815c765751e7a70a5fc0ca34fba0d0beed`. Every `path:line` anchor in this report is valid against that snapshot.

### TODO 1: `pages/Projects.tsx`와 `/projects` 라우트 — done
- 구현: `src/pages/Projects.tsx:5` — 래퍼 `pt-14 … gap-7.5`, 헤더 `gap-3.5`, 행 `py-5 border-t border-line`(상단 보더만). `link` 있으면 외부 `<a target=_blank rel=noreferrer>`, 없으면 `<span>`; `tech.length > 0`일 때만 칩 컨테이너. `year` optional → 있을 때만 meta. `src/routes.ts:8` `route("projects", …)`.
- 테스트: none (presentational; AGENTS.md 금지). AC는 프리렌더 HTML·코드 분기로 고정.
- AC: AC-3 — `dist/client/projects/index.html` main article이 `border-t border-line`만 사용, 하단 보더/`last:border-0` 없음. AC-4 — 조건부 분기 코드 존재; 현재 `content/projects.yaml`의 personal-harness는 link+tech 보유라 no-link/empty-tech는 데이터로 렌더 검증 불가.
- 편차: none

### TODO 2: `pages/Posts.tsx`와 `/posts` 라우트 — done
- 구현: `src/pages/Posts.tsx:9` — `groupPostsByYear(posts)` 연도 그리드 `grid-cols-[4rem_1fr]`, 행 전체 `Link` + `TitleMetaRow`, 제목 `group-hover:text-accent`, 날짜 `formatShortDate`. 요약·태그 미표시. 그룹 0개면 라벨만. `src/routes.ts:9`.
- 테스트: none unit; 기존 `groupPostsByYear` 단위 테스트가 정렬 전제.
- AC: AC-5 — `dist/client/posts/index.html` main에 제목·`Jul 29`·연도 `2026`·`/posts/building-this-site` 링크만, summary/tags 문자열 없음.
- 편차: none

### TODO 3: `PostBody` + `post-body.css` — done
- 구현: `src/components/PostBody.tsx:7` `dangerouslySetInnerHTML` + `post-body max-w-prose`. `src/styles/post-body.css` — SPEC FR-7 초안을 테마 변수로 이식(색·spacing·type scale 전부 `var(...)`).
- 테스트: none (presentational/CSS).
- AC: AC-6 — 색상·간격은 변수만; 보더 두께 `1px`/`2px`는 SPEC FR-7 초안 그대로(색은 `var(--color-line)`).
- 편차: 보더 두께 리터럴 px는 SPEC 초안 준수(색/spacing 매직 넘버 금지와 구분).

### TODO 4: `pages/PostDetail.tsx` + `/posts/:slug` loader — done
- 구현: `src/pages/PostDetail.tsx:8` `loader` → published `posts` 조회 + `loadPostBody(slug)` → `{ post, html }`. 컴포넌트는 뒤로 링크·ISO 날짜·`PostBody`. 태그 없음. `src/routes.ts:10` `posts/:slug`.
- 테스트: none unit; loader 동작은 빌드 prerender(`.data` + HTML 본문 인라인)로 고정. 기존 `loadPostBody` 단위 테스트 유지.
- AC: AC-2 — `dist/client/posts/building-this-site/index.html`의 `<main>`에 script 제거 후에도 `.post-body` 본문 HTML(`왜 정적 사이트인가` 등) 존재.
- 편차: 미존재 slug는 `throw new Response(404)` 대신 `throw new Error` — `only-throw-error` ESLint와 충돌; 커스텀 404는 Non-goals.

### TODO 5: `prerender()` → `getStaticPaths()` + post slugs — done
- 구현: `react-router.config.ts:9` `prerender({ getStaticPaths })`가 정적 경로 + `readPostFiles().map(/posts/${slug})` 반환. 정적 경로 하드코딩 없음.
- 테스트: none (config; AGENTS 단위 테스트 범위 밖). AC는 빌드 로그·산출물.
- AC: AC-7 — config가 `getStaticPaths()` 사용. AC-1 — 빌드가 `/`, `/about`, `/projects`, `/posts`, `/posts/building-this-site`만 프리렌더; draft-notes 디렉터리 없음.
- 편차: none

### TODO 6: 빌드 산출물 draft 제외·본문 인라인 확인 — done
- 구현/검증: `pnpm build` 성공. 산출물: `dist/client/posts/building-this-site/index.html` + `.data`; `draft-notes` 없음. loader HTML이 main에 인라인.
- 테스트: 빌드 산출물 검사(위 AC-1·AC-2).
- AC: AC-1, AC-2 충족.
- 편차: none

## Red Flags
- **RF1** `src/pages/PostDetail.tsx:13` — 미존재 slug에 `throw new Error` (HTTP 404 Response 아님). SPA 직접 진입 시 기본 error UI; 커스텀 404는 계획 Non-goals.
- **RF2** `src/styles/post-body.css:20,30` — 보더 두께 `1px`/`2px` 리터럴. SPEC FR-7 초안 일치; 색/spacing은 변수.

## Open Questions
None

## Plan Divergence
### Changed - details that differ from the plan
- 미존재 slug throw를 `Response` 대신 `Error`로 — ESLint `@typescript-eslint/only-throw-error` 준수; 방향(loader로 본문 로드)은 유지
### Added - implemented but absent from the plan
- `year` optional 조건부 meta 렌더(스키마가 optional, 현재 yaml에 year 없음)
### Deferred - planned but not implemented (deferred)
- None

## Key Decisions
- loader 반환 `{ post, html }` — Step 7 `meta`가 제목·요약을 loader 데이터에서 읽을 seam
- Posts 행 hover는 `Link.group` + `group-hover:text-accent` — 행 전체 클릭 영역에서 제목만 색 변경
- prerender 경로 조합을 config에 인라인 — Step 7 sitemap이 같은 소스 패턴을 재사용(추출은 Step 7 재량)

## Manual Verification
- [ ] `/projects`에서 마지막 프로젝트 아래 선이 없는지 브라우저로 확인
- [ ] `/posts/building-this-site`를 JS 비활성(또는 view-source)으로 열어 본문이 보이는지 확인
- [ ] 네비 about → projects → posts → 상세 → back 왕복
