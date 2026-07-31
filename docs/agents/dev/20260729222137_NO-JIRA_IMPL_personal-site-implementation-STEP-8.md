---
Application: byron1st.github.io
JiraTicket: NO-JIRA
ReportType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
ReviewBase: git diff 76726cfa5269dd787d1cce4c1d93bfe93587a158
---

# Step 8: E2E + CI/CD + 성능 실측

Plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-8.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-8.md)

## Summary

Step 8은 빌드 산출물을 GitHub Pages와 동일한 디렉터리 `index.html` 해석으로 서빙해 SPEC 네 시나리오 E2E를 고정하고, Node 24 CI/배포 워크플로를 추가한 뒤 홈 gzip을 실측·기록한다. `vite preview`의 SPA fallback이 bare `/posts/{slug}`를 홈 HTML로 덮어쓰는 것을 확인한 뒤 `scripts/serveClient.mjs`로 교체했다. Convention gate: `references/ts-nextjs-convention.md` 전체 읽음; 저장소 규칙은 `AGENTS.md` 우선(E2E는 빌드 산출물, presentational 단위 테스트 금지, format 스텝 없음, `dist/client`만 업로드).

## TODO Fulfillment
See the change: `git diff 76726cfa5269dd787d1cce4c1d93bfe93587a158`. Every `path:line` anchor in this report is valid against that snapshot.

### TODO 1: 서빙 방식 GH Pages 패리티 — done
- Risk / Lens: high / line-by-line — 시나리오 2가 클라이언트 라우팅으로 위양성 통과하지 않도록 서버 선택이 핵심
- 구현: `scripts/serveClient.mjs:32` `resolveFile` — `dist/client` 루트, bare path와 trailing slash 모두 `…/index.html`로 해석, SPA fallback 없음(404). `package.json` `preview` → `node scripts/serveClient.mjs`, `playwright.config.ts:22` webServer가 동일 서버 사용.
- 테스트: `e2e/smoke.spec.ts:42` direct hit이 raw HTTP 본문에 `post-body`·본문 마커를 요구 — 서빙이 홈으로 떨어지면 실패.
- AC: AC-2 — `curl` 검증: bare `/posts/building-this-site` → 200 + 포스트 HTML; `vite preview`는 동일 경로에서 홈 HTML(7162B)을 반환했음.
- 편차: vite preview 패치 대신 표준 라이브러리 정적 서버로 교체(플랜 재량: 정적 서버 선택). `@types/node` 미도입을 위해 `.mjs` + eslint/tsconfig ignore.

### TODO 2: SPEC 네 시나리오 E2E — done
- 구현/테스트: `e2e/smoke.spec.ts:9` nav 4페이지, `:42` 직접 접속+raw HTML, `:62` 테마 유지, `:76` JS-off 본문. 기존 홈/about/theme 스모크는 유지(15 tests).
- AC: AC-1 — `pnpm build && pnpm test-e2e` 15 passed. AC-2 — raw `page.request.get` 어서션. AC-3 — JS disabled 컨텍스트에서 `.post-body` 본문 가시.
- 편차: none (기존 유용 테스트 유지 — 플랜 "keep useful existing tests")

### TODO 3: `ci.yml` — done
- 구현: `.github/workflows/ci.yml` — typecheck → lint → test → build → playwright chromium → e2e. `node-version: 24`, format 스텝 없음. actions: `checkout@v7` `setup-node@v7` `pnpm/action-setup@v6`.
- 테스트: none unit (워크플로 설정); 로컬에서 동일 명령 시퀀스 통과.
- AC: AC-5.
- 편차: e2e 전 `pnpm build` 스텝 명시(웹서버가 dist를 요구). push/PR 모두 트리거.

