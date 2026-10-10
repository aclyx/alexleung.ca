import type { Locator, Page } from "@playwright/test";

import {
  expect,
  gotoAndStabilize,
  test,
  waitForStablePage,
} from "../../fixtures/stableRendering";

async function focusWithKeyboard(
  page: Page,
  target: Locator,
  tabKey: "Alt+Tab" | "Tab"
) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  for (let attempt = 0; attempt < 50; attempt += 1) {
    await page.keyboard.press(tabKey);

    if (
      await target.evaluate((element) => document.activeElement === element)
    ) {
      return;
    }
  }

  throw new Error("Could not reach the requested link with keyboard focus.");
}

test("reduced motion leaves the hero visible without timing delays", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const heroCopy = page.locator("#about h1");
  await expect(heroCopy).toBeVisible();
  await expect(heroCopy).toHaveCSS("animation-duration", "0s");
  await expect(heroCopy).toHaveCSS("animation-delay", "0s");

  const delayedElements = await page.locator("#about, #about *").evaluateAll(
    (elements) =>
      elements.filter((element) => {
        const styles = getComputedStyle(element);
        return (
          styles.animationDelay !== "0s" || styles.transitionDelay !== "0s"
        );
      }).length
  );

  expect(delayedElements).toBe(0);
});

for (const width of [390, 1280]) {
  test(`inline navigation and writing links work with a keyboard at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name.startsWith("mobile-"),
      "Keyboard navigation is exercised in desktop browser projects at both layout widths."
    );
    await page.setViewportSize({ width, height: 900 });
    await gotoAndStabilize(page, "/");
    const tabKey = testInfo.project.name.startsWith("webkit-")
      ? "Alt+Tab"
      : "Tab";
    const writingNav = page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Writing", exact: true });

    await focusWithKeyboard(page, writingNav, tabKey);
    await expect(writingNav).toBeFocused();
    await expect(writingNav).not.toHaveCSS("box-shadow", "none");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/blog\/$/);
    await waitForStablePage(page);

    for (const path of ["/blog/", "/blog/tags/ai/"]) {
      await gotoAndStabilize(page, path);
      const firstPostLink = page.locator("main article a[aria-label]").first();
      const postTitle = await firstPostLink.getAttribute("aria-label");
      if (!postTitle) {
        throw new Error("Expected the writing link to expose its post title.");
      }

      await focusWithKeyboard(page, firstPostLink, tabKey);
      await expect(firstPostLink).toBeFocused();
      await expect(firstPostLink).not.toHaveCSS("box-shadow", "none");
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", { level: 1, name: postTitle })
      ).toBeVisible();
    }
  });
}

for (const width of [390, 1280]) {
  test(`each topic reveal moves focus to the newly revealed link at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoAndStabilize(page, "/blog/");

    await page.getByText("Browse topics and series", { exact: true }).click();
    const topicList = page.locator("#blog-topic-list");
    const topicLinks = topicList.getByRole("link");
    const revealButton = topicList.getByRole("button", {
      name: /View \d+ more/,
    });
    let revealedLink: Locator | undefined;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      if ((await revealButton.count()) === 0) {
        break;
      }

      const firstNewTopicIndex = await topicLinks.count();
      await revealButton.click();
      revealedLink = topicLinks.nth(firstNewTopicIndex);
      await expect(revealedLink).toBeFocused();

      if ((await revealButton.count()) === 0) {
        break;
      }
    }

    if (!revealedLink) {
      throw new Error(
        "Expected the reveal control to add at least one topic link."
      );
    }
  });

  test(`new topic links enter in a short, capped cadence at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/blog/", { waitUntil: "domcontentloaded" });

    await page.getByText("Browse topics and series", { exact: true }).click();
    const topicList = page.locator("#blog-topic-list");
    const topicLinks = topicList.getByRole("link");
    const firstNewTopicIndex = await topicLinks.count();

    await topicList.getByRole("button", { name: /View \d+ more/ }).click();

    const delays = await topicLinks.evaluateAll(
      (links, startIndex) =>
        links
          .slice(startIndex, startIndex + 4)
          .map((link) => getComputedStyle(link).animationDelay),
      firstNewTopicIndex
    );

    expect(delays.length).toBeGreaterThan(0);
    expect(delays.length).toBeLessThanOrEqual(4);
    delays.forEach((delay, index) => {
      expect(Number.parseFloat(delay)).toBeCloseTo(index * 0.02);
    });
  });
}
