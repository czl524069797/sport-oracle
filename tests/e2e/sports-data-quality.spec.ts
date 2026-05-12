import { expect, test } from "@playwright/test";

test.describe("SportOracle data quality smoke checks", () => {
  test("dashboard renders primary product signal", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /SportOracle/i })).toBeVisible();
    await expect(page.getByText(/NBA .* Football .* Polymarket/i)).toBeVisible();
    await expect(page.getByText(/Polymarket/i).first()).toBeVisible();
  });

  test("NBA markets page handles empty data without crashing", async ({ page }) => {
    await page.route("**/api/markets**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            today: [],
            tomorrow: [],
            allTodayFinished: false,
            labels: { todayLabel: "", tomorrowLabel: "" },
          },
        }),
      });
    });

    await page.route("**/api/overview**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { category: "nba", markets: [] } }),
      });
    });

    await page.goto("/markets");

    await expect(page.getByRole("heading", { name: /NBA|NBA 市场/i })).toBeVisible();
    await expect(page.getByText(/No NBA markets|暂无 NBA 市场/i)).toBeVisible();
  });

  test("NBA markets page shows a clear error state", async ({ page }) => {
    await page.route("**/api/markets**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "sports data unavailable" }),
      });
    });

    await page.route("**/api/overview**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { category: "nba", markets: [] } }),
      });
    });

    await page.goto("/markets");

    await expect(page.getByRole("heading", { name: /NBA|NBA 市场/i })).toBeVisible();
    await expect(page.getByText(/Error loading markets|加载市场失败/i)).toBeVisible();
    await expect(page.getByText("sports data unavailable")).toBeVisible();
  });

  test("mobile dashboard remains readable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /SportOracle/i })).toBeVisible();
    await expect(page.getByText(/NBA .* Football .* Polymarket/i)).toBeVisible();
  });

  test("football API exposes clean upcoming match metadata", async ({ request }) => {
    const response = await request.get("/api/football");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.matches.length).toBeGreaterThan(0);

    for (const match of body.data.matches) {
      expect(match.homeTeam).not.toMatch(/Will |More Markets|\?/i);
      expect(match.awayTeam).not.toMatch(/Will |More Markets|\?/i);
      expect(new Date(match.matchDate).getTime()).toBeGreaterThan(Date.now() - 60 * 60 * 1000);
      expect(match.polymarketUrl).toMatch(/^https:\/\/polymarket\.com\/event\//);
    }
  });
});
