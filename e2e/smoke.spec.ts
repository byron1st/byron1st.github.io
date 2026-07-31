import { expect, test } from "@playwright/test";

test("home stub is visible at /", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Hwi Ahn — personal site shell")).toBeVisible();
});

test("home stub is prerendered without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByText("Hwi Ahn — personal site shell")).toBeVisible();
  await context.close();
});
