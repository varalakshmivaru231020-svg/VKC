import { test, expect } from "@playwright/test";

test.describe("Smoke: core pages load", () => {
  test("homepage loads and shows the welcome strip", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Welcome to Vijaylakshmi Sarees/i)).toBeVisible();
  });

  test("header nav has the expected flat links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav").first();
    for (const label of ["Home", "Sarees", "Salwar", "Shop", "About Us", "Saree Stories", "Events", "Video Sharing", "Contact"]) {
      await expect(nav.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("shop page loads products", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveTitle(/Shop/i);
  });

  test("events page loads", async ({ page }) => {
    const res = await page.goto("/events");
    expect(res?.status()).toBe(200);
  });

  test("gallery page loads", async ({ page }) => {
    const res = await page.goto("/gallery");
    expect(res?.status()).toBe(200);
  });

  test("terms and privacy pages resolve", async ({ page }) => {
    for (const path of ["/terms", "/privacy"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    }
  });
});

test.describe("Smoke: Saree Stories", () => {
  test("listing page loads and shows a published story", async ({ page }) => {
    await page.goto("/saree-stories");
    await expect(page.getByRole("heading", { name: "Saree Stories" })).toBeVisible();
    await expect(page.getByText("Kanchipuram Silk")).toBeVisible();
  });

  test("story detail page has correct title, breadcrumbs, and content sections", async ({ page }) => {
    await page.goto("/saree-stories/kanchipuram");
    await expect(page).toHaveTitle("Kanchipuram Silk Saree — History, Weaving & Significance | Vijaylakshmi Sarees");
    await expect(page.getByRole("link", { name: "Saree Stories" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Weaving Technique" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Interesting Facts" })).toBeVisible();
  });

  test("story detail page has JSON-LD structured data", async ({ page }) => {
    await page.goto("/saree-stories/kanchipuram");
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(scripts.length).toBeGreaterThanOrEqual(2);
    const article = scripts.map((s) => JSON.parse(s)).find((j) => j["@type"] === "Article");
    expect(article?.headline).toBe("Kanchipuram Silk");
  });

  test("unpublished/unknown story returns 404", async ({ page }) => {
    const res = await page.goto("/saree-stories/does-not-exist");
    expect(res?.status()).toBe(404);
  });

  test("share button copies link when Web Share API is unavailable", async ({ page }) => {
    await page.goto("/saree-stories/kanchipuram");
    await page.evaluate(() => { (navigator as any).share = undefined; });
    await page.getByRole("button", { name: /Share/i }).click();
    await expect(page.getByRole("button", { name: /Link Copied/i })).toBeVisible();
  });
});
