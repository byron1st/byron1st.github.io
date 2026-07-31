---
Application: byron1st.github.io
JiraTicket: NO-JIRA
ReportType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
ReviewBase: git diff e2e7ae5c3febb34215d9221198219a0dbbbe884e
---

# Step 3: Markdown 파이프라인

Plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-3.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-3.md)

## Summary

Step 3의 목표는 `content/posts/*.md`를 `{ meta, html }` 모듈로 바꾸는 Vite plugin과, 정렬·draft 필터·파일명 파싱의 단일 출처인 순수 `postMeta` + 번들/Node 어댑터 2개를 세우는 것이다. 잘못된 포스트는 파일 경로를 담아 파이프라인을 중단시키며, 실제 한국어 포스트 1개와 draft 1개로 이후 단계의 목록·프리렌더·피드 seam을 고정했다. Convention gate: `references/ts-nextjs-convention.md` 전체 읽음; 저장소 규칙은 `AGENTS.md` 우선(unit test는 `src/content/`·`src/lib/`만, date/slug는 파일명 only, sanitize/하이라이트 없음).

## TODO Fulfillment
See the change: `git diff e2e7ae5c3febb34215d9221198219a0dbbbe884e`. Every `path:line` anchor in this report is valid against that snapshot.

### TODO 1: `src/content/postMeta.ts` 순수 모듈 — done
- 구현: `src/content/postMeta.ts:3` `postFrontmatterSchema` / `:19` `parsePostFilename` / `:33` `sortPosts` / `:49` `selectPublishedPosts` / `:54` `groupPostsByYear` — React·Vite·fs 무의존. draft 필터+정렬을 `selectPublishedPosts` 한 경로로 묶음.
- 테스트: `src/content/__tests__/postMeta.test.ts:24` parse; `:50` schema; `:92` sort 3종; `:119` groupPostsByYear; `:143` draft filter
- AC: AC-3, AC-4 — 연도 desc·날짜 desc·slug asc 안정 정렬 단위 테스트; 정렬/필터/파싱 구현은 이 파일만
- 편차: 플랜 seam에 없던 `selectPublishedPosts`를 추가해 draft 필터+정렬을 어댑터 양쪽이 공유 (AC-4 강화)

### TODO 2: `plugins/markdown.ts` — done
- 구현: `plugins/markdown.ts:21` `markdown()` — gray-matter + unified/remark/rehype, `export const meta`/`html` 분리. `content/posts/`만 처리. 파일명·frontmatter·빈 본문 실패 시 `filePath` 포함 throw. `vite.config.ts`에 plugin 등록.
- 테스트: 단위 테스트 대신 잘못된 `.md`를 임시로 넣고 `postsAdapters` import 경로로 transform 실패 관측 (AC-2 증거)
- AC: AC-2 — bad filename / missing summary / empty body 각각 경로 포함 메시지
- 편차: none

### TODO 3: `src/content/posts.ts` 번들 어댑터 — done
- 구현: `src/content/posts.ts:7` eager `import: "meta"` / `:15` lazy `import: "html"` / `:23` `posts` / `:27` `loadPostBody` — 정렬·필터는 `selectPublishedPosts` 위임
- 테스트: `src/content/__tests__/postsAdapters.test.ts:7` draft 제외 + slug 집합 동일; `:20` body HTML; `:28` missing slug throw
- AC: AC-1, AC-4
- 편차: none

### TODO 4: `scripts/postFiles.ts` Node 어댑터 — done
- 구현: `scripts/postFiles.ts:17` `readPostFiles()` — `node:fs` + gray-matter, `parsePostFilename`/`postFrontmatterSchema`/`selectPublishedPosts` 위임. `@types/node` 없이 `env.d.ts` 최소 ambient
- 테스트: `postsAdapters.test.ts:7` `posts`와 slug 집합 비교
- AC: AC-1, AC-4
- 편차: frontmatter/empty-body 검증 문구를 plugin과 같은 형태로 맞춤(로직 중복이 아니라 I/O 경계 검증). 정렬·필터·파싱은 위임만

### TODO 5: 실제 포스트 + draft — done
- 구현: `content/posts/2026-07-29-building-this-site.md` (한국어, 문단·`##`·코드·인용), `content/posts/2026-07-30-draft-notes.md` (`draft: true`)
- 테스트: adapters 테스트가 published slug만 노출; body HTML에 h2/blockquote/pre 포함
- AC: AC-5 — 커밋 대상 `.md` 2개
- 편차: none

