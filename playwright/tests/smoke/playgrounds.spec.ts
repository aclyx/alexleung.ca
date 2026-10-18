import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

test("ray room renders, responds to light controls, and inspects real samples", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await gotoAndStabilize(page, "/experimental/ray-tracing/");
  const status = page.getByRole("status");
  await expect(status).toContainText("Render complete", { timeout: 60_000 });
  const image = page.getByRole("img", { name: /Path-traced room/ });
  const initial = await image.evaluate((node) =>
    node instanceof HTMLCanvasElement ? node.toDataURL() : ""
  );
  const light = page.getByRole("button", { name: /Move light:/ });
  await light.focus();
  await light.press("ArrowRight");
  await expect(
    page.getByRole("slider", { name: "Light horizontal position" })
  ).toHaveValue("-0.4");
  await expect
    .poll(
      async () =>
        (await image.evaluate((node) =>
          node instanceof HTMLCanvasElement ? node.toDataURL() : ""
        )) !== initial,
      { timeout: 60_000 }
    )
    .toBe(true);
  await expect(status).toContainText("Render complete", { timeout: 60_000 });
  await page.getByRole("checkbox", { name: "Inspect a pixel" }).check();
  await image.focus();
  await image.press("ArrowRight");
  await expect(
    page.getByText("Pixel 106, 150 · sample 1", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Next sampled path" }).click();
  await expect(
    page.getByText("Pixel 106, 150 · sample 2", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Selected sample path/ })
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Surface interactions" })
    .selectOption("1");
  await expect(
    page.getByText("Pixel 106, 150 · sample 1", { exact: true })
  ).toBeVisible();
  await expect(status).toContainText("Render complete", { timeout: 60_000 });
});
test("ray rendering can pause, resume and discard a replaced scene", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await gotoAndStabilize(page, "/experimental/ray-tracing/");
  const pause = page.getByRole("button", {
    name: "Pause rendering",
    exact: true,
  });
  await expect(pause).toBeEnabled({ timeout: 60_000 });
  await pause.click();
  await expect(page.getByRole("status")).toContainText("Paused");
  await page.getByRole("button", { name: "Resume rendering" }).click();
  await page
    .getByRole("combobox", { name: "Scene", exact: true })
    .selectOption("1");
  await page
    .getByRole("combobox", { name: "Scene", exact: true })
    .selectOption("2");
  await expect(
    page.getByRole("checkbox", { name: "Colored walls" })
  ).not.toBeChecked();
  await expect(page.getByRole("status")).toContainText("Render complete", {
    timeout: 60_000,
  });
  await page.getByRole("button", { name: "Refine to 128 samples" }).click();
  await expect(page.getByRole("status")).toContainText("/ 128");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("/ 32");
});

test("seam comparison uses equal output dimensions and preserves painted protection", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/seam-carving/");
  await expect(page.getByRole("status")).toContainText("Ready.", {
    timeout: 20_000,
  });
  const image = page.getByRole("img", {
    name: "Content-aware resized photograph",
  });
  const sizes = await page
    .locator("figure canvas")
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        node instanceof HTMLCanvasElement ? [node.width, node.height] : []
      )
    );
  expect(sizes).toHaveLength(3);
  expect(sizes[0]).toEqual(sizes[1]);
  expect(sizes[0]).toEqual(sizes[2]);
  await page.getByRole("button", { name: "Paint protection" }).click();
  await expect(page.getByText("Nothing painted yet.")).toBeVisible();
  const source = page.getByRole("img", {
    name: /Paint protection on the original/,
  });
  await source.focus();
  await source.press("Enter");
  await expect(page.getByTestId("protected-pixels")).toContainText(
    "protection on"
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Ready.");
  await expect(page.getByRole("slider", { name: "Output width" })).toHaveValue(
    "100"
  );
  const width = page.getByRole("slider", { name: "Output width" });
  await width.focus();
  await width.press("ArrowLeft");
  await expect(page.getByRole("status")).toContainText("Ready.");
  await expect(image).toHaveAttribute("width", "624");
  await page.getByText("Inspect the seams").click();
  await expect(
    page.getByRole("img", { name: /Gradient energy/ })
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Image", exact: true })
    .selectOption("pattern");
  await expect(page.getByTestId("carved-size")).toHaveText("173 × 160");
});
test("painted protection changes seams and can be bypassed without losing the mask", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/seam-carving/");
  await expect(page.getByRole("status")).toContainText("Ready.", {
    timeout: 20_000,
  });
  await page
    .getByRole("combobox", { name: "Image", exact: true })
    .selectOption("pattern");
  await expect(page.getByTestId("carved-size")).toHaveText("173 × 160");
  await expect(page.getByRole("status")).toContainText("Ready.");
  const result = page.getByRole("img", {
    name: "Content-aware resized photograph",
    exact: true,
  });
  const pixels = () =>
    result.evaluate((node) =>
      node instanceof HTMLCanvasElement ? node.toDataURL() : ""
    );
  const unprotected = await pixels();
  await page.getByRole("button", { name: "Paint protection" }).click();
  const source = page.getByRole("img", {
    name: /Paint protection on the original/,
  });
  await source.focus();
  for (let i = 0; i < 15; i++) await source.press("ArrowLeft");
  await source.press("Enter");
  await expect
    .poll(async () => (await pixels()) !== unprotected, { timeout: 20_000 })
    .toBe(true);
  await expect(page.getByRole("status")).toContainText("Ready.");
  const protectedResult = await pixels();
  const toggle = page.getByRole("checkbox", { name: "Use painted protection" });
  await toggle.uncheck();
  await expect(page.getByTestId("protected-pixels")).toContainText(
    "protection off"
  );
  await expect.poll(async () => (await pixels()) === unprotected).toBe(true);
  await toggle.check();
  await expect
    .poll(async () => (await pixels()) === protectedResult)
    .toBe(true);
  await page.getByRole("button", { name: "Clear protection" }).click();
  await expect(toggle).toHaveCount(0);
  await expect(page.getByText("Nothing painted yet.")).toBeVisible();
  await expect.poll(async () => (await pixels()) === unprotected).toBe(true);
});

