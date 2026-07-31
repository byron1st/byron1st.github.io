---
Application: byron1st.github.io
JiraTicket: NO-JIRA
PlanType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
Step: 7
---

# Step 7: SEO 메타 + 피드

Report: [20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-7.md](./20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-7.md)

Part of main plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation.md)

## Depends On

Step 5 (Home·About 라우트 모듈), Step 6 (Projects·Posts·PostDetail 라우트 모듈과 확장된 `prerender()`). 모든 라우트가 존재해야 `meta`를 붙이고 sitemap을 만들 수 있다.

## Implements

FR-8 (SEO 메타 / 피드 / 사이트맵).

## 목표

각 페이지의 `<head>`를 채우고, 빌드가 끝난 뒤 `rss.xml` · `sitemap.xml` · `robots.txt`를 생성한다. **sitemap과 프리렌더 경로가 같은 소스에서 나오게 해 누락이 구조적으로 불가능**하게 만드는 것이 이 단계의 핵심이다.

## 범위

### `src/lib/site.ts`

`SITE_URL`, `SITE_TITLE` 등 상수. 커스텀 도메인을 붙이게 되면 여기 한 곳만 고치면 되도록(canonical·sitemap·RSS가 전부 이 상수를 참조) 설계한다.

### `src/lib/seo.ts`

meta descriptor를 조립하는 **순수 빌더 함수**. `title`·`description`·`og:title`·`og:description`·`og:type`·`og:url`·`twitter:card`를 만들고, canonical은 같은 배열에 `{ tagName: "link", rel: "canonical", href }` descriptor로 넣는다.

**컴포넌트가 아니다.** 라우트의 `meta`는 React 밖에서 실행되므로 JSX로 만들 수 없다. 반복 조립을 함수 하나로 모은다.

제목 규칙: 홈은 `{name}`, 그 외는 `{페이지 제목} — {name}`. `og:image`는 넣지 않는다(디자인에 이미지 에셋이 없다).

### 각 라우트의 `meta` export

Home·About·Projects·Posts·PostDetail에 `meta`를 붙인다. PostDetail은 loader 데이터의 제목·요약을 쓴다. `src/root.tsx`의 `<Meta />`가 이들을 `<head>`에 렌더한다.

### `scripts/feeds.ts` + `buildEnd()`

`readPostFiles()`를 재사용해(Step 3의 Node 어댑터) 세 파일을 생성한다:

- `rss.xml` — 최신 20건. `<description>`에는 `summary`를 넣는다(본문 전문 금지).
- `sitemap.xml` — 프리렌더된 전 경로. **`prerender()`와 같은 소스**에서 만든다.
- `robots.txt`

출력 경로는 `buildEnd`가 받는 `reactRouterConfig.buildDirectory` 하위 `client/`에서 얻는다 — 경로를 문자열로 하드코딩하지 않는다. 생성된 항목 수만 `console.log`로 요약한다(브라우저 콘솔 로그는 여전히 금지).

draft 포스트는 세 산출물 모두에서 빠진다 — `readPostFiles()`가 이미 걸러 주므로 여기서 다시 필터하지 않는다.

### 단위 테스트

`seo.ts` 빌더: 홈 vs 하위 페이지의 제목 규칙, canonical descriptor의 형태, `og:url`이 `SITE_URL` 기반인지.

## Non-goals

- E2E·CI/CD (Step 8)
- `og:image` 생성, 소셜 카드 이미지
- 커스텀 도메인 `CNAME` (현재 범위 밖 — 저자가 추후 직접 셋업)
- 분석 스크립트·검색 엔진 등록
- 전문(full-text) RSS

## Key decisions

- **`seo.ts`는 순수 함수 모듈**이다. `meta`가 React 컨텍스트 밖에서 실행되므로 컴포넌트로 만들 수 없고, 만들려 하면 라우트마다 descriptor 배열을 손으로 복제하게 된다.
- **sitemap과 `prerender()`의 소스를 공유**한다. 두 곳이 각자 경로를 만들면 페이지를 추가할 때 한쪽을 잊는 사고가 반드시 일어난다. 정적 경로는 `getStaticPaths()`, 포스트 경로는 `readPostFiles()` — Step 6이 이미 그 조합을 쓰고 있으므로 같은 조합을 재사용한다.
- **출력 경로는 `reactRouterConfig.buildDirectory`에서 얻는다.** `dist/client`를 문자열로 박으면 `buildDirectory` 설정과 두 곳에 같은 사실이 적힌다.
- **RSS는 요약만 싣는다.** 본문 전문을 넣으면 피드가 커지고, 마크다운 HTML을 피드용으로 다시 가공하는 경로가 생긴다.

