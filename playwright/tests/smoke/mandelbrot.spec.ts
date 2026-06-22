import type { Page } from "@playwright/test";

import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

const deepZoomPath =
  "/experimental/mandelbrot/?cx=-0.743643887045151&cy=0.13182590421333&w=1e-13&iter=2000&quality=1";
const reportedDeepZoomPath =
  "/experimental/mandelbrot/?cx=-0.838782074550394572901608663741&cy=0.194257392096992991702889593945&w=0.0000000000000000000000000000000222402701568815166612313740442&iter=2000&quality=1";
const deepZoomRenderTimeoutMs = 45_000;

test.describe.configure({ mode: "serial" });

async function sampledMandelbrotColorCount(page: Page) {
  return page
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
      const columns = 32;
      const rows = 16;

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          const pixelX = Math.min(
            canvas.width - 1,
            Math.floor(((x + 0.5) * canvas.width) / columns)
          );
          const pixelY = Math.min(
            canvas.height - 1,
            Math.floor(((y + 0.5) * canvas.height) / rows)
          );
          const [red, green, blue, alpha] = context.getImageData(
            pixelX,
            pixelY,
            1,
            1
          ).data;

          colors.add(`${red},${green},${blue},${alpha}`);
        }
      }

      return colors.size;
    });
}

test("Mandelbrot deep zoom renders a responsive precision preview", async ({
  page,
}) => {
  test.setTimeout(90_000);

  await gotoAndStabilize(page, deepZoomPath);

  await expect(
    page.getByRole("heading", { name: "Mandelbrot Explorer" })
  ).toBeVisible();
  await expect(
    page.getByText(
      "Ready at 100% perturbation deep-zoom render (2000 iterations)."
    )
  ).toBeVisible({
    timeout: deepZoomRenderTimeoutMs,
  });
  await expect(page.getByText("Render ready")).toBeVisible();
  await expect(page.getByText("Backend: CPU")).toBeVisible();
  await expect(page.getByTestId("mandelbrot-width")).toHaveText(
    "0.0000000000001"
  );
  const sampledColorCount = await sampledMandelbrotColorCount(page);

  expect(sampledColorCount).toBeGreaterThan(20);

  const canvas = page.getByLabel("Mandelbrot set rendering canvas");
  const canvasBox = await canvas.boundingBox();

  expect(canvasBox).not.toBeNull();

  if (!canvasBox) {
    return;
  }

  await page.mouse.click(
    canvasBox.x + canvasBox.width / 2,
    canvasBox.y + canvasBox.height / 2
  );
  await expect(page.getByTestId("mandelbrot-width")).toHaveText(
    "0.00000000000005"
  );
  await page
    .getByText("Rendering perturbation deep-zoom frame...")
    .waitFor({ state: "visible", timeout: 5_000 })
    .catch(() => undefined);
  await expect(
    page.getByText(
      "Ready at 100% perturbation deep-zoom render (2000 iterations)."
    )
  ).toBeVisible({
    timeout: deepZoomRenderTimeoutMs,
  });

  expect(await sampledMandelbrotColorCount(page)).toBeGreaterThan(20);

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

test("Mandelbrot 1e32x zoom keeps visible detail", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-smoke",
    "The reported deep viewport is covered once in desktop Chromium to keep smoke runtime bounded."
  );
  test.setTimeout(60_000);

  await gotoAndStabilize(page, reportedDeepZoomPath);

  await expect(
    page.getByText(
      "Ready at 50% perturbation deep-zoom render (3800 iterations)."
    )
  ).toBeVisible({
    timeout: 45_000,
  });

  expect(await sampledMandelbrotColorCount(page)).toBeGreaterThan(100);
});