test("shelved prototypes are not served or linked", async ({
  page,
  request,
}) => {
  await gotoAndStabilize(page, "/");
  for (const route of ["town-builder", "memory-allocator"]) {
    const path = "/experimental/" + route + "/";
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    await expect(page.locator(`a[href="${path}"]`)).toHaveCount(0);
  }
});

test("image uploads stay local and cancel earlier processing", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/seam-carving/");
  await expect(page.getByRole("status")).toContainText("Ready.", {
    timeout: 20_000,
  });
  const requests: Array<{ url: string; method: string }> = [];
  page.on("request", (request) =>
    requests.push({ url: request.url(), method: request.method() })
  );
  await page.getByLabel("Open image").setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64"
    ),
  });
  await expect(
    page.getByRole("combobox", { name: "Image", exact: true })
  ).toHaveValue("uploaded");
  await expect(page.getByTestId("carved-size")).toHaveText("2 × 2");
  const origin = new URL(page.url()).origin;
  for (const request of requests) {
    const url = new URL(request.url);
    expect(request.method).toBe("GET");
    expect(
      url.protocol === "blob:" ||
        (url.origin === origin &&
          (url.pathname.includes("/_next/") || url.pathname.endsWith(".txt")))
    ).toBe(true);
  }
  await page.getByLabel("Open image").setInputFiles({
    name: "bad.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(page.getByRole("status")).toContainText(
    "Choose a PNG, JPEG, or WebP under 8 MB"
  );
  await expect(page.getByTestId("carved-size")).toHaveText("2 × 2");
});

for (const route of ["ray-tracing", "seam-carving"]) {
  test(route + " fits mobile and reduced motion", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoAndStabilize(page, "/experimental/" + route + "/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "More playgrounds" })
        .getByRole("link")
    ).toHaveCount(2);
    for (const element of await page
      .locator(
        "main select,main button:not([aria-pressed]),main input:not([type=checkbox]),main summary"
      )
      .filter({ visible: true })
      .all()) {
      const rect = await element.boundingBox();
      expect(rect?.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://alexleung.ca/experimental/" + route + "/"
    );
  });
}

for (const experiment of [
  {
    route: "ray-tracing",
    link: "Ray-tracing room →",
    heading: "Ray-tracing Room",
  },
  {
    route: "seam-carving",
    link: "Content-aware resizing →",
    heading: "Content-aware Resizing",
  },
]) {
  test(
    experiment.route + " is discoverable from the homepage",
    async ({ page }) => {
      await gotoAndStabilize(page, "/");
      const path = "/experimental/" + experiment.route + "/";
      const link = page
        .getByRole("region", { name: "Browser tools" })
        .getByRole("link", { name: experiment.link });
      await expect(link).toHaveAttribute("href", path);
      await link.click();
      await expect(page).toHaveURL(path);
      await expect(
        page.getByRole("heading", { level: 1, name: experiment.heading })
      ).toBeVisible();
      await expect(
        page.locator('meta[name="robots"][content*="noindex"]')
      ).toHaveCount(0);
      const sitemap = await page.request.get("/sitemap.xml");
      expect(sitemap.ok()).toBe(true);
      expect(await sitemap.text()).toContain(
        `<loc>https://alexleung.ca${path}</loc>`
      );
      const llms = await page.request.get("/llms.txt");
      expect(llms.ok()).toBe(true);
      expect(await llms.text()).toContain(`https://alexleung.ca${path}`);
    }
  );
}
