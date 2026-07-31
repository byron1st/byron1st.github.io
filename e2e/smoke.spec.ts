import { expect, test } from "@playwright/test";

test("home front page shows name, tagline, and socials only", async ({
  page,
}) => {
  await page.goto("/");
  const main = page.locator("main");
  await expect(main.getByRole("heading", { name: "Hwi Ahn" })).toBeVisible();
  await expect(main.getByRole("heading")).toHaveCount(1);
  await expect(
    main.getByText(
      "Backend and security engineer designing, building, and operating safe high-performance systems.",
    ),
  ).toBeVisible();
  await expect(main.getByRole("link", { name: "github" })).toBeVisible();
  await expect(main.getByRole("link", { name: "email" })).toBeVisible();
  // AC-5: no post preview or project cards on the front page.
  await expect(main.getByText("personal-harness")).toHaveCount(0);
  await expect(main.getByText("building-this-site")).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "About" })).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "Works" })).toHaveCount(0);
});

test("about page has four sections and omits Works", async ({ page }) => {
  await page.goto("/about");
  const main = page.locator("main");
  const sectionHeadings = main.locator("h2");
  await expect(sectionHeadings).toHaveCount(4);
  await expect(sectionHeadings).toHaveText([
    "About",
    "Stack",
    "Experience",
    "Education",
  ]);
  // AC-1: empty works → no Works section markup at all (label included).
  await expect(main.getByRole("heading", { name: "Works" })).toHaveCount(0);
  await expect(main.getByText("Works")).toHaveCount(0);
  await expect(main.getByText("Books")).toHaveCount(0);

  // AC-3: Intro label alone has no bottom border; the other three do.
  await expect(sectionHeadings.nth(0)).not.toHaveClass(/border-b/);
  await expect(sectionHeadings.nth(1)).toHaveClass(/border-b/);
  await expect(sectionHeadings.nth(2)).toHaveClass(/border-b/);
  await expect(sectionHeadings.nth(3)).toHaveClass(/border-b/);

  // AC-2 smoke: bachelor degree renders; Ph.D. optional blocks still present.
  await expect(main.getByText("B.S. in Computer Science")).toBeVisible();
  await expect(
    main.getByText("Software architecture reconstruction"),
  ).toBeVisible();
  await expect(main.getByText("42dot")).toBeVisible();
  await expect(main.getByText("Languages")).toBeVisible();
});

test("nav about reaches /about from home", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "about" })
    .click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await expect(page.locator("main h2").first()).toBeVisible();
});

test("shell is prerendered without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Hwi Ahn" })).toBeVisible();
  await expect(page.getByRole("navigation").getByText("about")).toBeVisible();
  await expect(
    page.getByRole("navigation").getByText("projects"),
  ).toBeVisible();
  await expect(page.getByRole("navigation").getByText("posts")).toBeVisible();
  await expect(page.getByText(/© \d{4} Hwi Ahn/)).toBeVisible();
  await expect(
    page.locator("footer").getByRole("link", { name: "github" }),
  ).toBeVisible();
  await expect(
    page.locator("footer").getByRole("link", { name: "email" }),
  ).toBeVisible();
  await expect(
    page.locator("main").getByRole("heading", { name: "Hwi Ahn" }),
  ).toBeVisible();
  await context.close();
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
  // Toggle still flips the attribute for this session even if storage fails.
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
      page.locator("main").getByRole("heading", { name: "Hwi Ahn" }),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
    await context.close();
  }
});
