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

test("home browser tools stay visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/");

  await expect(
    page.getByRole("region", { name: "Browser tools" })
  ).toHaveScreenshot("home-browser-tools.png");
});

test("home selected writing stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/");
  await page.locator("#writing").evaluate((element) => {
    element.scrollIntoView({ block: "start" });
  });
  await waitForStablePage(page);

  await expect(page).toHaveScreenshot("home-selected-writing.png");
});
