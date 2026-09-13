import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

test("contact top fold stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/contact/");

  await expect(page).toHaveScreenshot("contact-top-fold.png");
});

test("now top fold stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/now/");

  await expect(page).toHaveScreenshot("now-top-fold.png");
});
