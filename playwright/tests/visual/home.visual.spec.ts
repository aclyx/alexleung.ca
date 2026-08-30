import {
  expect,
  gotoAndStabilize,
  test,
  waitForStablePage,
} from "../../fixtures/stableRendering";

test("home top fold stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/");

  await expect(page).toHaveScreenshot("home-top-fold.png");
});

test("home experience section stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/");
  await page.locator("#experience").evaluate((element) => {
    element.scrollIntoView({ block: "start" });
  });
  await waitForStablePage(page);

  await expect(page).toHaveScreenshot("home-experience.png");
});

test("home interests section stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/");
  await page.locator("#interests").evaluate((element) => {
    element.scrollIntoView({ block: "start" });
  });
  await waitForStablePage(page);

  await expect(page).toHaveScreenshot("home-interests.png");
});
