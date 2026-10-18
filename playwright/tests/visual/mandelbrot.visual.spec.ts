import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

test("Mandelbrot explorer top fold stays visually stable", async ({ page }) => {
  test.setTimeout(45_000);

  await gotoAndStabilize(
    page,
    "/experimental/mandelbrot/?backend=cpu&iter=100&quality=0.5"
  );
  await expect(page.getByRole("status")).toContainText("1x", {
    timeout: 30_000,
  });

  await expect(page).toHaveScreenshot("mandelbrot-explorer-top-fold.png");

  const controls = page.locator("details").first().locator("..");

  await controls.scrollIntoViewIfNeeded();
  await expect(controls).toHaveScreenshot("mandelbrot-explorer-controls.png");
});
