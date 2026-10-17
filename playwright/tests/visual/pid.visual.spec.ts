import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

test("PID physical views, snapshot, and controls stay stable", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/pid-controller/");
  await expect(page).toHaveScreenshot("pid-simulator.png", { fullPage: true });
  await page.getByRole("button", { name: "Take snapshot" }).click();
  await page.getByRole("button", { name: "Oscillation" }).click();
  await expect(
    page.getByRole("region", { name: "Interactive PID simulator" })
  ).toHaveScreenshot("pid-comparison.png");
  for (const plant of ["spring", "tank"]) {
    await page.getByLabel("Plant", { exact: true }).selectOption(plant);
    await page.getByRole("button", { name: "Overshoot" }).click();
    // Scrubbing is deterministic and works without animation, including reduced motion.
    const time = page.getByRole("slider", { name: "Time", exact: true });
    await time.focus();
    await time.press("End");
    await expect(
      page.getByRole("region", { name: "Interactive PID simulator" })
    ).toHaveScreenshot(`pid-${plant}.png`);
  }
});
