# Handoff: Hwi Ahn — Personal Homepage

## Overview
A minimal, text-first personal site for a backend/systems engineer. Four views: front page (index), about (resume), projects, posts (blog index), plus a post detail page. Bilingual (EN/KO) and light/dark, both toggled in the header. Built to be extended with additional "about me" pages later (e.g. music) by adding one nav item + one view.

## About the Design Files
`Personal Site.dc.html` in this bundle is a **design reference created in HTML** — a prototype showing the intended look and behavior, not production code to copy. The task is to **recreate it in the target codebase's environment** (Next.js/Astro/SvelteKit/etc.) using that project's established patterns. If no codebase exists yet, pick an appropriate stack — for this design a static site generator with Markdown-based content (Astro or Next.js App Router + MDX) is the natural fit, since the real content is a resume, a project list, and blog posts.

Note: the prototype holds all content in one JS object with `en`/`ko` branches, and simulates routing with a `page` state variable. In production these should be real routes and real content files, not state.

## Fidelity
**High fidelity.** Colors, type scale, spacing, and hover states are final. Recreate pixel-for-pixel; all values are listed below. Content is placeholder/fake data (name `Hwi Ahn` is intentional; company names, papers, project names, links are invented) — replace with real content.

## Routes / Screens

Target route map:

| Route | View |
| --- | --- |
| `/` | Front page |
| `/about` | About (resume) |
| `/projects` | Projects |
| `/posts` | Posts index |
| `/posts/[slug]` | Post detail |

### Global shell (all pages)
- Page background `--bg`, text `--fg`. Content column: `max-width: 660px; margin: 0 auto; padding: 44px 28px 120px`.
- **Header**: flex row, `justify-content: space-between`, `align-items: baseline`, `gap: 24px`, `padding-bottom: 14px`, `border-bottom: 1px solid --line`.
  - Left: name `Hwi Ahn` (15px, weight 600, `letter-spacing: -0.01em`) linking to `/`; then nav links at 13.5px, `gap: 14px`, color `--muted`, hover `--fg` with a `1px solid --line` bottom border appearing on hover (border is `transparent` at rest so text does not shift). Labels: `about` / `projects` / `posts` (KO: `소개` / `프로젝트` / `포스트`).
  - Right: two icon buttons, `gap: 12px`, `align-items: center`, color `--faint`, hover `--fg`; separated by a `1px × 12px` divider of `--line`.
    - Language: globe icon, 16px, stroke 1.5. `title` = the language it switches to (`한국어` / `English`).
    - Theme: 16px stroke-1.5 moon icon while in light mode, sun icon while in dark mode. `title` = target theme.
- **Footer**: `padding-top: 80px; margin-top: 60px; border-top: 1px solid --line`, flex row space-between, 12px, color `--faint`. Left: `© 2026 Hwi Ahn`. Right: the four social icons at 14–16px, color `--faint`, hover `--fg`, `gap: 15px`.

### 1. Front page (`/`)
Deliberately extreme-minimal: one line about the person plus links.
- Wrapper `padding-top: 96px; min-height: 52vh`.
- Column, `gap: 26px`, `align-items: flex-start`:
  1. `Hwi Ahn` — 30px, weight 600, `letter-spacing: -0.02em`, `line-height: 1.15`.
  2. Tagline — 16px, color `--muted`, `max-width: 30em`. EN: "Backend and systems engineer. I build storage engines, and the boring tools that prove they are correct." KO: "백엔드·시스템 엔지니어. 저장 엔진과, 그것이 맞다는 걸 증명하는 지루한 도구들을 만듭니다."
  3. Social icon row — flex, `gap: 18px`, `align-items: center`. Icons: GitHub 19px (stroke 1.5), X 16px (filled logo glyph), LinkedIn 18px (stroke 1.5), email 18px (stroke 1.5). Color `--muted`, hover `--fg`, no underline, each with a `title` (`github`, `x`, `linkedin`, `email`).

