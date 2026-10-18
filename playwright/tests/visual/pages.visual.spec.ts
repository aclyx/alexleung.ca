import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

test("contact top fold stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/contact/");

  await expect(page).toHaveScreenshot("contact-top-fold.png");
});

test("now top fold stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/now/");

  await expect(page).toHaveScreenshot("now-top-fold.png");
});

test("not found page stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/this-route-should-not-exist/");

  await expect(page).toHaveScreenshot("not-found.png");
});

test("RSS feed top fold stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/feed.xml");
  await expect(
    page.getByRole("heading", { level: 1, name: "Alex Leung's Writing" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot("rss-top-fold.png");
});
