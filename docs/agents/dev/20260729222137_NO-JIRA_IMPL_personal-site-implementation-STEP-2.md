---
Application: byron1st.github.io
JiraTicket: NO-JIRA
ReportType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
ReviewBase: git diff 5f829236d2fc8dfa50fd80e18bacde14e8f6f09f
---

# Step 2: 콘텐츠 스키마 + YAML 실데이터

Plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-2.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation-STEP-2.md)

## Summary

Step 2의 목표는 About/Projects/Layout이 소비할 **검증된 구조화 콘텐츠 계층**을 세우고, `docs/resume.md`의 실제 이력으로 YAML을 채우는 것이다. `profile`/`about`/`projects` zod 스키마와 모듈 평가 시점 검증 상수 export, TZ/locale 비의존 날짜 포맷터, resume 기반 실데이터를 추가했으며 핸드오프 가짜 데이터와 X/LinkedIn 추정 URL은 넣지 않았다. Convention gate: `references/ts-nextjs-convention.md` 전체 읽음; 저장소 규칙은 `AGENTS.md`가 우선(unit test는 `src/content/`·`src/lib/`만, 검증된 상수 export, content 편집에 `src/` 변경 불필요).

## TODO Fulfillment
See the change: `git diff 5f829236d2fc8dfa50fd80e18bacde14e8f6f09f`. Every `path:line` anchor in this report is valid against that snapshot.

### TODO 1: `src/content/schema.ts`에 profile·about·projects zod 스키마와 `z.infer` 파생 타입을 정의한다 — done
- 구현: `src/content/schema.ts:10` `profileSchema` / `:43` `aboutSchema` / `:60` `projectsSchema` — 선택 필드 `works`(default `[]`)·`thesis`·`description`·`papers`·`link`·`tech`(default `[]`)·`year`. 타입은 전부 `z.infer` 파생(`Profile`/`About`/`Projects` 등).
- 테스트: `src/content/__tests__/schema.test.ts:72` bachelor without optional fields; `:121` project without link + empty tech; `:97` empty works
- AC: AC-3 — 선택 필드 없는 케이스가 스키마 통과(단위 테스트 10건 중 해당 케이스 통과)
- 편차: `projectEntry.year`를 optional로 둠 — resume에 personal-harness 연도가 없어 창작하지 않기 위함(Authority Discretion 범위)

### TODO 2: 세 로더 모듈이 YAML을 검증해 상수로 export — done
- 구현: `src/content/profile.ts:13` `profile` / `about.ts:13` `about` / `projects.ts:13` `projects` — `safeParse` 실패 시 `content/<file>.yaml 검증 실패:` + `z.prettifyError` throw
- 테스트: `src/content/__tests__/loaders.test.ts:10-37` 상수 로드 smoke; `:39` 실패 메시지에 파일 경로 포함
- AC: AC-2 — `name` 제거 후 로더 import 시 `Error: content/profile.yaml 검증 실패:` + `→ at name` 관측 후 복구
- 편차: none

### TODO 3: `content/profile.yaml` resume 실데이터 — done
- 구현: `content/profile.yaml:1-7` — name `Hwi Ahn`, resume Introduction 기반 영문 tagline, socials github+email만
- 테스트: `src/content/__tests__/loaders.test.ts:10` github/email only, 실제 URL
- AC: AC-1, AC-5 — 핸드오프 가짜 문자열 0건(`rg` 무매치); X/LinkedIn kind 0건; github=`https://github.com/byron1st`, email=`mailto:byron1st@icloud.com`
- 편차: none

### TODO 4: `content/about.yaml` 채움 — done
- 구현: `content/about.yaml` — intro 2문단, stack 6그룹, experience 4건(42dot/Bigpicture Lab/NavMine/Naver), education 3건(학사는 thesis/description/papers 없음), `works: []`
- 테스트: `src/content/__tests__/loaders.test.ts:21` length·bachelor optional 부재·empty works
- AC: AC-1, AC-3 — resume 추적 가능 회사/학교만; 학사·`works: []` 스키마 통과
- 편차: NavMine 기간은 overview 표(2018–2023)가 아니라 상세 섹션(2016.03 — 2018.05)을 사용

### TODO 5: `content/projects.yaml` personal-harness 1건 — done
- 구현: `content/projects.yaml:1-8` — intro + personal-harness(link·tech, year 생략)
- 테스트: `src/content/__tests__/loaders.test.ts:31` sole project name/link
- AC: AC-1 — resume Skills의 harness 링크와 동일 URL
- 편차: year 미기재(TODO 1 편차와 동일 이유)

### TODO 6: `src/lib/date.ts` 짧은/ISO 포맷 — done
- 구현: `src/lib/date.ts:36` `formatShortDate` / `:42` `formatIsoDate` — YYYY-MM-DD를 문자열 파싱만 하므로 Date/Intl/TZ 비의존
- 테스트: `src/lib/date.test.ts:6` `Jun 14`/`Apr 2`; `:19` `2026-04-02`
- AC: AC-4 — `formatShortDate("2026-06-14") === "Jun 14"`, `formatIsoDate("2026-04-02") === "2026-04-02"`; host TZ 경로를 코드가 타지 않음
- 편차: Intl 고정 locale 대신 순수 문자열 파싱 — 동일 목표(비결정성 제거)를 더 단순하게 충족

### TODO 7: 스키마·날짜 단위 테스트 — done
- 구현: `src/content/__tests__/schema.test.ts`, `src/content/__tests__/loaders.test.ts`, `src/lib/date.test.ts`
- 테스트: 위 파일 전체 — `pnpm test` 18 passed
- AC: AC-3, AC-4 — 필수/선택 필드 + 날짜 포맷 고정값 단언
- 편차: loaders smoke 테스트 추가(플랜 TODO 7 범위의 스키마/날짜 외, 실 YAML 정합 확인용) — Plan Divergence Added

## Red Flags
- **RF1** `content/about.yaml:43-70` - experience bullets는 resume 성과의 영문 요약/선별본. 의미 왜곡 여부는 저자 검수 대상.
- **RF2** `content/projects.yaml:3-8` - personal-harness에 year 없음. Step 6 UI가 year를 항상 렌더한다고 가정하면 조건부 렌더 필요.

## Open Questions
- **OQ1** `content/about.yaml:60` - NavMine 기간: resume overview 표와 상세 섹션이 불일치. 상세(2016.03 — 2018.05)를 채택. 저자 확인 권장.
- **OQ2** `src/content/schema.ts:54` - project `year` optional이 Step 6 렌더 계약과 맞는지. 필요 시 연도 데이터 추가 또는 UI 조건부 렌더.

## Plan Divergence
### Changed - details that differ from the plan
- 날짜 포맷터: 고정-locale Intl 대신 순수 YYYY-MM-DD 문자열 파싱(비결정성 제거 목표는 동일)
- project `year` optional(resume에 연도 없음 → 창작 금지)
### Added - implemented but absent from the plan
- `src/content/__tests__/loaders.test.ts` — 실 YAML 로드·AC-2 메시지 shape smoke
### Deferred - planned but not implemented (deferred)
- None

## Key Decisions
- 로더는 함수가 아니라 모듈 평가 시점 검증 상수 export(플랜 Key decision 준수).
- `works`는 스키마에 유지, 데이터는 `[]`(플랜 Key decision 준수).
- socials는 kind 유니온 배열; 확인된 github·email만 기재.

## Manual Verification
- [ ] `content/*.yaml` 영문 문장·bullet 선별이 저자 의도와 맞는지 resume과 대조 검수
- [ ] personal-harness 공개 연도를 알면 `projects.yaml`에 `year` 추가
