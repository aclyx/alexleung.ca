import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

const deepZoomPath =
  "/experimental/mandelbrot/?cx=-0.743643887037151&cy=0.13182590420533&w=1e-13&iter=2000&quality=1";

test("Mandelbrot deep zoom renders a responsive precision preview", async ({
  page,
}) => {
  await gotoAndStabilize(page, deepZoomPath);

  await expect(
    page.getByRole("heading", { name: "Mandelbrot Explorer" })
  ).toBeVisible();
  await expect(page.getByText("Render ready")).toBeVisible({
    timeout: 8_000,
  });
  await expect(
    page.getByText("Ready at 5% deep-zoom preview (100 iterations).")
  ).toBeVisible();
  await expect(page.getByText("Backend: CPU")).toBeVisible();
  await expect(page.getByTestId("mandelbrot-width")).toHaveText(
    "0.0000000000001"
  );

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
