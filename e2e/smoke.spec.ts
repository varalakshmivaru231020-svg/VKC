import { test, expect } from "@playwright/test";

test.describe("Smoke: core pages load", () => {
  test("homepage loads and shows the welcome strip", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Welcome to VKC Gold/i)).toBeVisible();
  });

  test("header nav has the expected flat links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav").first();
    for (const label of ["Home", "Shop", "About Us", "Events", "Gallery", "Contact"]) {
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
