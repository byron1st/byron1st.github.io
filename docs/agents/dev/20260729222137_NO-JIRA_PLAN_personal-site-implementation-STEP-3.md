---
Application: byron1st.github.io
JiraTicket: NO-JIRA
PlanType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
Step: 3
---

# Step 3: Markdown 파이프라인

Report: [20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-3.md](./20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-3.md)

Part of main plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation.md)

## Depends On

Step 1 (툴체인 기반) — Vite plugin을 꽂을 자리, `*.md` 앰비언트 타입, Vitest 설정이 필요하다. Step 2와 병렬 진행 가능하다.

## Implements

FR-7(Markdown 파이프라인) 전체와 FR-5·FR-6의 **데이터 계층**.

## 목표

`content/posts/*.md`를 `{ meta, html }`을 export 하는 JS 모듈로 바꾸는 Vite plugin을 만들고, 그 위에 포스트 목록·본문 로딩 계층을 세운다. 잘못된 포스트(파일명 패턴 위반, frontmatter 누락, 빈 본문)는 **빌드를 중단시킨다.**

## 범위

### `plugins/markdown.ts`

`.md` 파일을 `transform`한다: `gray-matter`로 frontmatter를 분리하고, `unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify)`로 본문을 HTML 문자열로 만든 뒤 `export const meta` / `export const html`을 내보낸다.

frontmatter는 `title`과 `summary`만 받는다(`draft`는 선택, 기본 `false`). **`date`와 `slug`는 파일명 `YYYY-MM-DD-{slug}.md`에서만 파생**하며 frontmatter에 중복 기재하지 않는다.

빌드 중단 조건 세 가지 — 각각 문제의 **파일 경로를 메시지에 포함**한다:
1. 파일명이 `YYYY-MM-DD-{slug}.md` 패턴에 맞지 않음
2. frontmatter 필수 필드 누락
3. 본문이 비어 있음

신택스 하이라이팅은 넣지 않는다(디자인의 코드 블록은 단색). 마크다운은 저자 본인이 쓰므로 **sanitize도 넣지 않는다** — 신뢰 경계 안이다.

### 콘텐츠 계층 3분할

메인 플랜의 "핵심 구조 결정"을 그대로 구현한다.

- `src/content/postMeta.ts` — **순수 모듈.** React·Vite·fs 어느 것도 import 하지 않는다. `PostMeta` 타입, frontmatter zod 스키마, `parsePostFilename()`, `sortPosts()`, `groupPostsByYear()`. **이 단계의 단위 테스트 대상은 전부 여기다.**
- `src/content/posts.ts` — **번들 어댑터.** 메타는 `import.meta.glob(..., { eager: true, import: "meta" })`로 즉시, 본문은 lazy glob으로 `loadPostBody(slug)`에서만 가져온다 → 인덱스 페이지 번들에 본문이 들어가지 않는다. 정렬·draft 필터는 `postMeta.ts`에 위임한다.
- `scripts/postFiles.ts` — **Node 어댑터.** `fs` + `gray-matter`로 `content/posts/*.md`를 읽어 같은 `PostMeta[]`를 반환한다. `react-router.config.ts`(Step 6)와 `scripts/feeds.ts`(Step 7)가 공유한다. 정렬·필터·파일명 파싱은 역시 `postMeta.ts`에 위임한다.

### 콘텐츠

- 실제 포스트 1개 — 이 사이트를 만든 기록(스택 선택 근거). 한국어. 문단·소제목·코드 블록·인용을 한 번씩 포함해 Step 6의 `.post-body` 스타일을 실제로 검증할 수 있게 한다.
- `draft: true` 포스트 1개 — draft 필터·프리렌더 제외·피드 제외의 실제 검증 대상.

## Non-goals

- 포스트 목록/상세 화면 (Step 6)
- `.post-body` CSS (Step 6)
- `prerender()` 확장 (Step 6), RSS·sitemap (Step 7)
- 신택스 하이라이팅, HTML sanitize, 태그 시스템, 요약 자동 추출

## Key decisions

- **정렬·필터·파일명 파싱 로직은 `postMeta.ts`에만 존재한다.** 번들 측과 Node 측이 각자 구현하면 목록의 단일 출처가 깨지고, sitemap이 프리렌더 경로와 어긋나는 사고가 구조적으로 가능해진다. 어댑터 두 개는 "어디서 파일을 읽는가"만 다르다.
- **반려한 대안**: `react-router.config.ts`에서 `src/content/posts.ts`를 직접 import — `import.meta.glob`은 Vite transform 밖에서 존재하지 않아 실패한다.
- **`meta`와 `html`을 별도 export**로 나눈다(하나의 default 객체가 아니라). `import.meta.glob`의 `import: "meta"` 옵션이 본문 chunk를 떼어낼 수 있는 것이 이 분리 덕분이다.
- **동일 날짜의 타이브레이커는 slug 오름차순**이며 안정 정렬이어야 한다. 그렇지 않으면 파일 시스템 순서에 따라 프리렌더 산출물이 달라진다.

