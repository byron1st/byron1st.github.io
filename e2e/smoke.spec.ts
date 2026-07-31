import { expect, test } from "@playwright/test";

import { readPostFiles } from "../scripts/postFiles";

const publishedPosts = readPostFiles();
const firstPublished = publishedPosts[0];

// --- SPEC scenarios (must keep all four; post slug cases skip when empty) ---

test("nav walks home → about → projects → posts", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.locator("main").getByRole("heading", { name: "안휘" }),
  ).toBeVisible();

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "about" })
    .click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await expect(page.locator("main h2").first()).toBeVisible();

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "projects" })
    .click();
  await expect(page).toHaveURL(/\/projects\/?$/);
  await expect(
    page.locator("main").getByText("projects", { exact: true }),
  ).toBeVisible();

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "posts" })
    .click();
  await expect(page).toHaveURL(/\/posts\/?$/);
  await expect(
    page.locator("main").getByText("posts", { exact: true }),
  ).toBeVisible();
  if (firstPublished) {
    await expect(
      page.locator("main").getByText(firstPublished.title),
    ).toBeVisible();
  }
});

test("direct /posts/{slug} hit returns static HTML with body (not client routing)", async ({
  page,
}) => {
  if (!firstPublished) {
    test.skip(
      true,
      "no published posts to prerender — draft-only content is valid",
    );
    return;
  }
  const slug = firstPublished.slug;
  const title = firstPublished.title;

  // Raw HTTP response — proves the file is served, not hydrated later.
  const res = await page.request.get(`/posts/${slug}`);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain(title);
  expect(html).toContain('class="post-body');

  // Browser navigation to the bare (no trailing slash) path matches GH Pages.
  const nav = await page.goto(`/posts/${slug}`);
  expect(nav?.status()).toBe(200);
  await expect(
    page.locator("main").getByRole("heading", { name: title }),
  ).toBeVisible();
  await expect(page.locator(".post-body")).toBeVisible();
});

test("theme toggle persists across reload", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Toggle theme" });
  await expect(toggle).toBeVisible();

  const initial = await page.locator("html").getAttribute("data-theme");
  await toggle.click();
  const flipped = initial === "dark" ? "light" : "dark";
  await expect(page.locator("html")).toHaveAttribute("data-theme", flipped);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", flipped);
});

test("post body is visible with JavaScript disabled", async ({ browser }) => {
  if (!firstPublished) {
    test.skip(
      true,
      "no published posts to prerender — draft-only content is valid",
    );
    return;
  }
  const slug = firstPublished.slug;
  const title = firstPublished.title;

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const res = await page.goto(`/posts/${slug}`);
  expect(res?.status()).toBe(200);
  await expect(
    page.locator("main").getByRole("heading", { name: title }),
  ).toBeVisible();
  await expect(page.locator(".post-body")).toBeVisible();
  await context.close();
});

// --- Additional smoke coverage retained from earlier steps ---

test("home front page shows name, tagline, and socials only", async ({
  page,
}) => {
  await page.goto("/");
  const main = page.locator("main");
  await expect(main.getByRole("heading", { name: "안휘" })).toBeVisible();
  await expect(main.getByRole("heading")).toHaveCount(1);
  await expect(
    main.getByText(
      "안전한 고성능 백엔드 시스템의 설계, 개발, 운영 전반에 전문성을 갖춘 개발자",
    ),
  ).toBeVisible();
  await expect(main.getByRole("link", { name: "github" })).toBeVisible();
  await expect(main.getByRole("link", { name: "email" })).toBeVisible();
  await expect(main.getByText("personal-harness")).toHaveCount(0);
  await expect(main.getByText("building-this-site")).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "About" })).toHaveCount(0);
  await expect(
    main.getByRole("heading", { name: "Articles & Talks" }),
  ).toHaveCount(0);
});

