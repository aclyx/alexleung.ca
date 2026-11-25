import { expect, test, type Page } from "@playwright/test";

async function openBench(page: Page) {
  await page.route("**/CHIPS.DAT", (route) => route.abort());
  await page.goto("/experimental/patch-bay/");
  await expect(page.getByRole("heading", { name: "Bench test" })).toBeVisible();
}

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
  await openBench(page);
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

test("the D-pad repeats while held and stops on release", async ({
  page,
  hasTouch,
  browserName,
}) => {
  await page.clock.install();
  await openBench(page);
  await page.clock.pauseAt(new Date(Date.now() + 60_000));
  const right = page.getByRole("button", { name: "Move right" });
  const point = await right.evaluate((button) => {
    const r = button.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  const touch =
    hasTouch && browserName === "chromium"
      ? await page.context().newCDPSession(page)
      : null;
  if (touch) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
  } else {
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
  }
  await page.clock.runFor(320);
  if (touch) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else await page.mouse.up();
  await page.clock.runFor(1000);

  // The first chip is three tiles east. The hold moves two, then release stops it.
  const chips = page.locator("output").first();
  await expect(chips).toHaveText("02");
  if (hasTouch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await page.clock.runFor(250);
  await expect(chips).toHaveText("01");
});

test("gameplay blocks selection and the Guide remembers the joystick", async ({
  page,
}) => {
  await openBench(page);
  await expect(page.locator("button[data-direction] svg")).toHaveCount(4);
  const title = page.getByRole("heading", { name: "Bench test" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await title.dblclick();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe("");
  await page.getByRole("button", { name: "Guide" }).click();
  await expect(page.getByRole("dialog")).toHaveCSS(
    "-webkit-user-select",
    "text"
  );
  const controls = page.getByLabel("Touch controls");
  await expect(controls).toHaveValue("arrows");
  await controls.selectOption({ label: "Joystick" });
  await page.getByRole("button", { name: "Close menu" }).click();
  const joystick = page.getByRole("group", { name: "Movement touchpad" });
  await expect(joystick).toBeVisible();
  await page.reload();
  await expect(joystick).toBeVisible();
  await page.getByRole("button", { name: "Guide" }).click();
  await controls.selectOption({ label: "D-pad" });
  await page.reload();
  await expect(page.getByRole("button", { name: "Move left" })).toBeEnabled();
});