### TODO 6: 단위 테스트 — done
- 구현: `src/content/__tests__/postMeta.test.ts` (12), `postsAdapters.test.ts` (3)
- 테스트: `pnpm test` 48 passed
- AC: AC-1, AC-2(스키마·파일명 단위 + transform 실패 관측), AC-3
- 편차: AC-2의 “빌드 실패”는 현재 라우트가 posts를 import하지 않아 `pnpm build` 경로가 아니라 Vite transform(vitest import) 경로로 증거 수집. Step 6에서 posts가 라우트에 연결되면 동일 throw가 build를 끊는다.

## Red Flags
- **RF1** `scripts/postFiles.ts:17-46` / `plugins/markdown.ts:34-54` — frontmatter·빈 본문 검증이 어댑터와 plugin에 각각 있다. 정렬/필터/파싱은 단일 출처지만 I/O 경계 검증 문구가 어긋날 여지는 남음.
- **RF2** `env.d.ts:8-20` — `@types/node` 없이 `node:fs`/`node:path` 최소 ambient. 시그니처가 실제 Node API보다 좁다.

## Open Questions
- **OQ1** `src/content/posts.ts` — Step 6 이전에는 앱 라우트가 `posts`를 import하지 않아 production `pnpm build`가 draft/bad md를 건드리지 않는다. Step 6 prerender 연결 시 AC-2가 build 경로에서도 재확인되면 좋다.

## Plan Divergence
### Changed - details that differ from the plan
- draft 필터를 `selectPublishedPosts`로 명시 export (플랜 seam 목록에는 `sortPosts`만 있었음; 단일 출처 결정을 더 명확히 하기 위함)
- AC-2 증거를 `pnpm build` 대신 Vite transform(vitest가 posts glob import)으로 수집 — Step 3 시점 라우트 미연결 때문
### Added - implemented but absent from the plan
- `selectPublishedPosts` helper
- `postsAdapters.test.ts` — AC-1 두 소스 비교
- `env.d.ts` node builtin ambient (scripts용)
### Deferred - planned but not implemented (deferred)
- None

## Key Decisions
- plugin은 `content/posts/` 경로만 transform — `docs/**/*.md`를 모듈로 오인하지 않기 위함
- meta/html named export 분리 유지 — `import: "meta"`로 본문 chunk 분리

## Fix

### Fix 1 — 2026-07-31 10:44 — REVIEW-001 meta/html 모듈 ID 분리
- **Finding**: REVIEW-001
- **Root cause**: 동일 `*.md` 모듈 ID에 eager `import:"meta"`와 lazy `import:"html"`을 동시에 걸어 Rollup이 `INEFFECTIVE_DYNAMIC_IMPORT`를 내고 본문 HTML을 공유 청크에 인라인했다.
- **Change**: Vite glob에 `query: "?meta"` / `query: "?html"`을 쓰고 plugin이 쿼리별로 meta-only / html-only 모듈을 내도록 해 모듈 ID를 분리했다. `loadPostBody`는 published `posts` 집합 밖(slug 없음·draft)을 동일하게 거절한다.
- **Regression test**: `postsAdapters.test.ts`에 `?meta`/`?html` 전용 export·빈 본문 검증 유지·draft slug 거절 케이스 추가 — `pnpm test` 73 passed.
- **Files changed**:
  - `plugins/markdown.ts:15` `parseMarkdownId` / query별 export
  - `src/content/posts.ts:7` glob `?meta`/`?html` + draft 거절
  - `src/content-modules.d.ts:11` `*.md?meta` / `*.md?html` 선언
  - `src/content/__tests__/postsAdapters.test.ts:67` 회귀 테스트
- **Verification**: `pnpm test` ✅, `pnpm check` ✅, `pnpm build` ✅; 최소 Vite 엔트리로 meta-only 빌드 시 본문 문구 없음·`loadPostBody` 포함 빌드 시 포스트별 async chunk·`INEFFECTIVE_DYNAMIC_IMPORT` 소멸 확인.
- **Notes**: production `pnpm build`는 Step 6 전이라 posts 그래프를 아직 묶지 않는다. 코드 스플릿 증거는 재현용 최소 Vite 빌드로 확인했다.
