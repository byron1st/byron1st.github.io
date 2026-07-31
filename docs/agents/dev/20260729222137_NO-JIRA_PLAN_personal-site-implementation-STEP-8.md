---
Application: byron1st.github.io
JiraTicket: NO-JIRA
PlanType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
Step: 8
---

# Step 8: E2E + CI/CD + 성능 실측

Report: [20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-8.md](./20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-8.md)

Part of main plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation.md)

## Depends On

Step 7 (완성된 빌드 산출물). E2E는 빌드 결과를 서빙해 실행하므로 모든 화면과 피드가 준비돼 있어야 한다.

## Implements

FR-9 (빌드 & 배포)의 워크플로 부분, 그리고 SPEC Testability 절의 E2E 요구사항.

## 목표

빌드 산출물을 실제로 서빙해 **SSG의 핵심 약속이 지켜지는지 검증**하고, CI/배포 워크플로를 작성한다. 마지막으로 홈의 gzip 크기를 실측해 기록한다.

## 범위

### `e2e/smoke.spec.ts`

SPEC이 지정한 네 시나리오 — 이 목록은 줄이지 않는다:

1. `/` → `/about` → `/projects` → `/posts` 네비게이션
2. `/posts/{slug}` **직접 접속** 시 200 + 본문 렌더 (SSG 핵심 약속)
3. 테마 토글 → `data-theme` 변경 → 새로고침 후 유지
4. **JS 비활성화 상태에서 포스트 본문이 보임** (프리렌더 검증)

### 서빙 방식 — 이 단계의 최대 리스크

React Router 빌드는 `dist/client`(정적)와 `dist/server`를 만들고, 프리렌더는 중첩 디렉터리 + `index.html` 형태로 출력한다. GitHub Pages는 `/posts/{slug}` 요청을 해당 디렉터리의 `index.html`로 서빙한다.

**`pnpm preview`(= `vite preview`)가 그 동작을 그대로 재현하는지 먼저 확인해야 한다.** 확인할 것 두 가지:
- `dist/client`를 루트로 서빙하는가 (React Router의 `buildDirectory: "dist"` 설정과 `vite preview`의 `outDir` 인식이 어긋날 수 있다)
- 뒤 슬래시 없는 `/posts/{slug}`를 디렉터리 `index.html`로 해석하는가

어긋나면 Playwright `webServer`에 GitHub Pages와 동일하게 동작하는 정적 서버를 지정한다(필요하면 `package.json`의 `preview` 스크립트도 조정). **이 확인 없이는 시나리오 2가 SSG의 약속을 검증하지 못하고 통과해 버릴 수 있다** — 클라이언트 라우팅으로 우연히 화면이 그려지는 것과 정적 파일이 응답되는 것은 다르다.

### `.github/workflows/ci.yml`

PR과 push에서 `typecheck` → `lint` → `test`(Vitest) → `e2e`(Playwright). `lint`가 Prettier 포맷 검사를 겸하므로 **별도 format 스텝을 만들지 않는다.** `setup-node`의 `node-version: 24`로 런타임을 고정한다.

### `.github/workflows/deploy.yml`

`main` push에서 build 후 **`dist/client`**를 `actions/upload-pages-artifact`로 올리고 `actions/deploy-pages`로 배포한다. `dist/` 전체를 올리면 서버 빌드 산출물까지 배포되므로 반드시 `client` 하위를 지정한다.

권한 `contents: read` / `pages: write` / `id-token: write`, `concurrency: { group: pages, cancel-in-progress: false }`. 액션 메이저 버전은 **구현 시점의 최신 안정판을 확인해** 고정한다(SPEC Open Question 5의 결정).

### 성능 실측

홈의 초기 HTML과 JS를 gzip 기준으로 재서 구현 리포트에 기록한다. SPEC의 목표는 HTML < 15KB, JS < 60KB(폰트·이미지 제외)이며 **스스로 미검증이라고 명시**하고 있다. 초과해도 이 단계는 통과다 — 숫자를 기록하고, 초과 시 SPEC의 예산 값을 조정하자는 제안만 남긴다. **이 수치 때문에 SSG 선택을 되돌리지 않는다.**

## Non-goals

- `git push`, GitHub Pages 저장소 설정(Source = GitHub Actions), 실제 배포 실행 — 전부 저자 몫
- 번들 최적화·코드 스플리팅 튜닝 (예산 초과 시에도 이번 범위 밖)
- 시각 회귀 테스트, Lighthouse CI, 접근성 자동 검사
- 프레젠테이션 컴포넌트 단위 테스트, mutation 테스트 (`AGENTS.md`가 명시적으로 금지)
- 커스텀 도메인 설정

