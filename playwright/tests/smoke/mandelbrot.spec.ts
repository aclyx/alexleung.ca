import type { Locator, Page } from "@playwright/test";

import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

const explorerPath =
  "/experimental/mandelbrot/?backend=cpu&iter=100&quality=0.5";
const deepZoomWidth =
  "0.0000000000000000000000000000000222402701568815166612313740442";
const deepZoomPath = `/experimental/mandelbrot/?cx=-0.838782074550394572901608663741&cy=0.194257392096992991702889593945&w=${deepZoomWidth}&backend=cpu&iter=4000&quality=0.5`;

async function sampledMandelbrotColorCount(page: Page) {
  return page.getByTestId("mandelbrot-render-canvas").evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return 0;
    }

    const context = canvas.getContext("2d");

    if (!context || canvas.width === 0 || canvas.height === 0) {
      return 0;
    }

    const colors = new Set<string>();
    const columns = 24;
    const rows = 12;

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

async function sampledMandelbrotSignature(page: Page) {
  return page.getByTestId("mandelbrot-render-canvas").evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return 0;
    }

    const context = canvas.getContext("2d");

    if (!context || canvas.width === 0 || canvas.height === 0) {
      return 0;
    }

    let hash = 2_166_136_261;
    const columns = 24;
    const rows = 12;

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

        for (const channel of context.getImageData(pixelX, pixelY, 1, 1).data) {
          hash ^= channel;
          hash = Math.imul(hash, 16_777_619);
        }
      }
    }

    return hash >>> 0;
  });
}

function disclosure(page: Page, name: string) {
  return page.locator("details").filter({ hasText: name });
}

async function openDisclosure(page: Page, name: string) {
  const details = disclosure(page, name);

  await expect(details).not.toHaveAttribute("open", "");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
}

async function dispatchWheel(
  canvas: Locator,
  modifiers: { ctrlKey?: boolean; metaKey?: boolean } = {}
) {
  return canvas.evaluate(
    (element, eventModifiers) =>
      new Promise<boolean>((resolve) => {
        element.addEventListener(
          "wheel",
          (event) => resolve(event.defaultPrevented),
          { once: true }
        );
        element.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            clientX: 200,
            clientY: 120,
            deltaY: -80,
            ...eventModifiers,
          })
        );
      }),
    modifiers
  );
}

