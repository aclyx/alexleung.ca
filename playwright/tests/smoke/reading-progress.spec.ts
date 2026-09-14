import type { Locator } from "@playwright/test";

import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

async function getRenderedProgress(progress: Locator) {
  return progress.evaluate(
    (element) => element.getBoundingClientRect().width / element.clientWidth
  );
}

test("article reading progress spans the title through the final prose", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoAndStabilize(
    page,
    "/blog/small-interactive-tools-with-a-coding-agent/"
  );

  const progress = page.locator("[data-reading-progress]");
  await expect(progress).toHaveAttribute("aria-hidden", "true");
  await expect
    .poll(() =>
      progress.evaluate(
        (element) => element instanceof HTMLElement && !element.hidden
      )
    )
    .toBe(true);

  const positions = await page.evaluate(() => {
    const title = document.querySelector("#post-title");
    const prose = document.querySelector("main article .prose");
    const header = document.querySelector("header.fixed");

    if (!title || !prose || !header) {
      throw new Error("Expected article progress landmarks to exist.");
    }

    const scrollPosition = window.scrollY;
    const start =
      title.getBoundingClientRect().top +
      scrollPosition -
      header.getBoundingClientRect().height;
    const end =
      prose.getBoundingClientRect().bottom +
      scrollPosition -
      window.innerHeight;

    return { end, middle: start + (end - start) / 2, start };
  });

  expect(positions.end).toBeGreaterThan(positions.start);

  await page.evaluate((scrollPosition) => {
    window.scrollTo(0, scrollPosition);
  }, positions.middle);
  await expect
    .poll(
      async () => Math.round((await getRenderedProgress(progress)) * 10) / 10
    )
    .toBe(0.5);

  await page.evaluate((scrollPosition) => {
    window.scrollTo(0, scrollPosition);
  }, positions.end);
  await expect
    .poll(
      async () => Math.round((await getRenderedProgress(progress)) * 100) / 100
    )
    .toBe(1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(progress).toBeHidden();
});
