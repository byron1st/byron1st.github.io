---
Application: byron1st.github.io
JiraTicket: NO-JIRA
ReportType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
ReviewBase: git diff b358d48e6f812a0f0b81059de618a2b0d18fa4c6
---

# Step 5: Home + About

Plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-5.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-5.md)

## Summary

Step 5의 목표는 스텁 홈을 FR-2 프론트 페이지로 교체하고 FR-3 About(`/about`)을 구현하며, Step 6이 재사용할 `SectionLabel`·`TitleMetaRow`·`MarkerList`를 `components/`에 추출하는 것이다. `profile`/`about` 상수를 페이지에서 조립하고, 빈 `works`·선택 학력 필드·빈 bullets는 컨테이너 단위로 생략해 빈 gap이 생기지 않게 했다. Convention gate: `references/ts-nextjs-convention.md` 전체 읽음; 저장소 규칙은 `AGENTS.md` 우선(presentational 단위 테스트 금지, arbitrary value는 grid template·`min-h-[52vh]`만, `pages/`끼리 import 금지, 홈에 포스트/프로젝트 미리보기 금지).

## TODO Fulfillment
See the change: `git diff b358d48e6f812a0f0b81059de618a2b0d18fa4c6`. Every `path:line` anchor in this report is valid against that snapshot.

### TODO 1: `SectionLabel`·`TitleMetaRow`·`MarkerList` 추출 — done
- 구현: `src/components/SectionLabel.tsx:8` `hasBorder` 긍정형 prop, `<h2>` + `text-xs uppercase tracking-widest text-faint`(+`pb-1.5 border-b border-line`). `src/components/TitleMetaRow.tsx:8` title/meta `ReactNode` 행. `src/components/MarkerList.tsx:8` 마커 그리드 `grid-cols-[0.875rem_1fr]`(SPEC 마커 컬럼).
- 테스트: none (presentational; AGENTS.md·플랜 Non-goals 금지). AC는 프리렌더 HTML로 고정.
- AC: AC-3 — Intro `About` h2에 border 클래스 없음, Stack/Experience/Education h2에 `pb-1.5 border-b border-line`
- 편차: MarkerList에 SPEC의 `grid-cols-[0.875rem_1fr]` 사용(플랜 본문이 언급한 예시는 stack 그리드뿐이나 AGENTS/SPEC grid-template 예외에 포함)

### TODO 2: `pages/Home.tsx` 실프론트 교체 — done
- 구현: `src/pages/Home.tsx:4` — `pt-24 min-h-[52vh]` / `gap-6.5`, 이름 `text-3xl font-semibold tracking-tight`, 태그라인, `SocialLinks`(`gap-4.5`, `text-muted hover:text-fg`, `size-5`). 포스트·프로젝트 없음.
- 테스트: `e2e/smoke.spec.ts:3` home front page shows name, tagline, and socials; `:133` github/email 속성
- AC: AC-5 — `dist/client/index.html` main에 h1 `Hwi Ahn`+tagline만, 스텁 문자열 없음; AC-6 — main 소셜 `aria-label`, github `target=_blank rel=noreferrer`, email `mailto:`
- 편차: none

### TODO 3: About Intro·Stack + `/about` 라우트 — done
- 구현: `src/pages/About.tsx:9-29` Intro(보더 없는 라벨)·Stack(`grid-cols-[8rem_1fr]`, 그룹 `text-faint`/항목 `text-fg`). `src/routes.ts:7` `route("about", …)`. `react-router.config.ts:7` prerender에 `/about` 추가(AC-1 산출물 전제).
- 테스트: none unit; `pnpm build` → `dist/client/about/index.html`
- AC: AC-3 — Intro만 보더 없음
- 편차: Stack 섹션 컨테이너 gap은 핸드오프 14px → `gap-3.5`(플랜 미기재 세부)

### TODO 4: Experience·Education 조건부 렌더 — done
- 구현: `src/pages/About.tsx:31-83` — Experience `TitleMetaRow`+role+`MarkerList(—)`는 `bullets.length > 0`일 때만. Education thesis/description/papers 각각 값 있을 때만 컨테이너 렌더(학사 엔트리는 school/period/degree만).
- 테스트: none unit; 프리렌더 Education 텍스트 스트림으로 학사 뒤에 thesis/papers 없음 확인
- AC: AC-2 — `B.S. in Computer Science` 직후 `</section>`까지 thesis·description·papers 블록 없음; Ph.D. thesis 문자열은 존재
- 편차: none

### TODO 5: Works 조건부 섹션 — done
- 구현: `src/pages/About.tsx:86-103` — `about.works.length > 0`일 때만 라벨 포함 섹션 전체 렌더. 현재 `content/about.yaml` `works: []`.
- 테스트: none unit; 빌드 HTML h2 목록
- AC: AC-1 — `dist/client/about/index.html` h2 = About·Stack·Experience·Education 4개, Works/Books 문자열 없음
- 편차: none

### TODO 6: 위계 보정 + arbitrary 점검 — done
- 구현: Works 제목 `text-sm text-fg` / 메타 `text-sm text-muted`, 스택 라벨 `text-xs text-faint` / 항목 `text-sm text-fg`. `src/**/*.tsx` className 대괄호: `grid-cols-[8rem_1fr]`, `min-h-[52vh]`, `grid-cols-[0.875rem_1fr]`(마커 grid template)뿐.
- 테스트: `rg` 검색
- AC: AC-4 — 허용 카테고리(grid template + `min-h-[52vh]`) 외 Tailwind 대괄호 0건
- 편차: 마커 그리드 포함(위 TODO 1과 동일)

## Red Flags
- **RF1** `react-router.config.ts:7` — Step 5에서 `prerender`에 `/about`을 하드코딩. Step 6이 `getStaticPaths()`로 교체할 예정이라 이중 관리 구간이 잠시 생김.
- **RF2** `src/pages/About.tsx:106` — 페이지 파일이 100줄 가이드를 6줄 초과. 섹션 추출은 Step 6 공용 패턴 재사용 이후에도 필요하면 가능.

## Open Questions
None

## Plan Divergence
### Changed - details that differ from the plan
- MarkerList 마커 컬럼에 SPEC `grid-cols-[0.875rem_1fr]` 사용(플랜 예시 목록에는 없었으나 SPEC·AGENTS grid-template 예외)
### Added - implemented but absent from the plan
- `react-router.config.ts` prerender에 `/about` 추가 — AC-1 `dist/client/about/index.html` 전제
- e2e 스텁 문자열 제거·홈 main 스코프 소셜 단언(홈·푸터 이중 링크 strict mode 대응)
### Deferred - planned but not implemented (deferred)
- None

## Key Decisions
- `TitleMetaRow` title/meta를 `ReactNode`로 받아 호출부가 className을 붙임 — Step 6 Link 래핑 seam
- Works 라벨 문자열은 스키마 필드명 `Works`(현재 비어 렌더 안 됨)
