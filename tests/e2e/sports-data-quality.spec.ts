import { expect, test } from "@playwright/test";

test.describe("SportOracle data quality smoke checks", () => {
  test("dashboard renders primary product signal", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /SportOracle/i })).toBeVisible();
    await expect(page.getByText(/NBA/i).first()).toBeVisible();
    await expect(page.getByText(/Polymarket/i).first()).toBeVisible();
  });

  test("NBA markets page handles empty data without crashing", async ({ page }) => {
    await page.route("**/api/markets", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            todayMarkets: [],
            tomorrowMarkets: [],
            allTodayFinished: false,
          },
        }),
      });
    });

    await page.route("**/api/overview**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto("/markets");

    await expect(page.getByRole("heading", { name: /NBA|NBA 市场/i })).toBeVisible();
    await expect(page.getByText(/No NBA markets|暂无 NBA 市场/i)).toBeVisible();
  });

  test("NBA markets page shows a clear error state", async ({ page }) => {
    await page.route("**/api/markets", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "sports data unavailable" }),
      });
    });

    await page.route("**/api/overview**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto("/markets");

    await expect(page.getByRole("heading", { name: /NBA|NBA 市场/i })).toBeVisible();
    await expect(page.getByText(/Error loading markets|加载市场失败|sports data unavailable/i)).toBeVisible();
  });

  test("mobile dashboard remains readable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /SportOracle/i })).toBeVisible();
    await expect(page.getByText(/NBA/i).first()).toBeVisible();
  });
});