No other content on this page — no post previews, no project cards.

### 2. About (`/about`)
Column, `gap: 52px`. Every section after the intro starts with a **section label**: 12px, `letter-spacing: 0.12em`, `text-transform: uppercase`, color `--faint`, `padding-bottom: 6px`, `border-bottom: 1px solid --line`.
- **Intro** — label `about`, then two paragraphs, 15px/1.65, color `--muted`, `max-width: 33em`, `gap: 16px`.
- **Stack** — rows of `display: grid; grid-template-columns: 130px 1fr; gap: 16px; align-items: baseline`; left cell 13px `--faint` (group), right cell 14px `--fg` (comma-joined items). Groups: Languages / Data / Infra / Interests.
- **Experience** — per entry, column `gap: 8px`: row with company (weight 600) left and period (12.5px, `--faint`, `white-space: nowrap`) right; role 14px `--muted`; then bullets in `padding-top: 4px`, each `grid-template-columns: 14px 1fr; gap: 8px`, 14px `--muted`, marker `—` in `--faint`. Entries separated by `gap: 26px`.
- **Education** — same header row (school / period), then degree 14px `--muted`, thesis title 14px `--fg`, description 14px `--muted` `max-width: 33em`, then a paper list (`padding-top: 6px`, marker `·`, 13.5px `--muted`). Bachelor's entry has no thesis/papers — those blocks must be conditional.
- **Books & courses** — per item: row with title 14.5px left and year 12.5px `--faint` right; meta line 13.5px `--muted` (`type · publisher · detail`).

### 3. Projects (`/projects`)
- Label `projects`, then an intro line 15px `--muted`, `max-width: 33em`.
- Project rows: each `padding: 20px 0; border-top: 1px solid --line` (top borders only — no bottom border on the last), column `gap: 6px`:
  - Row: project name as a link to the repo (weight 600, no underline at rest, hover `--accent`) / year 12.5px `--faint`.
  - Description 14px `--muted`, `max-width: 33em`.
  - Tech chips: flex wrap, `gap: 8px`, `padding-top: 4px`; each chip 12px `--faint`, `border: 1px solid --line`, `border-radius: 2px`, `padding: 1px 7px`.

### 4. Posts index (`/posts`)
Grouped by year, newest first, titles only — no summaries or tags.
- Label `posts`, groups separated by `gap: 44px`.
- Each group: `display: grid; grid-template-columns: 64px 1fr; gap: 20px; align-items: start`. Left = year, 13px `--faint`, `padding-top: 2px`. Right = post rows, `gap: 9px`, each a space-between row: title 15px `--fg` (hover `--accent`, whole row clickable) / date 12px `--faint`, `white-space: nowrap` (EN `Jun 14`, KO `6월 14일`).

### 5. Post detail (`/posts/[slug]`)
- Back link `← back to posts` / `← 포스트 목록으로`, 12.5px `--faint`, hover `--fg`.
- Title 24px, weight 600, `letter-spacing: -0.02em`, `line-height: 1.3`, `max-width: 26em`.
- Date only, 12.5px `--faint` (ISO `2026-04-02`). **No tags.**
- Body column `gap: 20px`, `max-width: 34em`, block types:
  - `p` — 15.5px, `line-height: 1.75`.
  - `h` (subheading) — 15px, weight 600, `padding-top: 12px`.
  - `code` — `<pre>`, background `--code-bg`, `border: 1px solid --line`, `border-radius: 3px`, `padding: 14px 16px`, `overflow-x: auto`, font JetBrains Mono 12.5px/1.6, color `--fg`. **Monospace is used only here.**
  - `quote` — `border-left: 2px solid --line`, `padding-left: 14px`, 15px `--muted`.

