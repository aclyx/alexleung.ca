import { expect, test, type Locator } from "@playwright/test";

import { saveCode } from "../../../src/features/clockwerx/progress";

test("Signal School teaches the four controls and hands off to Movement", async ({
  page,
  isMobile,
}) => {
  await page.clock.install();
  await page.goto("/experimental/last-local/");
  const display = page.getByRole("region", { name: "Game display" });
  const tip = display.locator("p");
  await expect(
    display.getByRole("heading", { name: "Signal School" })
  ).toBeVisible();
  async function hold(label: string, key: string, next: Locator) {
    const button = page.getByRole("button", { name: label, exact: true });
    await expect(button).toHaveAttribute("data-guided", "true");
    await expect(button).toBeEnabled();
    if (isMobile) {
      const bounds = (await button.boundingBox())!;
      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2
      );
      await page.mouse.down();
    } else await page.keyboard.down(key);
    try {
      // A full turn on Easy takes 2.13 seconds. Deliver its animation frames
      // while the control is held, even when a browser worker renders slowly.
      await page.clock.runFor(2300);
      await expect(next).toBeVisible();
    } finally {
      if (isMobile) await page.mouse.up();
      else await page.keyboard.up(key);
    }
  }
  await hold("Swing", "x", tip.filter({ hasText: "Hold Flip" }));
  await hold("Flip", "Shift", tip.filter({ hasText: "Hold Bounce" }));
  await hold("Bounce", "z", tip.filter({ hasText: "Tap Reverse" }));
  if (isMobile)
    await page.getByRole("button", { name: "Reverse", exact: true }).tap();
  else await page.keyboard.press("Space");
  await expect(tip).toContainText("grab the diamond");
  await hold(
    "Swing",
    "x",
    page.getByRole("heading", { name: "Training complete" })
  );
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0"
  );
  await page.getByRole("button", { name: "Start level 1" }).click();
  await expect(
    display.getByRole("heading", { name: "Movement" })
  ).toBeVisible();
  await page.reload();
  await expect(
    display.getByRole("heading", { name: "Movement" })
  ).toBeVisible();
});

test("music and sound effects can be muted independently before the first move", async ({
  page,
  isMobile,
}) => {
  const tracks: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp3")) tracks.push(r.url());
  });
  await page.goto("/experimental/last-local/");
  const menu = page.getByRole("dialog");
  const menuButton = page.getByRole("button", { name: "Menu", exact: true });
  const music = menu.getByRole("checkbox", { name: "Music", exact: true });
  const effects = menu.getByRole("checkbox", { name: "Sound effects" });
  await menuButton.click();
  await music.uncheck();
  await menu.getByRole("button", { name: "Close menu" }).click();
  const move = () =>
    isMobile
      ? page.getByRole("button", { name: "Reverse", exact: true }).tap()
      : page.keyboard.press("Space");
  await move();
  await expect(page.getByRole("button", { name: "Pause" })).toBeEnabled();
  await page.reload();
  await menuButton.click();
  await expect(music).not.toBeChecked();
  await expect(effects).toBeChecked();
  expect(tracks).toHaveLength(0);
  await effects.uncheck();
  await music.check();
  await menu.getByRole("button", { name: "Close menu" }).click();
  const trackLoaded = page.waitForResponse(
    (response) => response.url().endsWith(".mp3") && response.ok()
  );
  await move();
  await trackLoaded;
});

test("tutorial hints stay below the board and the full lesson is available from the menu", async ({
  page,
}) => {
  await page.goto("/experimental/last-local/");
  const menuButton = page.getByRole("button", { name: "Menu", exact: true });
  const menu = page.getByRole("dialog");
  await menuButton.click();
  await menu
    .getByRole("combobox", { name: "Level", exact: true })
    .selectOption("7");
  const display = page.getByRole("region", { name: "Game display" });
  const hint = display.locator("p");
  await expect(hint).toContainText("first spike");
  const board = await display.locator("canvas").boundingBox();
  const strip = await hint.boundingBox();
  expect(strip!.y).toBeGreaterThanOrEqual(board!.y + board!.height - 1);
  await menuButton.click();
  await menu.getByText("Level notes", { exact: true }).click();
  await expect(menu.getByText(/Wait for the green hand/)).toBeVisible();
  await menu.getByRole("checkbox", { name: /level hint/ }).uncheck();
  await menu.getByRole("button", { name: "Close menu" }).click();
  await page.reload();
  await expect(
    display.getByRole("heading", { name: "More Spikes" })
  ).toBeVisible();
  await expect(hint).toContainText("Reach the diamond");
});

