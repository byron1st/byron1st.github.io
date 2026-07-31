---
Application: byron1st.github.io
JiraTicket: NO-JIRA
ReportType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
ReviewBase: git diff ac25f233e9c562cf2a434539a38b83044d2e72a6
---

# Step 7: SEO 메타 + 피드

Plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-7.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-7.md)

## Summary

Step 7의 목표는 FR-8 — 라우트 `meta`로 `<head>`를 채우고, `buildEnd`에서 `rss.xml`·`sitemap.xml`·`robots.txt`를 생성하며, **sitemap 경로 집합이 `prerender()` 반환값과 동일 소스**가 되게 하는 것이다. `SITE_URL`/`SITE_TITLE` 상수, 순수 `buildPageMeta`, 다섯 라우트 `meta`, `scripts/feeds.ts` + config `buildEnd`를 추가했고, 빌드 산출물로 AC-1~7을 확인했다. Convention gate: `references/ts-nextjs-convention.md` 전체 읽음; 저장소 규칙은 `AGENTS.md` 우선(단위 테스트는 `src/lib/` 허용, presentational 금지, 표준 라이브러리 XML 조립, 새 의존성 없음).

## TODO Fulfillment
See the change: `git diff ac25f233e9c562cf2a434539a38b83044d2e72a6`. Every `path:line` anchor in this report is valid against that snapshot.

### TODO 1: `src/lib/site.ts` 사이트 상수 — done
- 구현: `src/lib/site.ts:2` `SITE_URL = "https://byron1st.github.io"`, `src/lib/site.ts:5` `SITE_TITLE = "Hwi Ahn"`. canonical·og·RSS·sitemap·robots가 이 상수만 참조.
- 테스트: `src/lib/seo.test.ts:31` canonical/`og:url`이 `SITE_URL` 기반인지 고정.
- AC: AC-4 (URL 출처), 커스텀 도메인 단일 변경점.
- 편차: none

### TODO 2: `src/lib/seo.ts` 순수 meta 빌더 — done
- 구현: `src/lib/seo.ts:20` `buildPageMeta` — title·description·og(title/description/type/url)·twitter:card·`{ tagName:"link", rel:"canonical", href }`. 홈은 bare `SITE_TITLE`, 그 외 `{title} — {SITE_TITLE}`. `og:image` 없음.
- 테스트: `src/lib/seo.test.ts` 7케이스 (홈/하위 제목, canonical 형태, og:url, twitter:card, og:image 부재).
- AC: AC-4, AC-5.
- 편차: none

### TODO 3: 다섯 라우트 `meta` export — done
- 구현: `Home.tsx:5` tagline·`/`; `About.tsx:7` intro[0]·`/about`; `Projects.tsx:6` intro·`/projects`; `Posts.tsx:11` "Writing by …"·`/posts`; `PostDetail.tsx:20` loader 제목·summary·`/posts/{slug}`·`ogType:"article"`.
- 테스트: none unit (presentational wiring); 프리렌더 HTML `<head>`로 AC 고정.
- AC: AC-4 — 5개 `index.html` 모두 title·description·og 4종·twitter:card·canonical 존재. AC-5 — 홈 `Hwi Ahn`, 나머지 `… — Hwi Ahn`.
- 편차: About description은 `about.intro[0]` 사용(문구 산출 재량). intro 비면 throw(빌드 타임 검증).

### TODO 4: `scripts/feeds.ts` + `buildEnd` — done
- 구현: `scripts/feeds.ts:96` `writeFeeds({ buildDirectory, paths })` → `join(buildDirectory,"client")`에 세 파일. RSS 최신 20, `<description>`=summary. `react-router.config.ts:16` `buildEnd` 호출. `dist/client` 문자열 하드코딩 없음.
- 테스트: none unit (build-time script); `pnpm build` 산출물로 고정.
- AC: AC-1 — 세 파일 생성. AC-6 — rss 1 item, description=summary, 본문 문구 없음. AC-7 — `join(buildDirectory,"client")`만 사용.
- 편차: none

### TODO 5: sitemap = prerender 동일 소스 — done
- 구현: `scripts/feeds.ts:24` `withPostPaths(staticPaths)` = `getStaticPaths()` 결과 + `readPostFiles()` slug. `react-router.config.ts:12-14` prerender가 `sitePaths`에 저장 후 반환, `buildEnd`가 그 배열을 sitemap에 전달.
- 테스트: 빌드 후 sitemap URL 경로 집합 `==` `dist/client/**/index.html` 경로 집합 (5개 일치). draft-notes 0건.
- AC: AC-2, AC-3.
- 편차: module-level `sitePaths` 캐시 — `buildEnd`에 `getStaticPaths`가 없어 prerender 반환값을 그대로 재사용(동일 배열, 중복 소스 아님).

### TODO 6: `seo.ts` 단위 테스트 — done
- 구현/테스트: `src/lib/seo.test.ts` (TODO 2와 동일 스위트). TDD Red→Green 후 라우트·피드 연결.
- AC: AC-5.
- 편차: none

## Red Flags
- **RF1** `react-router.config.ts:6` — module-level `sitePaths` 가변 상태. prerender→buildEnd 순서에 의존. 정상 `react-router build`에서는 안전; 단독 `buildEnd` 호출 시 빈 sitemap 가능.
- **RF2** `src/pages/About.tsx:8-13` — meta description이 intro 첫 단락 전체(길 수 있음). 별도 short description 필드는 스키마에 없음.

## Open Questions
None

## Plan Divergence
### Changed - details that differ from the plan
- None (방향·소스 공유·하드코딩 금지 모두 준수)
### Added - implemented but absent from the plan
- About intro 비어 있을 때 throw (빌드 타임 검증 일관성)
- PostDetail `ogType: "article"` (og:type 값은 재량)
### Deferred - planned but not implemented (deferred)
- None

## Key Decisions
- sitemap 경로 = prerender가 반환한 배열을 module 변수로 넘김 — `buildEnd`에 `getStaticPaths`가 없어 재계산하면 정적 경로 추출을 복제하게 됨
- RSS/XML은 문자열 조립 + `escapeXml` (새 의존성 없음, SPEC·Must-ask 준수)
- 홈 canonical/`og:url`은 trailing slash 없는 `SITE_URL`

## Manual Verification
- [ ] 배포 후 `https://byron1st.github.io/rss.xml`·`sitemap.xml`·`robots.txt` 응답 확인
- [ ] 소셜 디버거 없이 view-source로 홈/포스트 `<head>` title·canonical 육안 확인
