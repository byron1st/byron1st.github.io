# byron1st.github.io

Personal site for Hwi Ahn — a text-first, minimal static site. Profile/CV/projects live in YAML, blog posts in Markdown; every route is prerendered to static HTML at build time and served from GitHub Pages.

Stack: TypeScript 6 (strict) · React 19 · Vite 8 · React Router 8 framework mode (`ssr: false` + `prerender`) · Tailwind CSS v4 · zod · Vitest · Playwright.

## Key Requirements

- **Readability first**: a reader must infer an element's role from its `className` alone.
- **Structural design**: dependencies flow one way — `pages → components → content → lib`.
- **Zero external runtime requests**: fonts, icons and scripts are self-hosted or inlined.
- **Build-time correctness**: invalid content fails the build, never reaches production.
- **Performance budget**: home page under 15KB HTML and 60KB JS (gzip), excluding fonts.
- **Minimal Dependencies**: prefer the standard library over external ones.

## Core Commands

Package manager is **pnpm**. Run `pnpm install` before anything else.

| Command | Purpose |
| --- | --- |
| `pnpm check` | Format, lint and typecheck. **Run after every source change.** |
| `pnpm format` | Auto-fix lint + format violations (ESLint runs Prettier). |
| `pnpm lint` | Lint with zero tolerance for warnings. |
| `pnpm typecheck` | Regenerate route types, then `tsc --noEmit`. |
| `pnpm test` | Vitest unit suite. Run after behavior changes. |
| `pnpm coverage` | Vitest with V8 coverage. |
| `pnpm test-e2e` | Playwright smoke suite. Run after browser workflow changes. |
| `pnpm build` | Prerender all routes to `dist/client/`. |
| `pnpm preview` | Serve the build locally (what the e2e suite exercises). |
| `pnpm dev` | Dev server. |

There is no separate format-check step: `pnpm lint` is the format check, because Prettier runs as the `prettier/prettier` ESLint rule.

## Architecture Overview

- `content/`: the only directory the author edits — `*.yaml` plus `posts/YYYY-MM-DD-{slug}.md`.
- `plugins/`: Vite plugin turning `.md` into a module exporting `{ meta, html }`.
- `scripts/`: `feeds.ts` — generates `rss.xml`, `sitemap.xml`, `robots.txt`, called from `buildEnd`.
- `react-router.config.ts`: `appDirectory: "src"`, `buildDirectory: "dist"`, `ssr: false`, `prerender()`, `buildEnd()`.
- `src/root.tsx`: the document shell (`<html>`/`<head>`/`<body>`) and the pre-paint theme script.
- `src/routes.ts`: the single definition of the route tree. Page components do not know their own path.
- `src/content/`: loads and zod-validates YAML/Markdown. Pure functions, no React import.
- `src/components/`: reusable presentational patterns. Props only, no content imports (`Layout` is the one exception).
- `src/pages/`: one screen per route. Assembles content into components; never imports another page.
- `src/hooks/`, `src/lib/`: `useTheme`, date formatters, `seo.ts` meta builders, site constants.
- `src/styles/`: `theme.css` (tokens), `fonts.css` (self-hosted `@font-face`), `post-body.css`.
- `e2e/`: Playwright specs run against the built output.

## Code Conventions

- **No Tailwind arbitrary values.** `text-[13.5px]` and `text-[var(--muted)]` are rejected in review. The only two exceptions are grid templates (`grid-cols-[8rem_1fr]`, values taken from the standard rem scale) and viewport units (`min-h-[52vh]`).
- **Colors come from semantic tokens only**: `text-fg` `text-muted` `text-faint` `bg-bg` `bg-code-bg` `border-line` `text-accent`. Token values already switch per theme, so `dark:` is reserved for non-color properties such as icon visibility.
- **Extract repeated visual patterns into React components**, not `@apply` classes. `.post-body` scoped CSS is the sole exception, because Markdown output cannot carry classNames.
- **Single source of truth**: routes in `routes.ts`, schemas in `src/content/schema.ts`, colors and sizes in `theme.css`, the post list in `posts.ts`. The same fact is never written twice.
- **SEO goes through route `meta` exports**, assembled by the pure builders in `src/lib/seo.ts`. `meta` runs outside React, so it cannot be a component. Canonical links are `{ tagName: "link", rel: "canonical" }` descriptors in the same array.
- **Naming**: components and their files are `PascalCase`, hooks are `useXxx`, everything else `camelCase`. `content/` functions start with a verb (`loadPostBody`). Boolean props are affirmative (`hasBorder`, never `noBorder`).
- Aim to keep a component file under 100 lines; exceeding it is a signal to extract a visual pattern.
- Comments explain **why** only — design intent, not what the code does.
- Pixel-level color and type decisions live in `src/styles/theme.css` (`@theme inline` tokens).

## Testing

- **Unit tests: Vitest**, colocated in `src/content/__tests__/`. Scope is `src/content/` and `src/lib/` only.
- **Never write unit tests for presentational components** — they restate JSX and carry no value. Cover behavior in `content/`/`lib/` or in e2e instead.
- **Never run mutation testing.** There is no Stryker setup and none should be added; this project's test value comes from the content-layer cases below plus the e2e smoke suite.
- No coverage percentage target. Instead these cases must always be covered: zod schema required/optional fields, `groupPostsByYear` ordering (year desc, date desc, stable on ties), draft filtering, filename → `{date, slug}` parsing, and date formatters.
- **E2E: Playwright**, `e2e/smoke.spec.ts`, run against built output. It must assert cross-page navigation, a direct hit on `/posts/{slug}` rendering its body, theme toggle persistence across reload, and post body visibility with JS disabled.
- Run `pnpm check && pnpm test` before every commit.

## Boundaries

- **NEVER add runtime server code, API routes, DB access or secrets.** Hosting is static only — move the logic to build time, into `src/content/` or `scripts/`.
- **NEVER use a Tailwind arbitrary value** outside the two documented exceptions. Add a token to `theme.css` or pick the nearest standard scale step.
- **NEVER add animations, transitions, page-transition or scroll effects.** Hover state changes are the only permitted state change.
- **NEVER load fonts, icons, analytics or any asset from a CDN.** Self-host it under `src/styles/` or inline it.
- **NEVER write a runtime fallback such as `post?.title ?? "Untitled"`.** Validate at build time and `throw` with the offending file path in the message.
- **NEVER duplicate `date` or `slug` into post frontmatter.** The filename `YYYY-MM-DD-{slug}.md` is their only source.
- **NEVER require a `src/` change in order to edit content.** If content editing needs code changes, the schema design is wrong — fix the schema.
- **NEVER add i18n, a locale router or a language toggle.** The site is single-language (Korean).
- **NEVER deploy via a `gh-pages` branch commit.** Deployment uploads `./dist/client` through `actions/upload-pages-artifact` — uploading `./dist` would ship the server build too.
- **NEVER install `react-router-dom` or `@vitejs/plugin-react`.** `react-router` absorbed the former at v7; `@react-router/dev` supplies the React transform itself.
- **NEVER raise `typescript` above `6.0.x`.** `typescript-eslint` peers at `<6.1.0`, and without it ESLint cannot parse `.ts`/`.tsx` at all. Revisit only when typescript-eslint ships TypeScript 7 support.