## Interactions & Behavior
- Navigation: header links + post titles. In production use real routing; scroll to top on navigation.
- **Language toggle**: switches all UI strings and content between `en` and `ko`. Production: i18n routing (`/` and `/ko/`) or a locale cookie; persist the choice.
- **Theme toggle**: sets `data-theme="dark"` on `<html>`; the CSS variables under `html[data-theme="dark"]` do the rest. Persist in `localStorage` and honor `prefers-color-scheme` on first visit; set the attribute before first paint to avoid a flash.
- Hover only — no page transitions, no scroll animations, no entrance animations anywhere. Keep it that way.
- External links open in a new tab (`target="_blank" rel="noreferrer"`); email is a `mailto:`.
- Responsive: single centered column already works down to ~360px. Only care needed: the About stack grid (130px label column) and the Posts year grid (64px) — collapse both to a single column under ~480px.

## State Management
Prototype state, and what it becomes in production:
- `page` → real routes.
- `lang` (`"en" | "ko"`) → i18n locale, persisted.
- `theme` (`"light" | "dark"`) → persisted, applied as `data-theme` on `<html>`.
Content (resume, projects, post list, post bodies) should move to Markdown/MDX or JSON per locale — resume as one structured data file, posts as files with `title`, `date`, `locale` front matter.

## Design Tokens

Light (`:root`):
```
--bg:       oklch(0.985 0.003 90)   /* near-white, warm */
--fg:       oklch(0.24 0.01 90)
--muted:    oklch(0.55 0.012 90)
--faint:    oklch(0.72 0.01 90)
--line:     oklch(0.9 0.006 90)
--code-bg:  oklch(0.955 0.005 90)
--accent:   oklch(0.55 0.13 252)    /* blue, links/hover only */
```
Dark (`html[data-theme="dark"]`):
```
--bg:       oklch(0.185 0.008 265)
--fg:       oklch(0.92 0.006 265)
--muted:    oklch(0.66 0.012 265)
--faint:    oklch(0.48 0.012 265)
--line:     oklch(0.29 0.01 265)
--code-bg:  oklch(0.225 0.01 265)
--accent:   oklch(0.74 0.11 252)
```

Typography — body **Public Sans** (Google Fonts, 300–700, italic available), fallback `"Helvetica Neue", Helvetica, sans-serif`; code **JetBrains Mono** 400/500. Base 15px / 1.65, `-webkit-font-smoothing: antialiased`, `text-wrap: pretty`.

Scale: 30 (front name) · 24 (post title) · 19 · 16 (tagline) · 15.5 (post body) · 15 (base) · 14.5 · 14 · 13.5 · 13 · 12.5 · 12 (section labels, meta). Weights 400 / 600 only. Tracking: `-0.02em` on 24px+ headings, `-0.01em` on the header name, `0.12em` on uppercase section labels, `0.1em` on other uppercase micro-text.

Spacing (px): 3 · 4 · 6 · 8 · 9 · 11 · 14 · 16 · 18 · 20 · 26 · 28 · 44 · 52 · 56 · 80 · 96. Radius: 2 (chips) · 3 (code blocks). No shadows anywhere. Borders are always `1px solid --line`.

Links: default `color: --fg` with `border-bottom: 1px solid --line`; hover `--accent` for both. Icon and nav links suppress the border. `::selection` = `--accent` background, `--bg` text.

## Assets
No images. Five inline SVG icons, 24×24 viewBox, `currentColor`:
- GitHub, LinkedIn, envelope, globe (language), moon/sun (theme) — Feather-style stroked paths, `stroke-width: 1.5`, round caps/joins.
- X (x.com) — filled logo glyph, `fill: currentColor`, no stroke.
Any icon set with the same weight (Feather, Lucide) can be substituted; keep the X mark as the official glyph.

## Files
- `Personal Site.dc.html` — the full prototype (all five views, both languages, both themes). Open it directly in a browser; use the header toggles and nav to see every state.

## Extending later
The design assumes more pages will be added (e.g. `/music`). Pattern: add a nav label to the locale strings, add a route, reuse the section-label + row/grid patterns from About and Projects. Keep the front page to name + one line + icons regardless of how many pages exist.