test("Mandelbrot renders and supports pointer, keyboard, and mobile-safe navigation", async ({
  page,
}, testInfo) => {
  test.setTimeout(45_000);

  await gotoAndStabilize(page, explorerPath);

  await expect(
    page.getByRole("heading", { name: "Mandelbrot Explorer" })
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("1x", {
    timeout: 30_000,
  });

  await expect(page.getByRole("button", { name: "Undo view" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Undo view" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Zoom in" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Zoom out" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Reset" })).toHaveCount(1);
  await expect(page.getByLabel("Color palette")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Box zoom mode" })).toHaveCount(
    0
  );
  await expect(page.getByRole("button", { name: "Redo" })).toHaveCount(0);
  await expect(page.getByText("Point inspector")).toHaveCount(0);
  await expect(page.getByText("Implementation notes")).toHaveCount(0);

  for (const name of ["Render settings", "Coordinates"]) {
    await expect(disclosure(page, name)).not.toHaveAttribute("open", "");
  }
  await expect(page.getByText("Pan controls", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Advanced rendering", { exact: true })
  ).toHaveCount(0);

  expect(await sampledMandelbrotColorCount(page)).toBeGreaterThan(8);

  const pageWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client);

  await openDisclosure(page, "Coordinates");

  const width = page.getByTestId("viewport-width");
  const initialWidth = await width.textContent();
  const centerX = page.getByTestId("viewport-center-x");
  const initialCenterX = await centerX.textContent();
  const canvas = page.getByLabel(/Interactive Mandelbrot set/i);

  const ordinaryWheelWidth = await width.textContent();
  expect(await dispatchWheel(canvas)).toBe(false);
  await page.waitForTimeout(200);
  await expect(width).toHaveText(ordinaryWheelWidth ?? "");

  expect(await dispatchWheel(canvas, { ctrlKey: true })).toBe(false);
  await page.waitForTimeout(200);
  await expect(width).toHaveText(ordinaryWheelWidth ?? "");

  await canvas.scrollIntoViewIfNeeded();
  const canvasBox = await canvas.boundingBox();
  const initialRenderSignature = await sampledMandelbrotSignature(page);

  expect(canvasBox).not.toBeNull();

  if (!testInfo.project.name.startsWith("mobile-")) {
    if (canvasBox) {
      await page.mouse.move(
        canvasBox.x + canvasBox.width / 2,
        canvasBox.y + canvasBox.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        canvasBox.x + canvasBox.width / 2 + 48,
        canvasBox.y + canvasBox.height / 2
      );

      await expect(centerX).not.toHaveText(initialCenterX ?? "");
      await expect
        .poll(() => sampledMandelbrotSignature(page), { timeout: 30_000 })
        .not.toBe(initialRenderSignature);
      await expect(page.getByRole("status")).toContainText("1x", {
        timeout: 30_000,
      });
      await expect(
        page.getByTestId("mandelbrot-render-canvas").locator("..")
      ).not.toHaveAttribute("style", /translate/);
      expect(await sampledMandelbrotColorCount(page)).toBeGreaterThan(8);

      await page.mouse.up();
      await expect(page.getByRole("status")).toContainText("1x", {
        timeout: 30_000,
      });
      expect(await sampledMandelbrotColorCount(page)).toBeGreaterThan(8);
      await expect(
        page.getByRole("button", { name: "Undo view" })
      ).toBeEnabled();
    }
  }

  if (testInfo.project.name === "mobile-chromium-smoke" && canvasBox) {
    const client = await page.context().newCDPSession(page);
    const startX = canvasBox.x + canvasBox.width / 2;
    const startY = canvasBox.y + canvasBox.height / 2;

    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        {
          force: 1,
          id: 1,
          radiusX: 1,
          radiusY: 1,
          x: startX,
          y: startY,
        },
      ],
    });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          force: 1,
          id: 1,
          radiusX: 1,
          radiusY: 1,
          x: startX + 48,
          y: startY,
        },
      ],
    });

    await expect(centerX).not.toHaveText(initialCenterX ?? "");
    await expect
      .poll(() => sampledMandelbrotSignature(page), { timeout: 30_000 })
      .not.toBe(initialRenderSignature);
    await expect(page.getByRole("status")).toContainText("1x", {
      timeout: 30_000,
    });
    expect(await sampledMandelbrotColorCount(page)).toBeGreaterThan(8);
    const previewCenterX = await centerX.textContent();

    await client.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    await expect(centerX).toHaveText(previewCenterX ?? "");
    await expect(page.getByRole("button", { name: "Undo view" })).toBeEnabled();
    await expect(page.getByRole("status")).toContainText("1x", {
      timeout: 30_000,
    });
    expect(await sampledMandelbrotColorCount(page)).toBeGreaterThan(8);
  }

  const beforeZoomWidth = await width.textContent();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(width).not.toHaveText(initialWidth ?? "");
  await expect(page.getByRole("button", { name: "Undo view" })).toBeEnabled();
  await page.getByRole("button", { name: "Undo view" }).click();
  await expect(width).toHaveText(beforeZoomWidth ?? "");

  const keyboardStartCenterX = await centerX.textContent();

  await canvas.focus();
  await canvas.press("ArrowRight");
  await expect(centerX).not.toHaveText(keyboardStartCenterX ?? "");

  const disclosedPanStartCenterX = await centerX.textContent();
  await page.getByRole("button", { name: "Pan left" }).click();
  await expect(centerX).not.toHaveText(disclosedPanStartCenterX ?? "");

  await openDisclosure(page, "Render settings");
  await expect(page.getByLabel("Maximum iterations")).toHaveValue("100");
  await expect(page.getByLabel("Render backend")).toHaveCount(0);
  await expect(page.getByLabel("Render quality")).toHaveCount(0);
  await expect(page.getByLabel("Coloring mode")).toHaveCount(0);

  await page.getByLabel("Color palette").selectOption("glacier");
  await expect(page.getByLabel("Color palette")).toHaveValue("glacier");

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(width).toHaveText(initialWidth ?? "");

  const touchAction = await canvas.evaluate(
    (element) => getComputedStyle(element).touchAction
  );

  expect(touchAction).toBe("none");
});

test("Mandelbrot keeps a bounded deep zoom responsive", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-smoke",
    "The deep worker render is covered once in desktop Chromium."
  );
  test.setTimeout(45_000);

  await gotoAndStabilize(page, deepZoomPath);

  await expect
    .poll(() => sampledMandelbrotColorCount(page), { timeout: 30_000 })
    .toBeGreaterThan(8);
  await openDisclosure(page, "Coordinates");
  await expect(page.getByTestId("viewport-width")).toHaveText(
    "0.0000000000000000000000000000000222402701568815167"
  );
  expect(await sampledMandelbrotColorCount(page)).toBeGreaterThan(8);
});