## 다음 단계에 노출하는 seam

- 완성된 빌드 산출물 — Step 8의 E2E가 이 결과물을 서빙해 검증한다
- `SITE_URL` 상수 — 커스텀 도메인 전환 시의 단일 변경점

## Acceptance Contract

| ID | Observable condition | Evidence |
| --- | --- | --- |
| AC-1 | 빌드 후 `dist/client/`에 `rss.xml`·`sitemap.xml`·`robots.txt` 세 파일이 생성된다 | 빌드 산출물 목록 |
| AC-2 | draft 포스트가 rss·sitemap·프리렌더 경로 어디에도 등장하지 않는다 | 세 산출물에서 draft slug 검색 결과 0건 |
| AC-3 | sitemap의 URL 경로 집합이 실제 생성된 `index.html` 경로 집합과 **정확히 일치**한다 | 두 집합 비교 |
| AC-4 | 모든 페이지의 `<head>`에 title·description·og(4종)·twitter:card·canonical이 들어 있다 | 각 `index.html`의 `<head>` |
| AC-5 | 홈의 title만 `—` 구분자가 없고, 나머지는 `{페이지 제목} — {name}` 형식이다 | 각 페이지 title 태그 |
| AC-6 | `rss.xml`의 항목이 최신 20건 이하이고 `<description>`에 본문 전문이 아닌 `summary`가 들어 있다 | `rss.xml` 내용 |
| AC-7 | 피드 출력 경로가 `reactRouterConfig.buildDirectory`에서 파생되며 `dist/client` 문자열이 하드코딩돼 있지 않다 | `scripts/feeds.ts` 내용 |

## Authority Boundaries

- **Discretion**: `seo.ts` 빌더의 함수 시그니처와 인자 구조, `site.ts` 상수 이름, RSS/sitemap XML 생성 방식(문자열 조립 vs 헬퍼), description 문구 산출 규칙, 테스트 케이스 배치.
- **Must-ask**: `og:image` 추가, RSS 전문 게재, 새 의존성 설치(XML 라이브러리 등 — SPEC은 표준 라이브러리 우선을 명시), sitemap을 `prerender()`와 다른 소스에서 만드는 것, 브라우저 콘솔 로그 추가, `CNAME` 파일 추가.
- **Stop conditions**: `buildEnd`에서 프리렌더 경로 목록을 얻을 방법이 없어 sitemap을 별도 소스로 만들 수밖에 없을 때 — 중복 소스를 만들지 말고 중단하고 물어본다.
- **Loop budget**: 3

## TODOs

- [x] `src/lib/site.ts`에 `SITE_URL`·`SITE_TITLE` 등 사이트 상수를 정의한다 (AC-4)
- [x] `src/lib/seo.ts`에 meta descriptor 순수 빌더를 만든다 — canonical은 `tagName: "link"` descriptor, `og:image` 없음 (AC-4, AC-5)
- [x] 다섯 라우트에 `meta` export를 붙인다. PostDetail은 loader 데이터의 제목·요약을 사용 (AC-4, AC-5)
- [x] `scripts/feeds.ts`에서 `readPostFiles()`를 재사용해 rss·sitemap·robots를 생성하고 `buildEnd()`에서 호출한다. 출력 경로는 `reactRouterConfig.buildDirectory`에서 파생 (AC-1, AC-6, AC-7)
- [x] sitemap을 `prerender()`와 같은 소스에서 만들고, 생성 경로 집합이 실제 산출물과 일치함을 확인한다 (AC-2, AC-3)
- [x] `seo.ts` 빌더의 단위 테스트를 작성한다 — 홈/하위 페이지 제목 규칙, canonical descriptor 형태 (AC-5)