## Key decisions

- **E2E는 빌드 산출물을 서빙해 돌린다.** dev 서버로 돌리면 프리렌더 여부를 전혀 검증하지 못한다 — 시나리오 2·4가 의미를 잃는다.
- **JS 비활성 테스트를 반드시 포함**한다. 이 프로젝트에서 "정적 HTML에 본문이 들어 있다"는 것은 성능 최적화가 아니라 아키텍처 선택의 근거 자체다.
- **format 전용 CI 스텝을 만들지 않는다.** Prettier가 `prettier/prettier` ESLint 규칙으로 돌기 때문에 `lint`가 곧 포맷 검사이고, 별도 스텝을 두면 같은 검사가 두 곳에 적힌다.
- **성능 예산은 게이트가 아니라 기록 항목**으로 다룬다(계획 단계에서 사용자와 확정). React Router framework mode의 런타임은 최소 구성 SSG보다 무겁고, SPEC은 그 트레이드오프를 이미 수용했다.

## Acceptance Contract

| ID | Observable condition | Evidence |
| --- | --- | --- |
| AC-1 | `pnpm build && pnpm test-e2e`가 네 시나리오 모두 통과한다 | Playwright 실행 결과 |
| AC-2 | E2E가 서빙하는 방식이 GitHub Pages의 디렉터리 `index.html` 해석과 동일함이 확인됐고, 시나리오 2가 **클라이언트 라우팅이 아닌 정적 파일 응답**을 검증한다 | 서빙 방식 확인 내용 + 해당 테스트 구현 |
| AC-3 | JS 비활성 상태에서 포스트 본문이 보이는 테스트가 실제로 통과한다 | 시나리오 4 결과 |
| AC-4 | `deploy.yml`이 `dist/` 전체가 아닌 **`dist/client`**를 업로드하고, 권한 3종과 `concurrency` 설정을 갖는다 | `deploy.yml` 내용 |
| AC-5 | 두 워크플로가 Node 24를 고정하고, `ci.yml`에 별도 format 스텝이 없다 | 두 워크플로 내용 |
| AC-6 | 홈의 HTML·JS gzip 실측치가 구현 리포트에 기록된다 | 구현 리포트의 수치 |

## Authority Boundaries

- **Discretion**: Playwright 설정(브라우저·워커·리트라이), 테스트 셀렉터와 어서션 방식, 정적 서버 선택, 워크플로 job/step 구성, 캐시 전략, gzip 측정 방법.
- **Must-ask**: `git push`나 실제 배포 실행, Pages 저장소 설정 변경, E2E 시나리오 4개 중 하나라도 빼는 것, `dist/` 전체를 업로드하도록 바꾸는 것, `gh-pages` 브랜치 방식으로 전환하는 것, 성능 예산을 맞추기 위한 아키텍처 변경, mutation 테스트 도입.
- **Stop conditions**: 정적 서빙 방식을 GitHub Pages와 동일하게 재현할 수 없어 시나리오 2를 정직하게 검증할 수 없을 때 — 통과하는 것처럼 보이는 약한 어서션으로 대체하지 말고 중단한다.
- **Loop budget**: 3

## TODOs

- [x] 빌드 산출물의 서빙 방식이 GitHub Pages와 동일한지 확인하고, 필요하면 Playwright `webServer`(또는 `preview` 스크립트)를 그에 맞게 설정한다 (AC-2)
- [x] `e2e/smoke.spec.ts`에 네 시나리오를 구현한다 — 네비게이션, `/posts/{slug}` 직접 접속, 테마 유지, JS 비활성 본문 렌더 (AC-1, AC-2, AC-3)
- [x] `.github/workflows/ci.yml`을 작성한다 — typecheck → lint → test → e2e, Node 24, 별도 format 스텝 없음 (AC-5)
- [x] `.github/workflows/deploy.yml`을 작성한다 — `dist/client` 업로드, 권한 3종, `concurrency`, 액션은 최신 안정 메이저 고정 (AC-4, AC-5)
- [x] 홈의 HTML·JS를 gzip 기준으로 실측해 구현 리포트에 기록하고, 예산 초과 시 SPEC 예산 조정 제안을 남긴다 (AC-6)
