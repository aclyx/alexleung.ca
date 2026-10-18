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
  const numericGain = page.getByRole("spinbutton", { name: "Kp value" });
  await numericGain.fill("20.13");
  await numericGain.press("Enter");
  await expect(gain).toHaveValue("20.13");
  await gain.press("ArrowRight");
  await expect(gain).toHaveValue("20.63");
  await expect(numericGain).toHaveValue("20.63");
  await gain.press("ArrowLeft");
  await expect(gain).toHaveValue("20.13");
  await numericGain.fill("-0.13");
  await numericGain.press("Tab");
  await expect(gain).toBeFocused();
  await expect(gain).toHaveValue("-0.13");
  await numericGain.fill("1001");
  await numericGain.press("Tab");
  await expect(numericGain).toHaveValue("-0.13");
  await page.getByRole("button", { name: "Reset gains" }).click();
  await expect(curve).toHaveAttribute("d", initial!);
  await expect(page.getByText(/Snapshot: Kp/)).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://alexleung.ca/experimental/pid-controller/"
  );
  await expect(page.getByRole("link", { name: /Mandelbrot/ })).toHaveCount(0);
});

test("physical presets move with the playhead and playback pauses and restarts", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/pid-controller/");
  const time = page.getByRole("slider", { name: "Time", exact: true });
  const cursor = page.getByTestId("response-playhead");
  const plant = page.getByLabel("Plant", { exact: true });
  await expect(plant.locator("option")).toHaveCount(3);
  await expect(page.getByText(/Edit plant equation/)).toHaveCount(0);
  for (const id of ["plate", "spring", "tank"]) {
    await plant.selectOption(id);
    await expect(page.getByTestId("physical-plant")).toHaveAttribute(
      "data-plant",
      id
    );
    await expect(cursor).toHaveAttribute("data-time", "0");
    const initial = await page.getByTestId("plant-output").textContent();
    await time.focus();
    await time.press("End");
    await expect(cursor).toHaveAttribute("data-time", "20");
    await expect(page.getByTestId("plant-output")).not.toHaveText(initial!);
    await expect(page.getByRole("button", { name: "Replay" })).toBeVisible();
  }
  await page.getByRole("button", { name: "Replay" }).click();
  await expect
    .poll(async () => Number(await cursor.getAttribute("data-time")))
    .toBeGreaterThan(0.1);
  await page.getByRole("button", { name: "Pause" }).click();
  const paused = await cursor.getAttribute("data-time");
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(cursor).toHaveAttribute("data-time", paused!);
  await time.focus();
  await time.press("End");
  await time.press("ArrowLeft");
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Replay" })).toBeVisible();
  await page.getByRole("button", { name: "Overshoot" }).click();
  await expect(cursor).toHaveAttribute("data-time", "0");
  await expect(
    page
      .getByRole("region", { name: "Interactive PID simulator" })
      .getByRole("alert")
  ).toHaveCount(0);
});

for (const width of [360, 768, 1280]) {
  test(`PID simulator fits ${width}px and keeps controls usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoAndStabilize(page, "/experimental/pid-controller/");
    for (const id of ["plate", "spring", "tank"]) {
      await page.getByLabel("Plant", { exact: true }).selectOption(id);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      await expect(
        page.getByRole("img", { name: /Physical view/ })
      ).toBeVisible();
    }
    for (const control of await page
      .locator("main button, main input, main select, main summary")
      .all()) {
      const bounds = await control.boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
    }
    await expect(
      page.getByRole("img", { name: /PID step response/ })
    ).toBeVisible();
    const play = await page
      .getByRole("button", { name: "Play", exact: true })
      .boundingBox();
    const physical = await page.getByTestId("physical-plant").boundingBox();
    expect(play!.y + play!.height).toBeLessThan(physical!.y);
  });
}