### TODO 4: `deploy.yml` — done
- 구현: `.github/workflows/deploy.yml` — `main` push, `permissions: contents/read pages/write id-token/write`, `concurrency: { group: pages, cancel-in-progress: false }`, `upload-pages-artifact@v5` `path: dist/client`, `configure-pages@v6`, `deploy-pages@v5`.
- 테스트: none (배포 미실행 — Non-goal).
- AC: AC-4, AC-5.
- 편차: none. 액션 메이저는 GitHub API latest 확인(checkout/setup-node v7, configure-pages v6, upload/deploy-pages v5, pnpm/action-setup v6).

### TODO 5: 홈 gzip 실측 — done
- 구현: 빌드 직후 `dist/client/index.html` 및 홈 HTML이 참조하는 `/assets/*.js`를 zlib gzip으로 합산.
- 테스트: none (측정 기록).
- AC: AC-6 — 수치 아래 표.
- 편차: none

#### 홈 gzip 실측 (폰트·이미지 제외)

| 항목 | raw | gzip | SPEC 예산 | 판정 |
| --- | ---: | ---: | ---: | --- |
| HTML (`index.html`) | 7.00 KB (7163 B) | **2.22 KB (2275 B)** | < 15 KB | UNDER |
| JS (홈 HTML이 참조하는 12 modules) | 375.45 KB | **119.00 KB (121854 B)** | < 60 KB | **OVER (+59 KB)** |

주요 JS gzip 기여: `entry.client` 56.6 KB, `jsx-runtime` 26.9 KB, `schemas`(zod) 15.7 KB, `errorBoundaries` 11.3 KB. React Router framework mode 런타임 무게가 예산을 초과한다 — SPEC이 이미 미검증·초과 시 예산 조정을 허용. **SSG 선택은 유지.** SPEC Performance 절 예산을 HTML 15KB 유지 / JS **≈120KB** 수준으로 현실화하는 것을 제안한다(최적화는 본 단계 Non-goal).

## Red Flags
- **RF1** `scripts/serveClient.mjs` — 최소 MIME/path 해석만 구현. Range 요청·압축·캐시 헤더 없음. GH Pages 프로덕션 헤더와 1:1은 아님; 디렉터리 index 의미만 맞춤.
- **RF2** 홈 JS 119 KB gzip — 예산 2배. `schemas-Cdn2_5Si.js`(zod)가 홈 모듈 preload에 포함되는 것은 번들 경계 재검토 신호이나 Step 8 범위 밖.
- **RF3** `deploy.yml`은 작성만 했고 실제 Pages 소스 설정·배포 실행은 하지 않음(Non-goal). 첫 배포 전 저장소 Settings → Pages → Source = GitHub Actions 필요.

## Open Questions
None

## Plan Divergence
### Changed - details that differ from the plan
- preview 서버: `vite preview` 유지 시도 대신 stdlib 정적 서버로 교체 — SPA fallback이 bare slug를 홈으로 위조하는 것이 AC-2 stop condition에 해당해 정직한 검증이 불가능했기 때문
### Added - implemented but absent from the plan
- 기존 e2e 스모크(홈/about/theme FOUC 등) 유지
- `ci.yml`에 e2e 직전 `pnpm build` + Playwright chromium install 스텝
- `scripts/serveClient.mjs` eslint/tsconfig ignore (`@types/node` 미도입 유지)
### Deferred - planned but not implemented (deferred)
- None (성능 예산 초과는 기록·제안만 — 계획대로 게이트 아님)

## Key Decisions
- `pnpm preview` = `scripts/serveClient.mjs` — GH Pages 디렉터리 index 패리티를 로컬/e2e/수동 preview에 단일화
- 시나리오 2는 `page.request.get`으로 raw HTML 어서션 — 브라우저 hydration 경로를 우회해 정적 파일 응답을 증명
- GitHub Actions 메이저: 2026-07-31 API latest 기준 v7/v6/v5 고정

## Manual Verification
- [ ] 저장소 Settings → Pages → Source를 GitHub Actions로 설정한 뒤 `main` merge 후 배포 URL 응답 확인
- [ ] 배포 후 bare `https://byron1st.github.io/posts/building-this-site` 가 포스트 본문을 반환하는지 확인
