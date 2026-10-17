import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

test("PID presets, keyboard tuning, snapshots, and reset work", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/pid-controller/");
  const curve = page.getByTestId("pid-response-curve");
  const initial = await curve.getAttribute("d");
  await page.getByRole("button", { name: "Take snapshot" }).click();
  await page.getByRole("button", { name: "Steady offset" }).click();
  await expect(curve).not.toHaveAttribute("d", initial!);
  await expect(page.getByText("Snapshot: Kp 20, Ki 10, Kd 0.")).toBeVisible();
  const gain = page.getByRole("slider", { name: /Proportional/ });
  await gain.focus();
  await gain.press("ArrowRight");
  await expect(gain).toHaveValue("20.5");
  await expect(
    page.getByRole("button", { name: "Steady offset" })
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Reset gains" }).click();
  await expect(curve).toHaveAttribute("d", initial!);
  await expect(page.getByText(/Snapshot: Kp/)).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://alexleung.ca/experimental/pid-controller/"
  );
  await expect(page.getByRole("link", { name: /Mandelbrot/ })).toHaveCount(0);
});

test("physical plants and custom equations work with visible validation", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/pid-controller/");
  const error = page
    .getByRole("region", { name: "Interactive PID simulator" })
    .getByRole("alert");
  await page.getByLabel("Plant", { exact: true }).selectOption("spring");
  await expect(
    page.getByRole("img", { name: /Spring–mass–damper/ })
  ).toBeVisible();
  await page.getByRole("button", { name: "Take snapshot" }).click();
  await page
    .locator("summary")
    .filter({ hasText: "Edit plant equation" })
    .click();
  const equation = page.getByLabel("d²y/dt² =", { exact: true });
  await equation.fill("window.alert(1)");
  await page.getByRole("button", { name: "Apply plant" }).click();
  await expect(error).toBeVisible();
  await expect(page.getByText(/Snapshot: Kp/)).toBeVisible();
  await equation.fill("u - 0.8*v - 2*y");
  await page.getByLabel("Initial velocity · v(0)").fill("0.2");
  await page.getByRole("button", { name: "Apply plant" }).click();
  await expect(page.getByLabel("Plant", { exact: true })).toHaveValue("custom");
  await expect(error).toHaveCount(0);
  await expect(page.getByText(/Snapshot: Kp/)).toHaveCount(0);
  await expect(
    page.getByRole("group", { name: "Controller presets" })
  ).toHaveCount(0);
  const numericGain = page.getByRole("spinbutton", { name: "Kp value" });
  await numericGain.fill("-0.5");
  await numericGain.press("Enter");
  await expect(page.getByRole("slider", { name: /Proportional/ })).toHaveValue(
    "-0.5"
  );
  await page
    .locator("summary")
    .filter({ hasText: "Edit plant equation" })
    .click();
  await page.getByLabel("d²y/dt² =", { exact: true }).fill("sqrt(-1)");
  await page.getByRole("button", { name: "Apply plant" }).click();
  await expect(error).toContainText("undefined");
  await expect(page.getByTestId("pid-response-curve")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Take snapshot" })
  ).toBeDisabled();
  await page.getByLabel("Plant", { exact: true }).selectOption("tank");
  await expect(page.getByRole("img", { name: /Draining tank/ })).toBeVisible();
  await expect(error).toHaveCount(0);
});

for (const width of [360, 768, 1280]) {
  test(`PID simulator fits ${width}px and keeps controls usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoAndStabilize(page, "/experimental/pid-controller/");
    await page
      .locator("summary")
      .filter({ hasText: "Edit plant equation" })
      .click();
    await page.getByLabel("Equation order").selectOption("2");
    for (const control of await page
      .locator("main button, main input, main select, main summary")
      .all()) {
      const bounds = await control.boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await expect(
      page.getByRole("img", { name: /PID step response/ })
    ).toBeVisible();
  });
}
