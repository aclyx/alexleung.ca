import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

test("PID simulator default, snapshot, and equation editor layouts stay stable", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/pid-controller/");
  await expect(page).toHaveScreenshot("pid-simulator.png", { fullPage: true });
  await page.getByRole("button", { name: "Take snapshot" }).click();
  await page.getByRole("button", { name: "Oscillation" }).click();
  await expect(
    page.getByRole("region", { name: "Interactive PID simulator" })
  ).toHaveScreenshot("pid-comparison.png");
  await page.getByLabel("Plant", { exact: true }).selectOption("spring");
  await page
    .locator("summary")
    .filter({ hasText: "Edit plant equation" })
    .click();
  await expect(
    page.getByRole("region", { name: "Interactive PID simulator" })
  ).toHaveScreenshot("pid-equation-editor.png");
});