## 다음 단계에 노출하는 seam

```
PostMeta = { title: string; summary: string; draft: boolean; date: string; slug: string }

// src/content/postMeta.ts (순수)
parsePostFilename(filename: string): { date: string; slug: string }   // 패턴 불일치 시 throw
sortPosts(posts: PostMeta[]): PostMeta[]                              // 날짜 desc, 동일 날짜 slug asc (안정)
groupPostsByYear(posts: PostMeta[]): { year: string; posts: PostMeta[] }[]  // 연도 desc

// src/content/posts.ts (번들)
posts: PostMeta[]                        // draft 제외, 정렬 완료
loadPostBody(slug: string): Promise<string>

// scripts/postFiles.ts (Node)
readPostFiles(): PostMeta[]              // draft 제외, 정렬 완료 — posts와 동일한 집합
```

`posts`와 `readPostFiles()`가 **같은 집합을 반환한다**는 것이 Step 6·7의 전제다.

## Acceptance Contract

| ID | Observable condition | Evidence |
| --- | --- | --- |
| AC-1 | `draft: true` 포스트가 `posts`와 `readPostFiles()` 양쪽에서 제외되고, 두 함수가 같은 slug 집합을 반환한다 | 두 소스의 결과를 비교하는 단위 테스트 |
| AC-2 | 파일명 패턴 위반·frontmatter 필수 필드 누락·빈 본문 각각이 **문제의 파일 경로를 포함한 메시지**로 빌드를 중단시킨다 | 세 케이스 각각의 빌드 실패 출력 |
| AC-3 | `groupPostsByYear`가 연도 내림차순, 그룹 내 날짜 내림차순, 동일 날짜는 slug 오름차순 안정 정렬로 반환한다 | 세 조건을 각각 겨냥한 단위 테스트 |
| AC-4 | 정렬·draft 필터·파일명 파싱 구현이 `postMeta.ts` 한 곳에만 존재한다 (어댑터 2개에 중복 없음) | `posts.ts`·`scripts/postFiles.ts`가 해당 로직을 직접 구현하지 않음 |
| AC-5 | `content/posts/`에 실제 포스트 1개와 draft 포스트 1개가 있고, 실제 포스트는 문단·소제목·코드 블록·인용을 모두 포함한다 | 커밋된 `.md` 파일 |

## Authority Boundaries

- **Discretion**: Vite plugin의 transform 구현 방식과 `load`/`transform` 훅 선택, 생성 모듈의 코드 형태, zod 스키마 필드 표현, glob 패턴, 에러 메시지 문구, 실제 포스트의 내용과 제목, 테스트 파일 배치.
- **Must-ask**: `date`·`slug`를 frontmatter로 옮기는 것, HTML sanitize나 신택스 하이라이터 추가, 요약 자동 추출로 `summary`를 선택 필드화하는 것, 3분할 구조를 다른 구조로 바꾸는 것, remark/rehype 플러그인 추가 설치.
- **Stop conditions**: Vite 8에서 커스텀 plugin의 `.md` transform이 React Router의 빌드 파이프라인과 충돌해 우회가 필요할 때 — 임의로 구조를 바꾸지 말고 중단한다.
- **Loop budget**: 3

## TODOs

- [x] `src/content/postMeta.ts`에 `PostMeta` 타입, frontmatter zod 스키마, `parsePostFilename`·`sortPosts`·`groupPostsByYear`를 순수 함수로 구현한다 (AC-3, AC-4)
- [x] `plugins/markdown.ts`로 `.md` → `{ meta, html }` 모듈 변환을 구현한다. 파일명·frontmatter·빈 본문 위반은 파일 경로를 담아 throw (AC-2)
- [x] `src/content/posts.ts`에서 메타는 eager glob, 본문은 lazy glob으로 가져와 `posts`와 `loadPostBody(slug)`를 노출한다 — 정렬·필터는 `postMeta.ts`에 위임 (AC-1, AC-4)
- [x] `scripts/postFiles.ts`에 `readPostFiles()`를 구현한다 — fs + gray-matter, 정렬·필터는 `postMeta.ts`에 위임 (AC-1, AC-4)
- [x] 실제 포스트 1개(한국어, 문단·소제목·코드·인용 포함)와 `draft: true` 포스트 1개를 작성한다 (AC-5)
- [x] 파일명 파싱·draft 필터·정렬 3종·frontmatter 스키마의 단위 테스트를 작성한다 (AC-1, AC-2, AC-3)
