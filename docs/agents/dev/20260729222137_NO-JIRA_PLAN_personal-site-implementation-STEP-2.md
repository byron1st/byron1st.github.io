---
Application: byron1st.github.io
JiraTicket: NO-JIRA
PlanType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
Step: 2
---

# Step 2: 콘텐츠 스키마 + YAML 실데이터

Part of main plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation.md)

Report: [20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-2.md](./20260729222137_NO-JIRA_IMPL_personal-site-implementation-STEP-2.md)

## Depends On

Step 1 (툴체인 기반) — `@rollup/plugin-yaml`, `*.yaml` 앰비언트 타입, Vitest 설정이 준비돼 있어야 한다.

## Implements

FR-3(About)·FR-4(Projects)·FR-0(Layout이 쓰는 profile)의 **데이터 계층**. 화면은 Step 5·6이 만든다.

## 목표

`content/*.yaml`을 zod로 검증해 타입이 붙은 상수로 노출하는 계층을 만들고, **`docs/resume.md`의 실제 이력으로 그 YAML을 채운다.** 이 단계가 끝나면 사이트의 모든 구조화 콘텐츠가 확정되고, 잘못된 콘텐츠는 빌드를 통과할 수 없다.

## 범위

`src/content/schema.ts` — `profileSchema` / `aboutSchema` / `projectsSchema`와 `z.infer` 파생 타입. **타입을 손으로 중복 선언하지 않는다.**

`src/content/profile.ts` · `about.ts` · `projects.ts` — 각 YAML을 import → `safeParse` → 실패 시 **어느 파일이 왜 틀렸는지** 드러나는 메시지(`z.prettifyError` + 파일 경로)와 함께 throw, 성공 시 검증된 상수를 export.

`src/lib/date.ts` — `Jun 14` 형태의 짧은 포맷과 `2026-04-02` ISO 포맷. 로케일·타임존에 의존하지 않아야 한다(빌드 머신과 CI가 다른 TZ일 수 있다).

`content/profile.yaml` · `about.yaml` · `projects.yaml` — 실데이터.

### 콘텐츠 채우기 규칙

출처는 `docs/resume.md` 하나다. 핸드오프(`docs/design_handoff_personal_site/`)의 회사명·논문·프로젝트·태그라인은 **전부 가짜이므로 옮기지 않는다.**

- `profile.yaml`: 이름, 영문 태그라인(resume의 Introduction에서 도출), socials. **socials는 확인된 것만** — `github`(byron1st), `email`(byron1st@icloud.com). `x`·`linkedin`은 핸들을 모르므로 **기재하지 않는다**(자리만 만들어 두는 가짜 URL 금지).
- `about.yaml`:
  - `intro` — 영문 문단 배열. resume의 Introduction 기반.
  - `stack` — resume의 Skills 표를 그룹(예: Languages / Backend / Infra / Data)으로 재구성.
  - `experience` — 포티투닷, 빅픽처랩, 네브마인, 네이버(인턴). 각 항목의 bullets는 resume의 성과 항목에서 추린다.
  - `education` — 박사(KAIST, 논문 2편), 석사(KAIST·CMU 공동, 논문 1편), 학사(KAIST). **학사에는 thesis·description·papers가 없다** — 선택 필드 처리의 실제 근거가 되는 케이스다.
  - `works` — `[]` (빈 배열). 스키마에는 남기되 데이터가 없다.
- `projects.yaml`: `personal-harness` 1건 (`https://github.com/byron1st/personal-harness`). 나머지는 저자가 추후 추가한다.

UI 언어는 영어이므로 YAML 값도 영어로 쓴다(포스트 본문만 한국어).

## Non-goals

- About·Projects 화면 구현 (Step 5, 6)
- 포스트 관련 스키마·로딩 (Step 3 — 포스트 frontmatter 스키마는 `postMeta.ts` 소관이다)
- X·LinkedIn 핸들 추측, 사내 프로젝트를 임의로 공개 프로젝트 목록에 추가하는 것
- 프레젠테이션 컴포넌트 테스트

## Key decisions

