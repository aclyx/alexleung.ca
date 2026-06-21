import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

const deepZoomPath =
  "/experimental/mandelbrot/?cx=-0.743643887045151&cy=0.13182590421333&w=1e-13&iter=2000&quality=1";

test("Mandelbrot deep zoom renders a responsive precision preview", async ({
  page,
}) => {
  await gotoAndStabilize(page, deepZoomPath);

  await expect(
    page.getByRole("heading", { name: "Mandelbrot Explorer" })
  ).toBeVisible();
  await expect(page.getByText("Render ready")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByText(
      "Ready at 100% perturbation deep-zoom render (2000 iterations)."
    )
  ).toBeVisible();
  await expect(page.getByText("Backend: CPU")).toBeVisible();
  await expect(page.getByTestId("mandelbrot-width")).toHaveText(
    "0.0000000000001"
  );
  const sampledColorCount = await page
    .getByLabel("Mandelbrot set rendering canvas")
    .evaluate((canvas) => {
      if (!(canvas instanceof HTMLCanvasElement)) {
        return 0;
      }

      const context = canvas.getContext("2d");

      if (!context || canvas.width === 0 || canvas.height === 0) {
        return 0;
      }

      const colors = new Set<string>();
      const sampleFractions = [0.2, 0.4, 0.6, 0.8];

      for (const yFraction of sampleFractions) {
        for (const xFraction of sampleFractions) {
          const x = Math.min(
            canvas.width - 1,
            Math.max(0, Math.floor(canvas.width * xFraction))
          );
          const y = Math.min(
            canvas.height - 1,
            Math.max(0, Math.floor(canvas.height * yFraction))
          );
          const [red, green, blue, alpha] = context.getImageData(
            x,
            y,
            1,
            1
          ).data;

          colors.add(`${red},${green},${blue},${alpha}`);
        }
      }

      return colors.size;
    });

  expect(sampledColorCount).toBeGreaterThan(1);

  const plotControls = page.getByText("Plot controls").locator("xpath=..");
  const zoomButton = page.getByRole("button", { name: "Zoom in" }).first();
  const plotBox = await plotControls.boundingBox();
  const zoomBox = await zoomButton.boundingBox();

  expect(plotBox).not.toBeNull();
  expect(zoomBox).not.toBeNull();

  if (!plotBox || !zoomBox) {
    return;
  }

  const overlaps =
    plotBox.x < zoomBox.x + zoomBox.width &&
    plotBox.x + plotBox.width > zoomBox.x &&
    plotBox.y < zoomBox.y + zoomBox.height &&
    plotBox.y + plotBox.height > zoomBox.y;

  expect(overlaps).toBe(false);
});
