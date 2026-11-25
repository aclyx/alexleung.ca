import { expect, test } from "@playwright/test";

test("a bad campaign download leaves the practice board playable", async ({
  page,
}) => {
  let requested = false;
  await page.route("**/CHIPS.DAT", async (route) => {
    requested = true;
    await route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      contentType: "application/octet-stream",
      body: "Wrong Windows edition",
    });
  });
  await page.goto("/experimental/patch-bay/");
  await expect(page.getByRole("heading", { name: "Bench test" })).toBeVisible();
  expect(requested).toBe(true);
  expect(
    await page.evaluate(() => localStorage.getItem("patch-bay.v1.dat"))
  ).toBeNull();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Levels", exact: true }).click();
  await expect(page.getByText("Open CHIPS.DAT", { exact: true })).toBeVisible();
});

test("the bench celebrates the clear and focuses Replay", async ({
  page,
  hasTouch,
}) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await page.route("**/CHIPS.DAT", (route) =>
    route.fulfill({
      contentType: "application/octet-stream",
      headers: { "access-control-allow-origin": "*" },
      body: "No campaign",
    })
  );
  await page.goto("/experimental/patch-bay/");
  await expect(page.getByRole("heading", { name: "Bench test" })).toBeVisible();
  if (hasTouch) {
    await expect(
      page.getByRole("group", { name: "Movement touchpad" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).tap();
    await page.getByLabel("Touch controls").selectOption("arrows");
    await page.getByRole("button", { name: "Close menu" }).tap();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Move right" })
    ).toBeEnabled();
  }
  for (const dir of [
    "Right",
    "Right",
    "Right",
    "Up",
    "Up",
    "Left",
    "Left",
    "Right",
    "Down",
    "Down",
    "Down",
    "Right",
    "Right",
    "Down",
    "Down",
  ]) {
    if (hasTouch) {
      const button = page.getByRole("button", {
        name: "Move " + dir.toLowerCase(),
      });
      const center = await button.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      await page.touchscreen.tap(center.x, center.y);
    } else await page.keyboard.press("Arrow" + dir);
  }
  // The headless display can throttle paint callbacks even with the page focused.
  await page.clock.runFor(1000);
  const clear = page.getByRole("region", { name: "Nice work!" });
  await expect(clear.getByText("Bench test complete.")).toBeVisible();
  const replay = clear.getByRole("button", { name: "Replay" });
  await expect(replay).toBeFocused();
  if (hasTouch) await replay.tap();
  else await page.keyboard.press("Enter");
  await expect(clear).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start", exact: true })
  ).toBeVisible();
});