- **각 로더 모듈은 함수가 아니라 검증된 상수를 export** 한다(`export const profile: Profile`). YAML은 정적 import라 지연 로딩할 이유가 없고, 모듈 평가 시점에 검증이 끝나는 편이 "빌드 타임 실패" 원칙에 맞다. SPEC의 "동사로 시작" 명명 규칙은 함수에 적용되는 것이므로 충돌하지 않는다.
- **`works`를 스키마에서 지우지 않고 optional로 남긴다.** 저자가 나중에 책·강의를 추가할 때 YAML만 채우면 되도록(= `src/` 변경 없이 콘텐츠를 편집한다는 원칙) 하기 위함이다. 데이터가 없으면 Step 5가 섹션 자체를 렌더하지 않는다.
- **`socials`는 `kind` 유니온 + `url`의 배열**로 둔다. 객체 맵(`{github: ..., x: ...}`)이 아니라 배열인 이유는 표시 순서가 데이터에 있어야 하고, 없는 소셜은 항목 자체가 없는 것이 자연스럽기 때문이다. 알 수 없는 `kind`는 스키마에서 즉시 빌드 실패로 잡힌다.
- **날짜 포맷터는 `Intl`을 쓰더라도 로케일·타임존을 명시 고정**한다. 빌드 머신에 따라 `Jun 14`가 달라지면 프리렌더 산출물이 비결정적이 된다.

## 다음 단계에 노출하는 seam

- 타입: `Profile`, `About`, `Projects`와 하위 엔트리 타입(experience 엔트리, education 엔트리, work 항목, project 항목)
- 상수: `profile`, `about`, `projects` (검증 완료 상태)
- `socials[].kind` 유니온: `github | x | linkedin | email` — Step 4의 아이콘 컴포넌트 매핑이 이 유니온을 exhaustive하게 다룬다
- `src/lib/date.ts`의 포맷터 2개 — Step 6(포스트 목록·상세)이 소비

## Acceptance Contract

| ID | Observable condition | Evidence |
| --- | --- | --- |
| AC-1 | `content/*.yaml`의 모든 값이 `docs/resume.md`로 추적 가능하고, 핸드오프의 가짜 회사명·논문·프로젝트·태그라인이 0건이다 | YAML 3개 파일 내용과 `docs/resume.md` 대조 |
| AC-2 | 필수 필드를 하나 지운 YAML로 빌드하면 **문제의 파일 경로가 포함된 메시지**와 함께 빌드가 실패한다 | 필드를 일시 제거한 상태의 빌드 실패 출력 |
| AC-3 | 선택 필드가 없는 케이스(학사 엔트리, `link` 없는 프로젝트, `tech` 빈 배열, `works: []`)가 스키마를 통과한다 | 해당 케이스를 다루는 단위 테스트 통과 |
| AC-4 | 날짜 포맷터가 실행 환경의 TZ·로케일과 무관하게 `Jun 14` / `2026-04-02`를 반환한다 | TZ를 바꿔 실행해도 동일 결과를 보이는 단위 테스트 |
| AC-5 | `socials`에 X·LinkedIn 항목이 없고, 있는 항목(github·email)은 실제로 도달 가능한 값이다 | `content/profile.yaml` 내용 |

## Authority Boundaries

- **Discretion**: 스키마 필드 이름과 중첩 구조, stack 그룹의 분류와 개수, intro 문단 수와 영문 문장 표현, bullets로 추릴 성과 항목의 선택, 날짜 포맷터 구현 방식, 테스트 케이스 배치.
- **Must-ask**: `works`를 스키마에서 제거하는 것, resume에 없는 내용을 창작해 채우는 것, X·LinkedIn URL을 추정해 넣는 것, 사내 프로젝트를 `projects.yaml`에 추가하는 것, 콘텐츠 편집에 `src/` 변경이 필요해지는 스키마 설계.
- **Stop conditions**: `docs/resume.md`만으로 특정 필드를 채울 수 없고 추측 없이는 진행이 불가능할 때 — 빈 값이나 가짜 값을 넣지 말고 해당 필드를 optional로 남길지 물어본다.
- **Loop budget**: 3

## TODOs

- [x] `src/content/schema.ts`에 profile·about·projects zod 스키마와 `z.infer` 파생 타입을 정의한다 — `works`·`thesis`·`description`·`papers`·`link`·`tech`는 선택 필드 (AC-3)
- [x] 세 로더 모듈이 YAML을 검증해 상수로 export 하게 만든다. 검증 실패는 파일 경로가 담긴 메시지로 즉시 throw (AC-2)
- [x] `content/profile.yaml`을 resume 기반 실데이터로 채운다 — socials는 github·email만 (AC-1, AC-5)
- [x] `content/about.yaml`을 채운다 — intro·stack·experience 4건·education 3건(학사는 선택 필드 없음)·`works: []` (AC-1, AC-3)
- [x] `content/projects.yaml`에 `personal-harness` 1건을 채운다 (AC-1)
- [x] `src/lib/date.ts`에 짧은 포맷·ISO 포맷 함수를 만든다 — 로케일·타임존 비의존 (AC-4)
- [x] 스키마 필수/선택 필드와 날짜 포맷터의 단위 테스트를 작성한다 (AC-3, AC-4)