test("about page has core sections; Articles & Talks only when works exist", async ({
  page,
}) => {
  await page.goto("/about");
  const main = page.locator("main");
  const sectionHeadings = main.locator("h2");
  // Intro label is "About"; remaining labels depend on content (works optional).
  await expect(sectionHeadings.first()).toHaveText("About");
  await expect(main.getByRole("heading", { name: "Stack" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Experience" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Education" })).toBeVisible();

  await expect(sectionHeadings.nth(0)).not.toHaveClass(/border-b/);
  await expect(sectionHeadings.nth(1)).toHaveClass(/border-b/);
  await expect(sectionHeadings.nth(2)).toHaveClass(/border-b/);
  await expect(sectionHeadings.nth(3)).toHaveClass(/border-b/);

  await expect(main.getByText("학사, 전산학과")).toBeVisible();
  await expect(main.getByText("소프트웨어 아키텍처 재구축 연구")).toBeVisible();
  await expect(main.getByText("포티투닷(주)").first()).toBeVisible();
  await expect(main.getByText("서버 개발", { exact: true })).toBeVisible();
});

test("shell is prerendered without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "안휘" })).toBeVisible();
  await expect(page.getByRole("navigation").getByText("about")).toBeVisible();
  await expect(
    page.getByRole("navigation").getByText("projects"),
  ).toBeVisible();
  await expect(page.getByRole("navigation").getByText("posts")).toBeVisible();
  await expect(page.getByText(/© \d{4} 안휘/)).toBeVisible();
  await expect(
    page.locator("footer").getByRole("link", { name: "github" }),
  ).toBeVisible();
  await expect(
    page.locator("footer").getByRole("link", { name: "email" }),
  ).toBeVisible();
  await expect(
    page.locator("main").getByRole("heading", { name: "안휘" }),
  ).toBeVisible();
  await context.close();
});

test("header has only the theme toggle button", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header");
  await expect(header.getByRole("button")).toHaveCount(1);
  await expect(
    header.getByRole("button", { name: "Toggle theme" }),
  ).toBeVisible();
});

test("pre-paint theme follows prefers-color-scheme when storage is empty", async ({
  browser,
}) => {
  for (const [scheme, expected] of [
    ["dark", "dark"],
    ["light", "light"],
  ] as const) {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", expected);
    await context.close();
  }
});

test("pre-paint theme prefers stored theme over system preference", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "light" });
  await context.addInitScript(() => {
    localStorage.setItem("theme", "dark");
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await context.close();
});

test("blocked localStorage falls back to prefers-color-scheme without throw", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  await context.addInitScript(() => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        return {
          getItem: blocked,
          setItem: blocked,
          removeItem: blocked,
          clear: blocked,
          key: blocked,
          length: 0,
        };
      },
    });
  });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(pageErrors).toEqual([]);
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(pageErrors).toEqual([]);
  await context.close();
});

test("nav links keep a transparent bottom border for stable hover layout", async ({
  page,
}) => {
  await page.goto("/");
  const about = page
    .getByRole("navigation")
    .getByRole("link", { name: "about" });
  await expect(about).toHaveClass(/border-b/);
  await expect(about).toHaveClass(/border-transparent/);
  await expect(about).toHaveClass(/hover:border-line/);
});

test("theme toggle renders both sun and moon icons for CSS-only switch", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Toggle theme" });
  await expect(toggle.locator("svg")).toHaveCount(2);
});

test("github social opens in a new tab; email does not", async ({ page }) => {
  await page.goto("/");
  const github = page.locator("main").getByRole("link", { name: "github" });
  const email = page.locator("main").getByRole("link", { name: "email" });
  await expect(github).toHaveAttribute("target", "_blank");
  await expect(github).toHaveAttribute("rel", "noreferrer");
  await expect(github).toHaveAttribute("href", "https://github.com/byron1st");
  await expect(email).not.toHaveAttribute("target", "_blank");
  await expect(email).toHaveAttribute("href", "mailto:byron1st@icloud.com");
});

test("load with light or dark preference produces no page errors", async ({
  browser,
}) => {
  for (const scheme of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });
    await page.goto("/");
    await expect(
      page.locator("main").getByRole("heading", { name: "안휘" }),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
    await context.close();
  }
});
