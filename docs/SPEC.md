# byron1st.github.io — Personal Site

백엔드·시스템 엔지니어 Hwi Ahn의 개인 홈페이지. 텍스트 우선의 미니멀 정적 사이트로, 프로필·이력·프로젝트를 YAML로, 블로그 포스트를 Markdown으로 관리하며 빌드 시 전 라우트를 정적 HTML로 프리렌더해 GitHub Pages에 배포한다.

디자인은 `design_handoff_personal_site/`의 핸드오프(README + `Personal Site.dc.html` 프로토타입)를 원본으로 하되, **모든 수치 값은 Tailwind 표준 스케일로 정규화**한다(아래 [디자인 토큰](#디자인-토큰) 참조).

---

## Tech Stack

| 영역 | 선택 | 비고 |
| --- | --- | --- |
| Language | TypeScript 6.0.3 (strict) | `noUncheckedIndexedAccess` 포함. typescript-eslint의 peer가 `<6.1.0`이므로 `~6.0.3`으로 고정 |
| Runtime | Node.js 24 LTS | 빌드 전용. 런타임 서버 없음. 로컬 24.18.0 |
| Build | Vite 8 | |
| UI | React 19 | |
| SSG | React Router 8 framework mode | `ssr: false` + `prerender`로 빌드 시 전 라우트 프리렌더 |
| Routing | React Router 8 (`@react-router/dev`) | `src/routes.ts` 선언형 (`index()` / `route()`) |
| Styling | Tailwind CSS v4 + `@tailwindcss/vite` | `@theme inline` 토큰, arbitrary value 금지 |
| Content (구조화) | YAML + `zod` | 빌드 시 스키마 검증, 실패 시 빌드 중단 |
| Content (포스트) | Markdown + `gray-matter` + `unified`/`remark`/`rehype` | 커스텀 Vite plugin |
| Fonts | Public Sans, Pretendard, JetBrains Mono (전부 self-host) | 외부 폰트 요청 0 |
| Unit test | Vitest | 콘텐츠 로직만 |
| E2E | Playwright | 스모크 1스펙 |
| Lint/Format | ESLint 10 (flat config) + typescript-eslint + Prettier | Prettier를 ESLint 규칙으로 실행 — lint/format 단일 파이프라인 |
| CI/CD | GitHub Actions | `ci.yml`(검증) + `deploy.yml`(배포) |
| Hosting | GitHub Pages (`byron1st.github.io`) | user site → base path `/` |

**의도적으로 제외한 것**: i18n 라이브러리(단일 언어), 상태 관리 라이브러리(전역 상태는 테마 하나), 코드 신택스 하이라이터(디자인이 단색 코드 블록), 이미지 파이프라인(에셋에 이미지 없음), `@tailwindcss/typography`(자체 타입 스케일과 충돌).

---

## Architecture

### Context

빌드 타임에 모든 것이 결정되고, 런타임에는 정적 파일만 존재한다. 서버·DB·API·인증이 전혀 없다.

```
   [ 저자 = 사이트 주인 ]
            │ git push (content/*.yaml, content/posts/*.md)
            ▼
   ┌────────────────────────────────┐
   │  GitHub repo byron1st.github.io│
   └────────────────────────────────┘
            │ push to main
            ▼
   ┌────────────────────────────────┐
   │  GitHub Actions                │
   │   typecheck → test → e2e       │
   │   → react-router build         │
   │   → dist/client/ (정적 HTML)    │
   └────────────────────────────────┘
            │ upload-pages-artifact
            ▼
   ┌────────────────────────────────┐
   │  GitHub Pages (CDN)            │
   └────────────────────────────────┘
            │ HTTPS
            ▼
   [ 방문자 브라우저 ]   [ RSS 리더 ]   [ 검색 크롤러 ]
```

**외부 의존 0**: 폰트·아이콘·분석 스크립트 모두 self-host 또는 인라인. 방문자 브라우저는 `byron1st.github.io` 이외의 어떤 호스트에도 요청하지 않는다.

### Runtime

런타임 프로세스는 없다. 아래는 **빌드 파이프라인**과 **브라우저 실행 모델**이다.

#### 빌드 파이프라인

```
content/profile.yaml  ──┐
content/about.yaml    ──┤  @rollup/plugin-yaml (Vite 내장 경유)
content/projects.yaml ──┘         │
                                  ▼
                          src/content/*.ts
                          zod.parse() ── 실패 시 빌드 중단
                                  │
content/posts/*.md ──► plugins/markdown.ts (Vite plugin)
                          gray-matter → frontmatter
                          unified(remark→rehype) → HTML string
                          export { meta, html }
                                  │
                                  ▼
                       src/content/posts.ts
                         · import.meta.glob(eager, import:'meta') → 목록
                         · import.meta.glob(lazy)                 → 본문
                                  │
                                  ▼
                       react-router build
                         react-router.config.ts의 prerender()가
                         getStaticPaths() + 포스트 slug로 경로 확장
                         라우트별 프리렌더 → dist/client/**/index.html
                                  │
                                  ▼
                       react-router.config.ts의 buildEnd()
                         → dist/client/rss.xml
                         → dist/client/sitemap.xml
                         → dist/client/robots.txt
```

#### 출력 구조

```
dist/client/
  index.html                       GET /
  about/index.html                 GET /about
  projects/index.html              GET /projects
  posts/index.html                 GET /posts
  posts/{slug}/index.html          GET /posts/{slug}      ← prerender()로 N개
  **/*.data                        라우트별 loader 데이터 (클라이언트 내비게이션용)
  __spa-fallback.html              ssr:false가 항상 생성 — 배포에서 사용하지 않음
  rss.xml
  sitemap.xml
  robots.txt
  assets/*.{js,css,woff2}
```

React Router의 프리렌더는 **기본적으로 중첩 디렉터리 + `index.html`** 로 출력한다. GitHub Pages가 디렉터리의 `index.html`을 그대로 서빙하므로 딥링크에 SPA 폴백(`404.html` 복사)이 **필요 없다**.

`ssr: false`는 프리렌더 대상과 무관하게 `__spa-fallback.html`을 항상 하나 생성한다. `/`를 프리렌더하므로 이 파일은 참조되지 않는다 — 삭제하지 않고 그대로 둔다(무해하며, 지우면 빌드 산출물과 배포물이 달라진다).

`buildDirectory: "dist"`로 설정한다(기본값은 `build`). 정적 산출물은 `dist/client/`에 놓이며 **배포 대상은 이 디렉터리**다.

#### 브라우저 실행 모델

1. 서버가 완성된 HTML을 반환 → 본문이 즉시 보인다(JS 없이도 읽힘).
2. `<head>` 인라인 스크립트가 **첫 페인트 이전에** `localStorage` → `prefers-color-scheme` 순으로 테마를 결정해 `<html data-theme>`을 설정한다(FOUC 방지). framework mode에서는 문서 셸을 `src/root.tsx`가 렌더하므로 이 스크립트도 거기에 인라인으로 들어간다.
3. React가 hydrate. 이후 내부 이동은 클라이언트 라우팅.
4. 포스트 본문은 라우트 `loader`가 lazy chunk를 import → 목록 페이지는 본문을 받지 않는다. 프리렌더 시 loader 결과는 `.data` 파일로 직렬화된다.

### Code / Module

```
byron1st.github.io/
├─ .github/workflows/
│  ├─ ci.yml                    typecheck · lint · unit · e2e
│  └─ deploy.yml                build · Pages 배포
├─ content/                     ← 저자가 편집하는 유일한 디렉터리
│  ├─ profile.yaml              이름 · 태그라인 · 이메일 · 소셜 링크
│  ├─ about.yaml                intro · stack · experience · education · works
│  ├─ projects.yaml             프로젝트 목록
│  └─ posts/
│     └─ YYYY-MM-DD-{slug}.md
├─ plugins/
│  └─ markdown.ts               .md → { meta, html } 모듈로 변환하는 Vite plugin
├─ scripts/
│  └─ feeds.ts                  buildEnd에서 호출: rss/sitemap/robots 생성
├─ src/
│  ├─ root.tsx                  문서 셸(<html>/<head>/<body>) + pre-paint 테마 스크립트
│  ├─ routes.ts                 @react-router/dev/routes — 라우트 트리의 유일한 정의처
│  ├─ content/                  ← 콘텐츠 로딩·검증·가공 (순수 함수 계층)
│  │  ├─ schema.ts              zod 스키마 3개 + 파생 타입
│  │  ├─ profile.ts             profile.yaml 로드 + 검증
│  │  ├─ about.ts               about.yaml 로드 + 검증
│  │  ├─ projects.ts            projects.yaml 로드 + 검증
│  │  ├─ posts.ts               glob · 정렬 · 연도 그룹핑 · loadPostBody(slug)
│  │  └─ __tests__/
│  ├─ components/               ← 재사용 시각 패턴 (프레젠테이션 전용)
│  │  ├─ Layout.tsx             셸: Header + <Outlet/> + Footer
│  │  ├─ Header.tsx
│  │  ├─ Footer.tsx
│  │  ├─ ThemeToggle.tsx
│  │  ├─ SectionLabel.tsx       12px uppercase 섹션 라벨 (+ 하단 보더 옵션)
│  │  ├─ TitleMetaRow.tsx       "제목 좌 / 메타 우" 베이스라인 정렬 행
│  │  ├─ MarkerList.tsx         마커(— 또는 ·) + 텍스트 그리드 리스트
│  │  ├─ SocialLinks.tsx        profile.socials → 아이콘 행
│  │  ├─ PostBody.tsx           마크다운 HTML 렌더러
│  │  └─ icons/                 GitHub · X · LinkedIn · Mail · Sun · Moon
│  ├─ pages/                    ← 라우트별 화면 (콘텐츠 조립만)
│  │  ├─ Home.tsx
│  │  ├─ About.tsx
│  │  ├─ Projects.tsx
│  │  ├─ Posts.tsx
│  │  └─ PostDetail.tsx
│  ├─ hooks/
│  │  └─ useTheme.ts            data-theme 읽기/쓰기 + localStorage 동기화
│  ├─ lib/
│  │  ├─ date.ts                "Jun 14" / "2026-04-02" 포맷터
│  │  ├─ seo.ts                 meta descriptor 빌더 (title/description/og/canonical)
│  │  └─ site.ts                SITE_URL, SITE_TITLE 등 상수
│  └─ styles/
│     ├─ theme.css              CSS 변수 + @theme inline + @custom-variant dark
│     ├─ fonts.css              @font-face (self-host)
│     └─ post-body.css          .post-body 스코프 규칙 (마크다운 산출 HTML용)
├─ e2e/
│  └─ smoke.spec.ts
├─ react-router.config.ts       appDirectory · buildDirectory · ssr:false · prerender · buildEnd
├─ vite.config.ts               reactRouter() · tailwindcss() · yaml() · markdown()
├─ playwright.config.ts
├─ eslint.config.ts             flat config — lint + format의 유일한 진입점
├─ .prettierrc.json             포맷 규칙 (eslint-plugin-prettier가 읽음)
├─ tsconfig.json
└─ package.json
```

#### 레이어 규칙 (의존 방향은 항상 아래로)

```
pages/         라우트 화면. content/에서 데이터를 받아 components/로 조립.
   │           자체 스타일은 페이지 고유 레이아웃(gap, padding)에 한정.
   ▼
components/    시각 패턴. props만 받는 순수 프레젠테이션.
   │           content/를 import 하지 않는다 (Layout의 profile은 예외적으로 허용).
   ▼
content/       YAML/Markdown 로딩 · 검증 · 가공. React를 import 하지 않는다.
   ▼
lib/           날짜 포맷 등 의존성 없는 순수 유틸.
```

- `content/`가 React를 모르므로 그대로 Vitest에서 테스트된다. **테스트 가능한 로직은 전부 이 계층에 있다.**
- `pages/`는 서로를 import 하지 않는다. 공유가 필요하면 `components/`로 올린다.
- 라우트 정의는 `routes.ts` 한 곳에만 존재한다. 페이지 컴포넌트는 자기 경로를 모른다.

---

## Conventions

### 스타일링

- **arbitrary value 금지.** `text-[13.5px]`, `p-[26px]`, `text-[var(--muted)]` 같은 대괄호 표기를 쓰지 않는다. 허용되는 예외는 **Tailwind에 대응 스케일이 아예 없는 두 가지**뿐이다:
  1. CSS grid template — `grid-cols-[8rem_1fr]`. 값은 반드시 표준 스케일(rem)에서 가져온다.
  2. viewport 단위 — `min-h-[50vh]`. Tailwind의 `min-h-*`에 임의 vh가 없다.

  이 두 가지 외에 대괄호가 등장하면 리뷰에서 차단한다.
- 색은 `@theme inline`에 등록된 시맨틱 토큰으로만 참조한다: `text-fg` `text-muted` `text-faint` `bg-bg` `bg-code-bg` `border-line` `text-accent`.
- 다크 모드는 `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`로 정의하되, **색 토큰이 이미 테마별로 값을 바꾸므로 `dark:` 접두사는 거의 등장하지 않는다.** `dark:`는 아이콘 표시 전환처럼 색이 아닌 속성에만 쓴다.
- 반복 시각 패턴은 CSS 클래스(`@apply`)가 아니라 **React 컴포넌트**로 추출한다. `@layer components`는 사용하지 않는다. 단, 마크다운이 생성한 HTML은 클래스를 붙일 수 없으므로 `.post-body` 스코프 CSS만 예외로 허용한다(아래 참조).
- 애니메이션·트랜지션·그림자를 넣지 않는다. hover 상태 변화만 존재한다.

### 디자인 토큰

핸드오프의 값 → Tailwind 표준 매핑. **이 표가 픽셀 판정의 기준이다.**

**색** — 값은 핸드오프 그대로, 이름만 등록

```css
/* src/styles/theme.css */
:root {
  --site-bg:      oklch(0.985 0.003 90);
  --site-fg:      oklch(0.24 0.01 90);
  --site-muted:   oklch(0.55 0.012 90);
  --site-faint:   oklch(0.72 0.01 90);
  --site-line:    oklch(0.9 0.006 90);
  --site-code-bg: oklch(0.955 0.005 90);
  --site-accent:  oklch(0.55 0.13 252);
}
[data-theme="dark"] {
  --site-bg:      oklch(0.185 0.008 265);
  --site-fg:      oklch(0.92 0.006 265);
  --site-muted:   oklch(0.66 0.012 265);
  --site-faint:   oklch(0.48 0.012 265);
  --site-line:    oklch(0.29 0.01 265);
  --site-code-bg: oklch(0.225 0.01 265);
  --site-accent:  oklch(0.74 0.11 252);
}

@theme inline {
  --color-bg:      var(--site-bg);
  --color-fg:      var(--site-fg);
  --color-muted:   var(--site-muted);
  --color-faint:   var(--site-faint);
  --color-line:    var(--site-line);
  --color-code-bg: var(--site-code-bg);
  --color-accent:  var(--site-accent);
}
```

**폰트 크기** — 12단계 → 5단계로 정규화 (nearest step, 동점은 작은 쪽)

| 핸드오프 | 용도 | Tailwind | 실제 |
| --- | --- | --- | --- |
| 30px | 프론트 이름 | `text-3xl` | 30px |
| 24px | 포스트 제목 | `text-2xl` | 24px |
| 16 / 15.5 / 15px | 태그라인 · 포스트 본문 · 기본 | `text-base` | 16px |
| 14.5 / 14 / 13.5px | 저작물 제목 · 불릿 · 네비 | `text-sm` | 14px |
| 13 / 12.5 / 12px | 연도 · 기간 · 섹션 라벨 · 푸터 | `text-xs` | 12px |

> **위계 보정**: About의 "Books & courses"에서 제목(14.5px)과 메타(13.5px)가 모두 `text-sm`으로 합쳐진다. 크기로 주던 구분이 사라지므로 **제목은 `text-fg`, 메타는 `text-muted`** 로 색 대비를 통해 위계를 유지한다. 같은 이유로 스택 그룹 라벨(13px→`text-xs`)은 `text-faint`, 항목(14px→`text-sm`)은 `text-fg`를 유지한다.

**스페이싱** — 규칙: **2px 그리드로 반올림, 동점은 작은 쪽.**

Tailwind v4의 동적 스페이싱 스케일(`--spacing: 0.25rem`)은 `gap-6.5`, `pb-30` 같은 0.5 단위 배수까지 실제 유틸리티를 생성한다. 따라서 짝수 px는 전부 무손실로 표현되고, 드리프트가 생기는 것은 홀수 값 4개뿐이다.

| 핸드오프 | Tailwind | | | 핸드오프 | Tailwind | |
| --- | --- | --- | --- | --- | --- | --- |
| 2px | `0.5` | ✅ | | 16px | `4` | ✅ |
| **3px** | `0.5` (2px) | ⚠︎ | | 18px | `4.5` | ✅ |
| 4px | `1` | ✅ | | 20px | `5` | ✅ |
| **5px** | `1` (4px) | ⚠︎ | | 24px | `6` | ✅ |
| 6px | `1.5` | ✅ | | 26px | `6.5` | ✅ |
| **7px** | `1.5` (6px) | ⚠︎ | | 28px | `7` | ✅ |
| 8px | `2` | ✅ | | 30px | `7.5` | ✅ |
| **9px** | `2` (8px) | ⚠︎ | | 44px | `11` | ✅ |
| 10px | `2.5` | ✅ | | 52px | `13` | ✅ |
| **11px** | `2.5` (10px) | ⚠︎ | | 56px | `14` | ✅ |
| 12px | `3` | ✅ | | 60px | `15` | ✅ |
| 14px | `3.5` | ✅ | | 80px | `20` | ✅ |
| **15px** | `3.5` (14px) | ⚠︎ | | 96px | `24` | ✅ |
| | | | | 120px | `30` | ✅ |

1px 값은 `px` 유틸리티를 쓴다 (`border`, `py-px`, `w-px`).

**그 외**

| 항목 | 핸드오프 | Tailwind |
| --- | --- | --- |
| 본문 line-height | 1.65 | `leading-relaxed` (1.625) |
| 포스트 문단 line-height | 1.75 | `leading-relaxed` (1.625) |
| 코드 line-height | 1.6 | `leading-relaxed` (1.625) |
| 프론트 이름 line-height | 1.15 | `text-3xl` 기본값 (1.2) |
| 포스트 제목 line-height | 1.3 | `text-2xl` 기본값 (1.333) |
| 헤딩 tracking | -0.02em / -0.01em | `tracking-tight` (-0.025em) |
| 섹션 라벨 tracking | 0.12em | `tracking-widest` (0.1em) |
| 칩 radius | 2px | `rounded-xs` (2px) |
| 코드 블록 radius | 3px | `rounded-xs` (2px) |
| 콘텐츠 컬럼 max-width | 660px | `max-w-2xl` (672px) |
| 본문 measure | 33em / 30em | `max-w-lg` (512px) |
| 포스트 제목 measure | 26em | `max-w-md` (448px) |
| 포스트 본문 measure | 34em | `max-w-prose` (65ch) |
| 스택 라벨 컬럼 | 130px | `grid-cols-[8rem_1fr]` (128px) |
| 포스트 연도 컬럼 | 64px | `grid-cols-[4rem_1fr]` (64px) |
| 불릿 마커 컬럼 | 14px | `grid-cols-[0.875rem_1fr]` (14px) |
| 아이콘 (GitHub) | 19px | `size-5` (20px) |
| 아이콘 (LinkedIn/메일/푸터) | 18 / 16 / 14px | `size-4.5` / `size-4` / `size-3.5` |
| 헤더 구분선 | 1px × 12px | `w-px h-3` |
| 인용 좌측 보더 | 2px | `border-l-2` |
| 보더 (그 외 전부) | 1px | `border` / `border-t` / `border-b` |

**타이포그래피 스택**

```css
@theme inline {
  --font-sans: "Public Sans", "Pretendard", "Helvetica Neue", Helvetica, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

Public Sans에 한글 글리프가 없으므로 한글은 자연스럽게 Pretendard로 폴백된다. 세 폰트 모두 self-host하며 Pretendard는 `unicode-range`로 한글 영역만 로드한다. weight는 400/600만 사용한다.

### 콘텐츠

- `content/` 아래 파일만이 저자가 편집하는 대상이다. 콘텐츠 수정에 `src/` 변경이 필요하면 그것은 스키마 설계 실패로 본다.
- 모든 YAML은 `zod` 스키마를 통과해야 한다. 검증 실패는 **빌드 실패**다 — 잘못된 콘텐츠가 배포되지 않는다.
- 스키마는 `src/content/schema.ts` 한 곳에 모으고, 타입은 `z.infer`로 파생시킨다. 타입을 손으로 중복 선언하지 않는다.
- 포스트 파일명은 `YYYY-MM-DD-{slug}.md`. 날짜와 slug의 단일 출처는 파일명이며 frontmatter에 중복 기재하지 않는다.

### 에러 처리

런타임 에러 경로가 사실상 없다(네트워크 호출·사용자 입력·인증이 없음). 따라서:

- **빌드 타임 실패는 즉시 throw** 한다. 스키마 위반, 포스트 frontmatter 누락, 알 수 없는 social `kind` 등은 명확한 메시지와 함께 빌드를 중단시킨다.

  ```ts
  // 좋음 — 어느 파일이 왜 틀렸는지 즉시 드러남
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`content/profile.yaml 검증 실패:\n${z.prettifyError(parsed.error)}`);
  }
  ```

- **런타임 폴백을 만들지 않는다.** `post?.title ?? "제목 없음"` 같은 방어 코드는 빌드 타임 검증과 중복이며, 실제로는 버그를 숨긴다.
- 존재하지 않는 포스트 경로는 프리렌더되지 않으므로 GitHub Pages의 기본 404가 처리한다. 커스텀 404 페이지는 만들지 않는다.

### 로깅

브라우저 콘솔 로그를 남기지 않는다. 빌드 스크립트(`scripts/feeds.ts`)만 `console.log`로 산출물 요약(생성된 항목 수)을 출력한다.

### 접근성

- 네비게이션·포스트 제목은 `<div onClick>`이 아니라 `<Link>` / `<a>`로 구현한다(프로토타입은 프로토타입일 뿐이다).
- 아이콘 전용 링크·버튼에는 `aria-label`을 붙인다.
- 시맨틱 태그를 사용한다: `<header>` `<nav>` `<main>` `<footer>` `<article>`, 포스트 제목은 `<h1>`, 섹션 라벨은 `<h2>`.
- 포커스 링을 제거하지 않는다. 링크 hover 색(`--accent`)은 focus-visible에도 동일하게 적용한다.
- 외부 링크는 `target="_blank" rel="noreferrer"`, 이메일은 `mailto:`.

### 명명

- 컴포넌트 파일·export는 `PascalCase`, 훅은 `useXxx`, 그 외 모듈은 `camelCase`.
- `content/` 계층의 함수는 동사로 시작한다(`loadPostBody`, `groupPostsByYear`).
- boolean prop은 긍정형으로(`hasBorder`, `isExternal`). `noBorder` 같은 부정형을 쓰지 않는다.

### 린트 / 포맷

`eslint.config.ts`(flat config) **하나가 lint와 format의 단일 진입점**이다. Prettier CLI를 별도로 실행하지 않으므로 "lint는 통과했는데 format이 깨진" 상태가 존재할 수 없다.

- 구성 순서: `@eslint/js` recommended → `typescript-eslint` **type-checked** 프리셋(`projectService: true`) → `eslint-plugin-react-hooks` → `eslint-plugin-prettier/recommended`. Prettier 설정은 **항상 마지막**에 둬서 스타일 계열 규칙 충돌을 끈다.
- 포맷 위반은 `prettier/prettier` 규칙을 통해 **error**로 보고된다. `lint` 스크립트가 곧 format 검사이고, `lint:fix`가 곧 formatter다.
- CI의 `lint` 스텝은 `eslint . --max-warnings 0` — 경고를 남겨두지 않는다.
- type-checked 규칙을 쓰므로 ESLint 실행에 타입 정보가 필요하다. 설정·테스트 파일도 `tsconfig`가 포함해야 한다.

---

## Functional Requirements

### FR-0: 전역 셸 (Layout)

모든 라우트를 감싸는 헤더 + 콘텐츠 컬럼 + 푸터.

- Input: `content/profile.yaml` (이름, 소셜 링크), 현재 라우트
- Output: `<header>` / `<main><Outlet/></main>` / `<footer>`
- Business rules:
  - 콘텐츠 컬럼: `max-w-2xl mx-auto pt-11 px-7 pb-30` (44 / 28 / 120px)
  - 헤더: `flex justify-between items-baseline gap-6 pb-3.5 border-b border-line`
    - 좌: 이름(`font-semibold tracking-tight`, `/`로 링크) + 네비 `about` / `projects` / `posts` (`text-sm text-muted gap-3.5`)
    - 네비 링크는 rest 상태에서 `border-b border-transparent`, hover 시 `text-fg border-line` — **텍스트가 밀리지 않도록 보더는 항상 존재하고 색만 바뀐다.**
    - 우: 테마 토글 버튼 하나 (`text-faint hover:text-fg`)
  - 푸터: `pt-20 mt-15 border-t border-line flex justify-between text-xs text-faint`
    - 좌: `© {빌드 연도} {profile.name}`
    - 우: 소셜 아이콘 4개 (`gap-3.5`, `size-4`, `text-faint hover:text-fg`)
  - 라우트 이동 시 스크롤을 맨 위로 되돌린다.
- Edge cases:
  - 언어 토글은 존재하지 않는다(단일 언어). 헤더 우측의 구분선도 함께 제거된다 — 버튼이 하나뿐이므로.

### FR-1: 테마 (light / dark)

- Input: `localStorage["theme"]`, `prefers-color-scheme`, 토글 클릭
- Output: `<html data-theme="light|dark">`
- Business rules:
  - 초기 결정 순서: `localStorage` 저장값 → 없으면 `prefers-color-scheme` → 없으면 `light`.
  - 이 결정은 `src/root.tsx`의 `<head>`에 놓인 **인라인 스크립트**가 첫 페인트 전에 수행한다. 번들에 의존하면 화면이 번쩍인다. framework mode에는 `index.html`이 없으므로 `<script dangerouslySetInnerHTML>`로 삽입한다.
  - 토글 시 `data-theme` 갱신 + `localStorage` 저장.
  - 아이콘: light일 때 달, dark일 때 해. **`dark:` 유틸리티로 CSS만으로 전환한다** (`className="block dark:hidden"` / `"hidden dark:block"`). JS 상태로 분기하면 프리렌더 HTML과 hydration 결과가 어긋난다.
- Edge cases:
  - `localStorage` 접근이 차단된 환경(사파리 프라이빗 등)에서 인라인 스크립트가 throw하면 안 된다 — `try/catch`로 감싸고 실패 시 `prefers-color-scheme`로 진행한다.
  - 프리렌더 시점에는 `document`가 없다. `useTheme`은 `typeof document === "undefined"` 가드를 두고 SSG에서는 `light`를 반환한다.

### FR-2: 프론트 페이지 (`/`)

의도적으로 극단적 미니멀. 이름 + 한 줄 + 링크가 전부다.

- Input: `profile.yaml` → `name`, `tagline`, `socials[]`
- Output: 정적 HTML
- Business rules:
  - 래퍼 `pt-24 min-h-[52vh]`, 내부 `flex flex-col gap-6.5 items-start`
  - 이름 `text-3xl font-semibold tracking-tight`
  - 태그라인 `text-base text-muted max-w-lg`
  - 소셜 아이콘 행 `flex gap-4.5 items-center`, 각 아이콘 `text-muted hover:text-fg`, `aria-label`은 `kind` 값
  - **포스트 미리보기·프로젝트 카드를 넣지 않는다.** 페이지가 늘어나도 이 규칙은 유지한다.

### FR-3: About (`/about`)

- Input: `about.yaml`
- Output: 5개 섹션 (`flex flex-col gap-13`, 래퍼 `pt-14`)
- Business rules:
  - 섹션 라벨: `text-xs uppercase tracking-widest text-faint`. **Intro 섹션의 라벨만 하단 보더가 없고**, 나머지 4개는 `pb-1.5 border-b border-line`.
  - **Intro** — 문단 배열, `text-base text-muted max-w-lg`, `gap-4`
  - **Stack** — `grid grid-cols-[8rem_1fr] gap-4 items-baseline` 행들. 좌 `text-xs text-faint`(그룹명), 우 `text-sm text-fg`(콤마 결합된 항목)
  - **Experience** — 섹션 `gap-6.5`, 엔트리 내부 `gap-2`. 엔트리 = `TitleMetaRow`(회사 `font-semibold` / 기간 `text-xs text-faint whitespace-nowrap`) + 역할 `text-sm text-muted` + `MarkerList`(마커 `—`, `pt-1`, `gap-1`)
  - **Education** — 섹션 `gap-6.5`, 엔트리 내부 `gap-1.5`. Experience와 동일한 헤더 행 + 학위 `text-sm text-muted` + 논문주제 `text-sm text-fg` + 설명 `text-sm text-muted max-w-lg` + 발표 논문 `MarkerList`(마커 `·`, `text-xs text-muted`, `pt-1.5`, `gap-1`)
  - **Works** — 섹션 `gap-4`, 항목 내부 `gap-0.5`. 항목당 `TitleMetaRow`(제목 `text-sm text-fg` / 연도 `text-xs text-faint`) + 메타 `text-sm text-muted`
- Edge cases:
  - Education의 `thesis` / `description` / `papers`는 **선택 필드**다. 학사 항목처럼 값이 없으면 해당 블록을 렌더하지 않는다(빈 요소를 남겨 `gap`이 생기면 안 된다).
  - `experience[].bullets`가 빈 배열이면 불릿 컨테이너 자체를 렌더하지 않는다.

### FR-4: Projects (`/projects`)

- Input: `projects.yaml`
- Output: 인트로 + 프로젝트 행 목록
- Business rules:
  - 래퍼 `pt-14 flex flex-col gap-7.5`, 헤더 블록 `gap-3.5`, 인트로 `text-base text-muted max-w-lg`
  - 각 행 `py-5 border-t border-line flex flex-col gap-1.5` — **상단 보더만** 사용한다. 마지막 항목 아래에 선이 생기면 안 된다.
  - 프로젝트명은 `link`로 가는 외부 링크, `font-semibold`, rest 상태에서 밑줄 없음, hover 시 `text-accent`
  - 연도 `text-xs text-faint whitespace-nowrap`, 설명 `text-sm text-muted max-w-lg`
  - 기술 칩: `flex flex-wrap gap-2 pt-1`, 각 칩 `text-xs text-faint border border-line rounded-xs px-1.5 py-px`
- Edge cases:
  - `tech`가 빈 배열이면 칩 컨테이너를 렌더하지 않는다.
  - `link`가 없는 프로젝트는 링크가 아닌 `<span>`으로 렌더한다.

### FR-5: Posts 인덱스 (`/posts`)

- Input: `content/posts/*.md`의 frontmatter + 파일명
- Output: 연도별 그룹, 제목만 나열
- Business rules:
  - 래퍼 `pt-14 flex flex-col gap-11`
  - 그룹 = `grid grid-cols-[4rem_1fr] gap-5 items-start`. 좌 = 연도 `text-xs text-faint pt-0.5`, 우 = 포스트 행들 `flex flex-col gap-2`
  - 각 행 = `TitleMetaRow` 형태의 `<Link>`: 제목 `text-base text-fg`, 날짜 `text-xs text-faint whitespace-nowrap`(`Jun 14`). **행 전체가 클릭 영역**이고 hover 시 제목이 `text-accent`.
  - 정렬: 연도 내림차순, 그룹 내 날짜 내림차순. 같은 날짜면 slug 오름차순으로 **안정 정렬**한다.
  - 요약·태그를 표시하지 않는다.
- Edge cases:
  - `draft: true` 포스트는 목록·프리렌더·RSS·sitemap 모두에서 제외한다.
  - 포스트가 0개면 그룹을 렌더하지 않는다(빈 상태 문구도 없다 — 섹션 라벨만 남는다).

### FR-6: Post 상세 (`/posts/{slug}`)

- Input: 라우트 파라미터 `slug` → `loadPostBody(slug)`
- Output: 프리렌더된 정적 HTML (본문 포함)
- Business rules:
  - 래퍼 `pt-14 flex flex-col gap-7`
  - 뒤로 링크 `← back to posts`, `text-xs text-faint hover:text-fg`
  - 제목 `<h1> text-2xl font-semibold tracking-tight max-w-md`
  - 날짜 `text-xs text-faint`, ISO 포맷(`2026-04-02`). **태그를 표시하지 않는다.**
  - 본문 컨테이너 `.post-body max-w-prose`
  - `react-router.config.ts`의 `prerender()`가 `getStaticPaths()`(정적 라우트 전부) + draft가 아닌 전 포스트의 `/posts/{slug}`를 반환해 각각 `dist/client/posts/{slug}/index.html`로 생성된다.
- Edge cases:
  - 본문이 비어 있는 포스트는 빌드 시 에러로 처리한다.

### FR-7: Markdown 파이프라인

- Input: `content/posts/*.md`
- Output: `{ meta, html }`을 export 하는 JS 모듈
- Business rules:
  - `plugins/markdown.ts`가 `.md` 파일을 `transform`한다: `gray-matter`로 frontmatter 분리 → `unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify)`로 본문을 HTML 문자열화.
  - frontmatter 스키마:
    ```yaml
    ---
    title: 결정론적 시뮬레이션 테스트, 맨손으로 만들기
    summary: 분산 시스템 버그를 재현 가능하게 만드는 시뮬레이터를 처음부터 만드는 법.
    draft: false          # 선택, 기본 false
    ---
    ```
    `date`와 `slug`는 파일명 `YYYY-MM-DD-{slug}.md`에서 파생한다.
  - 목록용 메타는 `import.meta.glob(..., { eager: true, import: "meta" })`로 즉시 로드, 본문은 lazy glob으로 라우트 `loader`에서만 가져온다 → 인덱스 페이지 번들에 본문이 들어가지 않는다.
  - **신택스 하이라이팅을 넣지 않는다.** 디자인의 코드 블록은 단색(`--fg`)이다.
  - 본문 HTML은 `PostBody`가 `dangerouslySetInnerHTML`로 렌더하고, 스타일은 `src/styles/post-body.css`의 `.post-body` 스코프 규칙이 담당한다. 이 파일은 매직 넘버 없이 테마 변수만 참조한다:
    ```css
    .post-body > * + *   { margin-top: calc(var(--spacing) * 5); }
    .post-body p         { font-size: var(--text-base); line-height: var(--leading-relaxed); }
    .post-body h2,
    .post-body h3        { font-size: var(--text-base); font-weight: 600; padding-top: calc(var(--spacing) * 3); }
    .post-body pre       { background: var(--color-code-bg); border: 1px solid var(--color-line);
                           border-radius: var(--radius-xs); padding: calc(var(--spacing) * 3.5) calc(var(--spacing) * 4);
                           overflow-x: auto; font-family: var(--font-mono); font-size: var(--text-xs);
                           line-height: var(--leading-relaxed); }
    .post-body blockquote { border-left: 2px solid var(--color-line); padding-left: calc(var(--spacing) * 3.5);
                            color: var(--color-muted); }
    ```
  - 마크다운 입력은 저자 본인이 작성하므로 신뢰 경계 안이다. HTML sanitize를 넣지 않는다.
- Edge cases:
  - frontmatter 필수 필드 누락 → 빌드 실패(파일 경로를 메시지에 포함).
  - 파일명이 `YYYY-MM-DD-{slug}.md` 패턴에 맞지 않으면 빌드 실패.

### FR-8: SEO 메타 / 피드 / 사이트맵

- Input: 라우트별 데이터, 프리렌더 경로 목록
- Output: `<head>` 태그, `dist/client/rss.xml`, `dist/client/sitemap.xml`, `dist/client/robots.txt`
- Business rules:
  - 각 라우트 모듈의 **`meta` export**가 `title`, `description`, `og:title`, `og:description`, `og:type`, `og:url`, `twitter:card`를 반환하고, canonical은 같은 배열에 `{ tagName: "link", rel: "canonical", href }` descriptor로 넣는다. `src/root.tsx`의 `<Meta />`가 이들을 `<head>`에 렌더한다.
  - 반복되는 descriptor 조립은 `src/lib/seo.ts`의 순수 빌더 함수 하나로 모은다 — 컴포넌트가 아니다. `meta`는 React 밖에서 실행되므로 JSX로 만들 수 없다.
  - 제목 규칙: 홈은 `{name}`, 그 외는 `{페이지 제목} — {name}`.
  - `og:image`는 넣지 않는다(디자인에 이미지 에셋이 없다).
  - `react-router.config.ts`의 `buildEnd()`에서 `scripts/feeds.ts`를 호출해 세 파일을 생성한다. 포스트 메타를 재사용하므로 목록의 단일 출처가 유지된다. 출력 경로는 `reactRouterConfig.buildDirectory`에서 얻는다.
  - RSS는 최신 20건, `<description>`에 `summary`를 넣는다(본문 전문은 넣지 않는다).
  - sitemap은 프리렌더된 전 경로를 포함한다 — `prerender()`와 **같은 소스**에서 생성해 누락이 구조적으로 불가능하게 한다.
- Edge cases:
  - draft 포스트는 세 산출물 모두에서 제외된다.

### FR-9: 빌드 & 배포

- Input: `main` 브랜치 push
- Output: GitHub Pages 배포
- Business rules:
  - `ci.yml` — PR과 push에서 `typecheck` → `lint` → `test`(Vitest) → `e2e`(Playwright) 실행. `lint`가 Prettier 포맷 검사를 겸한다(별도 format 스텝 없음).
  - 두 워크플로 모두 `setup-node`의 `node-version: 24`로 런타임을 고정한다 — 로컬(24.18.0)과 CI가 같은 메이저를 쓴다.
  - `deploy.yml` — `main` push에서 build 후 **`dist/client/`** 를 `actions/upload-pages-artifact`로 올리고 `actions/deploy-pages`로 배포. `dist/` 전체를 올리면 서버 빌드 산출물까지 배포되므로 반드시 `client` 하위를 지정한다.
  - 권한: `contents: read`, `pages: write`, `id-token: write`. `concurrency: { group: pages, cancel-in-progress: false }`.
  - user site이므로 React Router `basename`과 Vite `base` 모두 기본값 `/`를 그대로 둔다.
- Edge cases:
  - GitHub Pages 소스는 저장소 설정에서 "GitHub Actions"로 지정해야 한다(브랜치 배포 아님). 최초 1회 수동 설정.

---

## Quality Attributes

우선순위는 **① Readability ② Structural design**이며, 나머지는 이 둘을 해치지 않는 선에서 만족시킨다.

### Readability (최우선)

- JSX의 className만 읽고도 그 요소의 **역할**을 알 수 있어야 한다. `text-muted`는 되고 `text-[oklch(0.55_0.012_90)]`은 안 된다.
- arbitrary value 0개(grid template 예외). 위반은 리뷰에서 차단한다.
- 한 컴포넌트 파일은 100줄을 넘지 않는 것을 목표로 한다. 넘으면 시각 패턴 추출 신호로 본다.
- 주석은 "왜"만 적는다. `// 상단 보더만 — 마지막 항목 아래 선이 생기지 않도록` 같은 디자인 의도가 대상이며, 코드가 하는 일을 다시 설명하지 않는다.

### Structural design (최우선)

- 의존 방향이 `pages → components → content → lib` 단방향이며 역방향 import가 없다.
- **단일 출처**: 라우트는 `routes.ts`, 스키마는 `schema.ts`, 색·크기는 `theme.css`, 포스트 목록은 `posts.ts`. 같은 사실이 두 곳에 적히지 않는다.
- 새 "about me" 페이지(예: `/music`) 추가 비용이 **콘텐츠 파일 1개 + 스키마 1개 + 페이지 1개 + 라우트 1줄 + 네비 1줄**이어야 한다. 그 이상이면 구조가 잘못된 것이다. `prerender`가 `getStaticPaths()`를 그대로 펼치므로 정적 라우트는 프리렌더 목록에 손으로 추가할 필요가 없다.
- `content/`는 React를 import 하지 않는다 — 이 계층이 UI와 분리되어 있다는 것이 컴파일러로 강제된다.

### Performance

- 목표: 홈 기준 초기 HTML < 15KB, JS < 60KB (gzip). 이미지·폰트 제외.
- **이 예산은 미검증이다.** React Router framework mode의 런타임(라우터 + 데이터 레이어 + hydration)은 `vite-react-ssg`의 최소 구성보다 무겁다. 첫 빌드 직후 실측하고, 60KB를 넘으면 예산을 조정하거나 `ssr: false` SPA 폴백 경로를 줄이는 쪽으로 대응한다 — 이 수치 때문에 SSG 선택을 되돌리지는 않는다.
- 포스트 본문은 lazy chunk — 인덱스 페이지가 본문을 받지 않는다.
- 폰트는 self-host + `font-display: swap`, Pretendard는 한글 `unicode-range`로 제한.
- 테마 결정이 첫 페인트 전에 끝나 FOUC가 없다.

### Availability

GitHub Pages CDN에 위임한다. 자체 가용성 목표를 두지 않는다.

### Observability

없음. 분석 스크립트를 넣지 않는다(외부 요청 0 원칙). 필요해지면 그때 결정한다.

### Security

- 사용자 입력·인증·비밀값이 없다. 저장소에 시크릿을 두지 않는다.
- 외부 링크는 `rel="noreferrer"`.
- 마크다운은 저자 본인이 작성 → 신뢰 경계 안. sanitize 없이 `dangerouslySetInnerHTML`을 쓰는 것이 정당하다. **외부 기고를 받게 되면 이 전제가 깨지므로 재검토 대상이다.**

### Testability

- 단위 테스트(Vitest)는 `src/content/`와 `src/lib/`만 대상으로 한다. 커버리지 수치 목표를 두지 않는 대신, **아래 목록을 반드시 커버한다**:
  - zod 스키마: 필수 필드 누락 시 에러, 선택 필드 생략 시 통과
  - `groupPostsByYear`: 연도 내림차순, 그룹 내 날짜 내림차순, 동일 날짜 안정 정렬
  - draft 필터링
  - 파일명 → `{date, slug}` 파싱 (정상 / 패턴 불일치)
  - 날짜 포맷터: `Jun 14`, `2026-04-02`
- E2E(Playwright) `e2e/smoke.spec.ts` — 빌드 산출물을 서빙해 실행:
  - `/` → `/about` → `/projects` → `/posts` 네비게이션
  - `/posts/{slug}` **직접 접속** 시 200 + 본문 렌더 (SSG 핵심 약속)
  - 테마 토글 → `data-theme` 변경 → 새로고침 후 유지
  - JS 비활성화 상태에서 포스트 본문이 보임 (프리렌더 검증)
- 프레젠테이션 컴포넌트의 단위 테스트를 작성하지 않는다. JSX를 재서술하는 저가치 테스트가 되기 때문이다.

---

## Constraints

- **정적 호스팅 전용.** 서버 사이드 실행이 불가능하다. 런타임 API·DB·환경변수 시크릿이 존재할 수 없다.
- **저장소는 `byron1st.github.io`** (user site). 따라서 base path는 `/`이며 프로젝트 사이트용 경로 접두사 처리가 필요 없다.
- **배포 산출물은 `./dist/client` 디렉터리 업로드 방식.** `gh-pages` 브랜치 커밋 방식을 쓰지 않는다.
- **커밋 신원은 `Hwi Ahn <byron1st@icloud.com>`** (personal 저장소).
- **arbitrary value 금지** — 위 "스타일링" 컨벤션 참조. 이것은 스타일 취향이 아니라 이 프로젝트의 하드 룰이다.
- **단일 언어(영어 UI / 한국어 포스트).** 언어 토글·로케일 라우팅을 만들지 않는다.
- **외부 런타임 요청 0.** 폰트·아이콘·스크립트를 CDN에서 불러오지 않는다.
- **애니메이션 금지.** 페이지 전환·스크롤·등장 효과를 넣지 않는다. hover 상태 변화만 허용된다.
- 디자인 핸드오프의 콘텐츠(회사명·논문·프로젝트)는 **전부 가짜 데이터**다. 실제 콘텐츠로 교체해야 하며 그 전까지 배포하지 않는다.

---

## Dependencies

### 런타임 (번들에 포함)

- `react`, `react-dom` — 19.x
- `react-router` — 8.x. v7에서 `react-router-dom`이 이 패키지로 합쳐졌으므로 **`react-router-dom`을 설치하지 않는다**(7.18.2에서 동결됨).

### 빌드 타임

- `vite` — 8.x
- `@react-router/dev` — 8.x. `reactRouter()` Vite plugin + `react-router build/dev/typegen` CLI. Babel React 변환과 react-refresh, `@react-router/node`를 자체 의존성으로 포함하므로 **`@vitejs/plugin-react`를 따로 설치하지 않는다.**
- `tailwindcss`, `@tailwindcss/vite` — v4
- `zod` — 콘텐츠 스키마
- `@rollup/plugin-yaml` — YAML 파싱
- `gray-matter` — frontmatter 분리
- `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-stringify` — Markdown → HTML
- `@fontsource/public-sans`, `@fontsource/jetbrains-mono`, `pretendard` — self-host 폰트

### 개발

- `typescript` — **`~6.0.3`으로 고정**. 아래 제약 참조.
- `vitest`, `@vitest/coverage-v8`, `@playwright/test`
- `eslint` — 10.x, `@eslint/js`, `typescript-eslint` — 8.x(ESLint 10 peer 지원), `eslint-plugin-react-hooks`
- `prettier` — 3.x, `eslint-config-prettier`, `eslint-plugin-prettier` — Prettier를 ESLint 규칙으로 실행
- `jiti` — `eslint.config.ts`(TS flat config) 로딩에 필요

> **TypeScript 버전 제약(2026-07-29).** `typescript`의 `latest`는 7.0.2(네이티브 포트)지만 `typescript-eslint@8.65.0`은 canary를 포함해 `typescript: >=4.8.4 <6.1.0`을 선언한다. typescript-eslint 없이는 ESLint가 `.ts`/`.tsx`를 파싱조차 못 하므로 "lint = format 단일 파이프라인" 전제가 무너진다. 따라서 **양쪽을 모두 만족하는 최신 정식 버전인 6.0.3을 쓰고, 6.1 이상으로 자동 상승하지 않도록 `~6.0.3`으로 고정한다.** typescript-eslint가 TS 7을 지원하면 재검토한다. `@react-router/dev`는 `^5.1.0 || ^6.0.0 || ^7.0.0`이라 제약 요인이 아니다.

> 버전 확인(2026-07-29): `react@19.2.8` · `react-router@8.3.0` · `@react-router/dev@8.3.0` · `vite@8.1.5` · `tailwindcss@4.3.3` · `zod@4.4.3` · `typescript@6.0.3` · `vitest@4.1.10` · `eslint@10.8.0` · `typescript-eslint@8.65.0` · `prettier@3.9.6`. `@react-router/dev`는 `vite: ^7 || ^8`, `@tailwindcss/vite`는 `vite: ^5.2 || ^6 || ^7 || ^8` peer를 선언하므로 Vite 8과 호환된다.

### 외부 서비스

- **GitHub Pages** — 호스팅
- **GitHub Actions** — CI/CD

그 외 서드파티 서비스 의존 없음.

---

## Open Questions

1. **실제 콘텐츠.** 핸드오프의 이력·프로젝트·포스트는 전부 가짜다. `content/*.yaml`을 채울 실제 이력서·프로젝트 목록·소셜 핸들(GitHub/X/LinkedIn/이메일 주소)이 필요하다. 스키마 확정 전에 실제 데이터를 한 번 보는 편이 안전하다 — 예를 들어 "Books & courses" 같은 섹션이 실제로 존재하지 않으면 스키마에서 빼야 한다. **→ 결정(2026-07-29):** 저자가 Google Docs 이력서를 제공 예정. 그 이력서를 기준으로 `content/*.yaml`을 채우고 실제 섹션 구성에 맞춰 스키마를 확정한다.
2. **포스트 `summary` 필드.** OG description과 RSS에 필요해 필수 필드로 잡았다. 매 포스트마다 쓰는 게 번거로우면 본문 첫 문단에서 자동 추출하는 방식으로 바꿀 수 있다. **→ 결정(2026-07-29):** 필수 필드로 유지. 저자가 매 포스트마다 직접 작성한다(자동 추출 미도입).
3. ~~**`vite-react-ssg`의 route `loader` 동작 확인.**~~ **→ 해소(2026-07-29):** SSG를 React Router 8 framework mode로 교체하면서 사라진 질문이다. React Router의 프리렌더는 라우트별 `loader` 결과를 `.data` 파일로 직렬화하는 것이 문서화된 1급 동작이므로 스파이크가 필요 없다.
4. **`.post-body` 스코프 CSS.** 마크다운 산출 HTML에 클래스를 붙일 수 없어 유일하게 컴포넌트 밖에 스타일이 존재하는 지점이다. 대안은 `rehype`가 hast(JSON)를 내보내게 하고 `PostBody`가 노드 → React 컴포넌트로 매핑하는 것 — 스타일이 100% 컴포넌트로 통일되지만 코드가 ~50줄 늘어난다. 현재는 단순함을 택했다. **→ 결정(2026-07-29):** 현재 선택(스코프 CSS) 유지. hast→React 매핑 대안 미채택.
5. **GitHub Actions 액션 버전.** `actions/checkout`, `setup-node`, `configure-pages`, `upload-pages-artifact`, `deploy-pages`의 메이저 버전은 구현 시점에 최신 안정판을 확인한다. **→ 결정(2026-07-29):** 구현 시점 최신 안정 메이저 버전 사용.
6. **커스텀 도메인.** 현재 범위 밖(`byron1st.github.io` 직접 사용). 나중에 붙이면 `public/CNAME` 추가 + `lib/site.ts`의 `SITE_URL` 변경 + DNS 설정이면 되고, canonical/sitemap/RSS가 그 상수를 참조하므로 한 곳만 고치면 된다. **→ 결정(2026-07-29):** 현재 범위 밖. 저자가 추후 직접 셋업한다 — 구현에서 다루지 않는다.
7. **`/music` 등 확장 페이지.** 디자인이 확장을 전제하고 있으나 현재 범위에는 없다. 위 "Structural design" 기준(파일 5개 추가로 끝날 것)을 충족하는지 첫 확장 때 검증한다. **→ 결정(2026-07-29):** 현재 범위에서 제외. 첫 확장 시점에 검증한다.