test("Last Local fills the viewport, accepts input, pauses and remembers its skin", async ({
  page,
  isMobile,
}) => {
  await page.goto("/experimental/last-local/");
  await expect(
    page.getByRole("heading", { name: /^Last Local$/i })
  ).toBeVisible();
  const field = page.locator("canvas");
  await expect(field).toBeVisible();
  const swing = page.getByRole("button", { name: "Swing", exact: true });
  await expect(swing).toBeEnabled();
  await expect(swing).toHaveAccessibleDescription(
    "Hold to grab the next peg and change rotation."
  );
  await expect(page.locator("div[data-game-skin]")).toHaveAttribute(
    "data-game-skin",
    "rail"
  );
  const readyBoard = await field.boundingBox();
  if (isMobile) await swing.tap();
  else {
    await page.keyboard.down("x");
    await expect(swing).toHaveAttribute("data-held", "true");
    await page.keyboard.up("x");
  }
  await expect(swing).toHaveAttribute("data-held", "false");
  await expect.poll(() => field.boundingBox()).toEqual(readyBoard);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  const menu = page.getByRole("dialog");
  await expect(menu).toBeVisible();
  await menu.getByLabel("Appearance").selectOption("blueprint");
  await menu.getByLabel("Difficulty").selectOption("0");
  await menu.getByRole("button", { name: "Close menu" }).click();
  await page.reload();
  await expect(page.locator("div[data-game-skin]")).toHaveAttribute(
    "data-game-skin",
    "blueprint"
  );
  await expect(page.getByText("∞", { exact: true })).toBeVisible();
  const viewport = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
  }));
  expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.width);
  expect(viewport.documentHeight).toBeLessThanOrEqual(viewport.height + 1);
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" })
  ).toBeHidden();
  const reverse = await page
    .getByRole("button", { name: "Reverse", exact: true })
    .boundingBox();
  expect(reverse).not.toBeNull();
  expect(reverse?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test("the campaign opens on Signal School and progress transfers to a fresh browser", async ({
  page,
  browser,
}) => {
  await page.goto("/experimental/clockwerx/");
  const menu = page.getByRole("dialog");
  await expect(
    page.getByRole("heading", { name: "Signal School", exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await menu
    .getByRole("combobox", { name: "Level", exact: true })
    .selectOption("11");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await menu.getByRole("button", { name: /Skip level/ }).click();
  await expect(
    page.getByRole("heading", { name: "Homer", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Campaign completion" })
  ).toHaveAttribute("aria-valuenow", "0");
  for (const path of ["/experimental/kickturn/", "/experimental/last-local/"]) {
    await page.goto(path);
    await expect(page).toHaveTitle(/Last Local/);
    await expect(
      page.getByRole("heading", { name: "Homer", exact: true })
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await menu.getByText("Transfer progress", { exact: true }).click();
  const code = await menu.locator("output").innerText();
  const other = await browser.newPage();
  try {
    await other.goto(page.url());
    const menuButton = other.getByRole("button", { name: "Menu", exact: true });
    await expect(
      other.getByRole("heading", { name: "Signal School", exact: true })
    ).toBeVisible();
    await menuButton.click();
    await other.getByText("Transfer progress", { exact: true }).click();
    await other.getByLabel("Restore a progress code").fill(code);
    await other
      .getByRole("button", { name: "Restore progress", exact: true })
      .click();
    await expect(
      other.getByRole("heading", { name: "Homer", exact: true })
    ).toBeVisible();
    await menuButton.click();
    await expect(
      other.getByRole("button", { name: "Skip level (2 left)" })
    ).toBeVisible();
    await other
      .getByRole("combobox", { name: "Level", exact: true })
      .selectOption("0");
    await expect(
      other.getByRole("heading", { name: "Signal School" })
    ).toBeVisible();
    await menuButton.click();
    await other.getByRole("button", { name: "Return to level 12" }).click();
    await expect(other.getByRole("heading", { name: "Homer" })).toBeVisible();
  } finally {
    await other.close();
  }
});

test("the entire painted desk stays in frame as the window resizes", async ({
  page,
}) => {
  await page.goto("/experimental/last-local/");
  const frame = page.locator('div[data-game-skin="rail"] > div').first();
  for (const [width, height] of [
    [1024, 768],
    [1280, 1024],
    [900, 920],
    [2560, 1080],
    [390, 844],
    [320, 480],
  ]) {
    await page.setViewportSize({ width, height });
    const ratio = width / height > 7 / 8 ? 4 / 3 : 941 / 1672;
    const fittedWidth = Math.min(width, height * ratio);
    const fittedHeight = fittedWidth / ratio;
    await expect
      .poll(async () => {
        const bounds = await frame.boundingBox();
        if (!bounds) return Infinity;
        return Math.max(
          Math.abs(bounds.width - fittedWidth),
          Math.abs(bounds.height - fittedHeight),
          Math.abs(bounds.x - (width - fittedWidth) / 2),
          Math.abs(bounds.y - (height - fittedHeight) / 2)
        );
      })
      .toBeLessThan(1);
    const glass = await page
      .getByRole("region", { name: "Game display" })
      .boundingBox();
    expect(glass).not.toBeNull();
    expect(glass!.width / glass!.height).toBeGreaterThan(1);
    expect(glass!.width / glass!.height).toBeLessThan(1.35);
    await expect
      .poll(() =>
        page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
          const bounds = canvas.getBoundingClientRect();
          const density = Math.min(devicePixelRatio, 2);
          return Math.max(
            Math.abs(canvas.width - bounds.width * density),
            Math.abs(canvas.height - bounds.height * density)
          );
        })
      )
      .toBeLessThan(1);
  }
});

test("the route strip counts cleared boards on the selected difficulty", async ({
  page,
}) => {
  await page.goto("/experimental/last-local/");
  const meter = page.getByRole("progressbar", { name: "Campaign completion" });
  const menuButton = page.getByRole("button", { name: "Menu", exact: true });
  const dialog = page.getByRole("dialog");
  await expect(meter).toHaveText("0%");
  await menuButton.click();
  await dialog.getByText("Transfer progress", { exact: true }).click();
  const code = saveCode({
    difficulty: 1,
    current: 4,
    tutorial: 0b1011,
    frontier: 46,
    skipped: [12],
  });
  await dialog.getByLabel("Restore a progress code").fill(code);
  await dialog.getByRole("button", { name: "Restore progress" }).click();
  await expect(meter).toHaveText("37%");
  await expect(meter).toHaveAttribute(
    "aria-valuetext",
    "37 of 100 boards cleared on Easy"
  );
  await expect(meter.locator('[data-lit="true"]')).toHaveCount(1);
  await page.reload();
  await expect(meter).toHaveText("37%");
  await menuButton.click();
  await dialog.getByLabel("Difficulty").selectOption("0");
  await dialog.getByRole("button", { name: "Close menu" }).click();
  await expect(meter).toHaveText("0%");
});

test("the glossary identifies board symbols and preserves a paused attempt", async ({
  page,
  isMobile,
}) => {
  await page.goto("/experimental/last-local/");
  const reverse = page.getByRole("button", { name: "Reverse", exact: true });
  await expect(reverse).toBeEnabled();
  if (isMobile) await reverse.tap();
  else await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  const menu = page.getByRole("dialog");
  const showGlossary = menu.getByRole("button", {
    name: "Glossary",
    exact: true,
  });
  if (isMobile) await showGlossary.tap();
  else await showGlossary.press("Enter");
  await expect(menu).toHaveAccessibleName("Glossary");
  const search = menu.getByRole("searchbox", { name: "Find a term or symbol" });
  await search.fill("teal ring");
  await expect(menu.getByRole("term")).toHaveCount(1);
  await expect(menu.getByRole("term")).toHaveText("Way station (checkpoint)");
  await expect(menu.locator("canvas")).toBeVisible();
  await search.fill("child");
  await expect(menu.getByRole("definition")).toContainText("Unlimited time");
  await search.fill("unlisted");
  await expect(menu.getByRole("status")).toContainText("No matching entries");
  await menu.getByRole("button", { name: "Game menu", exact: true }).click();
  await expect(
    menu.getByRole("combobox", { name: "Difficulty", exact: true })
  ).toHaveValue("1");
  await showGlossary.click();
  await expect(search).toHaveValue("");
  await menu.getByRole("button", { name: "Close menu" }).click();
  const resume = page.getByRole("button", { name: "Resume" });
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeEnabled();
});
