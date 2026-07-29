---
Application: byron1st.github.io
JiraTicket: NO-JIRA
PlanType: single-step
Timestamp: 20260729222137
Title: personal-site-implementation
Step: 5
---

# Step 5: Home + About

Part of main plan: [20260729222137_NO-JIRA_PLAN_personal-site-implementation.md](./20260729222137_NO-JIRA_PLAN_personal-site-implementation.md)

## Depends On

Step 2 (`profile`·`about` 상수와 타입), Step 4 (`Layout`·`routes.ts` 중첩 구조·아이콘). Step 6과 병렬 진행 가능하나 둘 다 `src/routes.ts`를 건드린다.

## Implements

FR-2 (프론트 페이지 `/`), FR-3 (About `/about`).

## 목표

Step 1의 홈 스텁을 실제 프론트 페이지로 교체하고, About 페이지를 구현한다. 이 과정에서 About·Projects·Posts가 공유할 시각 패턴 3개(`SectionLabel`·`TitleMetaRow`·`MarkerList`)를 컴포넌트로 추출한다.

## 범위

### 공용 컴포넌트

- `SectionLabel` — 12px uppercase 섹션 라벨. `hasBorder` prop으로 하단 보더를 켠다(부정형 `noBorder`를 쓰지 않는다). `<h2>`로 렌더한다.
- `TitleMetaRow` — "제목 좌 / 메타 우" 베이스라인 정렬 행. About의 경력·학력·저작물, Projects의 프로젝트 행, Posts의 포스트 행이 모두 이 형태다.
- `MarkerList` — 마커(`—` 또는 `·`) + 텍스트 그리드 리스트.

### `pages/Home.tsx` (FR-2)

래퍼 `pt-24 min-h-[52vh]`, 내부 `flex flex-col gap-6.5 items-start`. 이름 `text-3xl font-semibold tracking-tight`, 태그라인 `text-base text-muted max-w-lg`, 소셜 아이콘 행 `flex gap-4.5 items-center`(각 아이콘 `text-muted hover:text-fg`, `aria-label`은 `kind`).

**포스트 미리보기·프로젝트 카드를 넣지 않는다.** 페이지가 늘어나도 이 규칙은 유지된다.

### `pages/About.tsx` (FR-3)

래퍼 `pt-14`, 섹션 컨테이너 `flex flex-col gap-13`. 섹션 라벨은 `text-xs uppercase tracking-widest text-faint`이며 **Intro의 라벨만 하단 보더가 없다**(나머지는 `pb-1.5 border-b border-line`).

- **Intro** — 문단 배열, `text-base text-muted max-w-lg`, `gap-4`
- **Stack** — `grid grid-cols-[8rem_1fr] gap-4 items-baseline`. 좌 `text-xs text-faint`(그룹명), 우 `text-sm text-fg`(콤마 결합 항목)
- **Experience** — 섹션 `gap-6.5`, 엔트리 내부 `gap-2`. `TitleMetaRow`(회사 `font-semibold` / 기간 `text-xs text-faint whitespace-nowrap`) + 역할 `text-sm text-muted` + `MarkerList`(마커 `—`, `pt-1`, `gap-1`)
- **Education** — 섹션 `gap-6.5`, 엔트리 내부 `gap-1.5`. 같은 헤더 행 + 학위 `text-sm text-muted` + 논문주제 `text-sm text-fg` + 설명 `text-sm text-muted max-w-lg` + 발표 논문 `MarkerList`(마커 `·`, `text-xs text-muted`, `pt-1.5`, `gap-1`)
- **Works** — 섹션 `gap-4`, 항목 내부 `gap-0.5`. `TitleMetaRow`(제목 `text-sm text-fg` / 연도 `text-xs text-faint`) + 메타 `text-sm text-muted`

### 이 단계의 핵심 함정 — 조건부 렌더

빈 요소가 남아 `gap`이 생기면 안 된다. 컨테이너 자체를 렌더하지 않아야 한다.

- Education의 `thesis`/`description`/`papers`가 없는 **학사 엔트리**
- `experience[].bullets`가 빈 배열인 경우
- `works`가 빈 배열인 경우 → **Works 섹션 전체(라벨 포함)를 렌더하지 않는다**

### 위계 보정

폰트 크기 12단계를 5단계로 정규화하면서 사라진 구분을 색으로 되살린다: Works의 제목은 `text-fg` / 메타는 `text-muted`, 스택 그룹 라벨은 `text-faint` / 항목은 `text-fg`.

## Non-goals

- Projects·Posts·PostDetail (Step 6)
- 라우트별 `meta`/SEO (Step 7)
- 프레젠테이션 컴포넌트의 단위 테스트 — JSX를 재서술하는 저가치 테스트다. 조건부 렌더 검증은 AC의 산출물 확인으로 한다.
- 새로운 색·크기 토큰 추가

