// Run against a static export served on localhost. Supply private DAT and public TWS paths.
// node scripts/patch-bay/verify.mjs <url> <dat> <tws> keyboard|touch <output.json> [first] [last]
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";

import { chromium, webkit } from "@playwright/test";

import { readSolutions } from "./solutions.mjs";

const [url, dat, tws, scheme, output, from = "1", through = "149"] =
  process.argv.slice(2);
assert(["keyboard", "touch"].includes(scheme));
const digest = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
assert.equal(
  digest(dat),
  "b0a68f21642447385512e0ed9386a4a13a4f7e9a38f909da772104d8e6b5c1fb"
);
const recordings = readSolutions(fs.readFileSync(tws));
assert.equal(recordings.size, 149);
const touch = scheme === "touch";
const safari = process.env.PATCH_BAY_BROWSER === "webkit";
const browser = safari
  ? await webkit.launch()
  : await chromium.launch({
      args: [
        "--disable-frame-rate-limit",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
      ],
    });
const report = {
  scheme,
  browserName: safari ? "WebKit" : "Chromium",
  browser: browser.version(),
  dat: digest(dat),
  tws: digest(tws),
  boards: [],
};
try {
  const page = await browser.newPage({
    viewport: touch
      ? { width: 390, height: 844 }
      : { width: 1280, height: 800 },
    hasTouch: touch,
    isMobile: touch,
  });
  page.on("pageerror", (error) => console.error(error));
  await page.addInitScript(() => {
    // Replace only the wall clock and the attempt's entropy. Every move is a trusted
    // browser input, and only the game's ordinary exit can write a best time.
    const nativeRandom = crypto.getRandomValues.bind(crypto);
    const clock = (window.benchClock = {
      now: 0,
      index: 0,
      tick: 0,
      times: [],
      seed: [0, 0],
      armed: false,
      trusted: 0,
      advance(count) {
        while (count > 0) {
          const step = Math.min(4, count);
          count -= step;
          this.tick += step;
          this.now += 55 * step;
          const frame = [...frames.values()];
          frames.clear();
          for (const f of frame) f(this.now);
        }
      },
    });
    const frames = new Map();
    let id = 0;
    Object.defineProperty(performance, "now", { value: () => clock.now });
    window.requestAnimationFrame = (f) => {
      frames.set(++id, f);
      return id;
    };
    window.cancelAnimationFrame = (i) => frames.delete(i);
    crypto.getRandomValues = (a) =>
      a instanceof Uint32Array && a.length === 2
        ? (a.set(clock.seed), a)
        : nativeRandom(a);
    const before = (e) => {
      if (
        !clock.armed ||
        !(e.type === "keydown"
          ? e.code.startsWith("Arrow")
          : e.target.closest('button[aria-label^="Move "]'))
      )
        return;
      if (
        !e.isTrusted ||
        (e.type === "pointerdown" && e.pointerType !== "touch")
      )
        throw Error("Expected a trusted input");
      clock.trusted++;
      const next = clock.times[clock.index++];
      if (next < clock.tick || next === undefined)
        throw Error("Unexpected input");
      clock.advance(next - clock.tick);
    };
    window.addEventListener("keydown", before, true);
    window.addEventListener("pointerdown", before, true);
  });
  await page.goto(url);
  await page.waitForFunction(
    () =>
      !document.querySelector('button[aria-label="Move up"]')?.disabled &&
      document.querySelector("canvas"),
    undefined,
    { polling: 20 }
  );
  const cdp = safari ? null : await page.context().newCDPSession(page);
  const button = (name) =>
    page.getByRole("button", { name, exact: true }).first();
  const activate = async (name) =>
    touch
      ? button(name).tap({ force: true })
      : button(name).click({ force: true });
  const submitPassword = async (n) => {
    await page
      .getByPlaceholder("Four letters")
      .fill(recordings.get(n).password);
    await activate("Open level");
    if (await page.getByText("Choose a level for this password.").isVisible())
      await activate(new RegExp("^" + String(n).padStart(3, "0") + " "));
    await page.locator(`h2[data-level="${n}"]`).waitFor();
  };
  const setSeed = async (r) =>
    page.evaluate(
      (seed) => {
        window.benchClock.seed = seed;
      },
      [r.seed, r.phase]
    );
  await setSeed(recordings.get(1));
  await activate("Levels");
  await page.locator("input[type=file]").setInputFiles(dat);
  await page.waitForFunction(
    () =>
      document.querySelector("h2[data-level]")?.textContent === "LESSON 1" &&
      !document.querySelector("dialog").open,
    undefined,
    { polling: 20 }
  );
  const names = { 1: "Up", 2: "Left", 4: "Down", 8: "Right" };
  const points = {};
  for (const [dir, name] of Object.entries(names)) {
    const box = await button("Move " + name.toLowerCase()).boundingBox();
    points[dir] = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  for (let n = Number(from); n <= Number(through); n++) {
    const r = recordings.get(n);
    await setSeed(r);
    if (n !== 1) {
      if (n === Number(from) || n === 145) {
        await activate("Levels");
        if (n === 145 && Number(from) < 145)
          assert(
            !(await page.getByRole("button", { name: /145.*[A-Z]/ }).count())
          );
        await submitPassword(n);
      } else await activate("Next level");
    }
    const title = await page
      .locator('h2[data-level="' + n + '"]')
      .textContent();
    await activate("Start");
    await page.evaluate(
      (times) => {
        Object.assign(window.benchClock, {
          times,
          index: 0,
          tick: 0,
          armed: true,
          trusted: 0,
        });
      },
      r.moves.map((m) => m[0])
    );
    for (const [, dir] of r.moves) {
      if (!cdp) {
        if (touch) await page.touchscreen.tap(points[dir].x, points[dir].y);
        else await page.keyboard.press("Arrow" + names[dir]);
      } else if (touch) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [points[dir]],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
      } else {
        const key = "Arrow" + names[dir];
        await cdp.send("Input.dispatchKeyEvent", {
          type: "rawKeyDown",
          key,
          code: key,
        });
        await cdp.send("Input.dispatchKeyEvent", {
          type: "keyUp",
          key,
          code: key,
        });
      }
    }
    const count = await page.evaluate((end) => {
      const c = window.benchClock;
      c.armed = false;
      c.advance(end - c.tick);
      return c.trusted;
    }, r.time + 8);
    assert.equal(count, r.moves.length);
    await page
      .waitForFunction(
        () => document.querySelector("[data-mode]")?.dataset.mode !== "playing",
        undefined,
        { polling: 10, timeout: 2500 }
      )
      .catch(() => {});

    const observed = await page.evaluate(
      (n) => ({
        mode: document.querySelector("[data-mode]").dataset.mode,
        best: JSON.parse(localStorage.getItem("patch-bay.v1.windows")).best[n],
      }),
      n
    );
    assert.equal(
      observed.mode,
      "won",
      scheme + " " + n + " " + title + " " + JSON.stringify(observed)
    );
    assert.equal(observed.best, r.time, "Reference finish tick on " + n);
    report.boards.push({
      number: n,
      title,
      inputs: count,
      ticks: observed.best,
    });
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
    if (n % 10 === 0 || n === Number(from) || n === Number(through))
      console.log(scheme, n, title, observed.best);
  }
  await page.reload();
  await page.waitForFunction(
    () =>
      !document.querySelector('button[aria-label="Move up"]')?.disabled &&
      document.querySelector("canvas"),
    undefined,
    { polling: 20 }
  );
  const best = await page.evaluate(
    () => JSON.parse(localStorage.getItem("patch-bay.v1.windows")).best
  );
  for (const row of report.boards) assert.equal(best[row.number], row.ticks);
  report.reloadVerified = true;
  if (Number(from) === 1 && Number(through) === 149) {
    await activate("Save");
    const exported = await page.getByLabel(/Full save/).inputValue();
    const other = await (safari ? chromium : webkit).launch();
    try {
      const fresh = await other.newPage({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      });
      await fresh.goto(url);
      await fresh.getByRole("button", { name: "Levels", exact: true }).tap();
      await fresh.locator("input[type=file]").setInputFiles(dat);
      await fresh.waitForFunction(() => !document.querySelector("dialog").open);
      await fresh.getByRole("button", { name: "Save", exact: true }).tap();
      await fresh.getByLabel("Restore progress").fill(exported);
      await fresh.getByRole("button", { name: "Restore save" }).tap();
      await fresh.waitForFunction(() =>
        document.querySelector('h2[data-level="149"]')
      );
      const restored = await fresh.evaluate(
        () => JSON.parse(localStorage.getItem("patch-bay.v1.windows")).best
      );
      assert.deepEqual(restored, best);
      report.crossBrowserRestoreVerified = true;
    } finally {
      await other.close();
    }
    // In ICEBERG, one step east from spawn is fatal. The entire impact scene
    // must stay visible at the same coordinates until the player chooses Retry.
    await activate("Close menu");
    await activate("Levels");
    await submitPassword(21);
    const canvas = page.locator("canvas");
    const board = await canvas.boundingBox();
    if (touch) await activate("Move right");
    else await page.keyboard.press("ArrowRight");
    await page.evaluate(() => window.benchClock.advance(12));
    const alert = page
      .getByRole("alert")
      .filter({ hasText: "Drowned in water" });
    await alert.waitFor();
    assert.deepEqual(await canvas.boundingBox(), board);
    const retry = button("Retry level");
    for (const control of [alert, retry]) {
      const box = await control.boundingBox();
      assert(box.x >= board.x + board.width || box.y >= board.y + board.height);
    }
    assert(await retry.evaluate((el) => el === document.activeElement));
    await activate("Retry level");
    assert.equal(
      await page.locator("[data-mode]").getAttribute("data-mode"),
      "ready"
    );
    for (const n of [95, 96, 4]) {
      await activate("Levels");
      await submitPassword(n);
      assert(await canvas.evaluate((el) => el === document.activeElement));
    }
    if (touch) {
      await page.setViewportSize({ width: 320, height: 568 });
      await activate("Move down");
    } else await page.keyboard.press("ArrowDown");
    await page.evaluate(() => window.benchClock.advance(4));
    if (touch) await activate("Read hint");
    else await page.keyboard.press("Space");
    await button("Resume game").waitFor();
    assert(
      await page.getByText(/The blue button controls the tanks/).isVisible()
    );
    await activate("Restart level");
    assert.equal(
      await page.locator("[data-mode]").getAttribute("data-mode"),
      "ready"
    );
  }
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
} finally {
  await browser.close();
}