## Key decisions

- **수치는 전부 SPEC의 디자인 토큰 표에서 가져온다.** 핸드오프 README의 원본 px 값을 직접 쓰지 않는다 — 표가 이미 Tailwind 표준 스케일로 정규화해 뒀고, 그 표가 픽셀 판정의 유일한 기준이다.
- **arbitrary value는 grid template과 `min-h-[52vh]` 두 예외만.** 이 단계에서 등장하는 것은 `grid-cols-[8rem_1fr]`(stack)과 홈의 `min-h-[52vh]`뿐이다. 그 외 대괄호가 나오면 토큰 매핑을 잘못한 것이다.
- **세 컴포넌트를 지금 추출한다.** Step 6에서도 같은 패턴이 필요하고, 나중에 추출하면 Step 6이 About 페이지를 수정하게 된다(`pages/`끼리 공유는 금지, 공유가 필요하면 `components/`로 올린다).
- **조건부 렌더는 컨테이너 레벨에서 끊는다.** 자식만 조건부로 하고 부모 `<div className="flex flex-col gap-*">`을 남기면 빈 gap이 생긴다.

## 다음 단계에 노출하는 seam

- `SectionLabel`·`TitleMetaRow`·`MarkerList`의 props 시그니처 — Step 6이 그대로 쓴다
- `pages/Home.tsx`·`pages/About.tsx` 라우트 모듈 — Step 7이 여기에 `meta` export를 붙인다
- `routes.ts`에 추가된 `/about` — Step 7의 `getStaticPaths()` 대상에 자동 포함된다

## Acceptance Contract

| ID | Observable condition | Evidence |
| --- | --- | --- |
| AC-1 | `/about`의 프리렌더 HTML에 Intro·Stack·Experience·Education 4개 섹션만 존재하고, **Works 섹션 마크업(라벨 포함)이 아예 없다** | `dist/client/about/index.html` |
| AC-2 | 학사 엔트리에 thesis·description·papers 블록이 렌더되지 않으며, 그 엔트리의 앞뒤 간격이 다른 엔트리와 동일하다(빈 gap 없음) | 렌더된 Education 섹션 |
| AC-3 | Intro 섹션 라벨에만 하단 보더가 없고 나머지 3개에는 있다 | 렌더된 About |
| AC-4 | `src/` 전체에서 허용된 2가지(grid template, `min-h-[52vh]`) 외의 Tailwind 대괄호 표기가 0건이다 | `src/` 검색 결과 |
| AC-5 | 홈에 이름·태그라인·소셜 아이콘 외의 콘텐츠(포스트 미리보기·프로젝트 카드)가 없다 | `dist/client/index.html` |
| AC-6 | 소셜 아이콘 링크에 `aria-label`이 있고 외부 링크는 `target="_blank" rel="noreferrer"`, 이메일은 `mailto:`다 | 렌더된 홈의 링크 속성 |

## Authority Boundaries

- **Discretion**: 세 공용 컴포넌트의 props 이름과 분해 방식, JSX 구조, 섹션 렌더 순회 방식, 컴포넌트 파일 분리, 조건부 렌더 표현 방식.
- **Must-ask**: 홈에 콘텐츠를 추가하는 것, SPEC 토큰 표에 없는 수치를 쓰는 것, 새 색·크기 토큰을 `theme.css`에 추가하는 것, `@apply`나 `@layer components` 도입, `pages/`끼리 import 하는 것, Works 섹션을 스키마에서 제거하는 것.
- **Stop conditions**: SPEC 토큰 표에 대응 값이 없어 arbitrary value 없이는 디자인을 재현할 수 없는 지점이 나올 때 — 대괄호로 우회하지 말고 중단하고 물어본다.
- **Loop budget**: 3

## TODOs

- [ ] `SectionLabel`(`hasBorder`)·`TitleMetaRow`·`MarkerList`를 `components/`에 추출한다 (AC-3)
- [ ] `pages/Home.tsx`를 스텁에서 실제 프론트 페이지로 교체한다 — 이름·태그라인·소셜 아이콘 행만 (AC-5, AC-6)
- [ ] `pages/About.tsx`의 Intro·Stack 섹션을 구현하고 `/about` 라우트를 추가한다 (AC-3)
- [ ] Experience·Education 섹션을 구현한다 — 빈 `bullets`와 학사 엔트리의 선택 필드는 컨테이너째 렌더하지 않는다 (AC-2)
- [ ] Works 섹션을 구현하되 `works`가 비어 있으면 섹션 전체를 렌더하지 않는다 (AC-1)
- [ ] 위계 보정(제목 `text-fg`/메타 `text-muted`, 스택 라벨 `text-faint`)을 적용하고 `src/` 전체에서 허용 외 대괄호 표기가 없음을 확인한다 (AC-4)
