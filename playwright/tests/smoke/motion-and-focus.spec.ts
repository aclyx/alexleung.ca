import type { Locator, Page } from "@playwright/test";

import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

type BlogCardSupportingState = {
  arrowTranslate: string;
  backgroundColor: string;
  borderColor: string;
  boxShadow: string;
  imageOpacity: string;
  titleColor: string;
  translate: string;
};

async function getBlogCardSupportingState(
  card: Locator
): Promise<BlogCardSupportingState> {
  return card.evaluate((article) => {
    const image = article.querySelector("img");
    const title = article.querySelector("h2");
    const arrow = Array.from(
      article.querySelectorAll<HTMLElement>('span[aria-hidden="true"]')
    ).find((element) => element.textContent?.trim() === "→");

    if (!image || !title || !arrow) {
      throw new Error("Expected the blog card supporting elements to exist.");
    }

    const articleStyles = getComputedStyle(article);

    return {
      arrowTranslate: getComputedStyle(arrow)
        .getPropertyValue("translate")
        .trim(),
      backgroundColor: articleStyles.backgroundColor,
      borderColor: articleStyles.borderColor,
      boxShadow: articleStyles.boxShadow,
      imageOpacity: getComputedStyle(image).opacity,
      titleColor: getComputedStyle(title).color,
      translate: articleStyles.getPropertyValue("translate").trim(),
    };
  });
}

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

  throw new Error("Could not reach the blog card link with keyboard focus.");
}

test("the mobile portrait is visible as soon as the homepage DOM is ready", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const portraitState = await page
    .getByRole("img", { name: "Alex Leung sitting in an art studio" })
    .evaluate((image) => {
      const rect = image.getBoundingClientRect();
      const styles = getComputedStyle(image);

      return {
        animationName: styles.animationName,
        height: rect.height,
        opacity: styles.opacity,
        visibility: styles.visibility,
        width: rect.width,
      };
    });

  expect(portraitState).toMatchObject({
    animationName: "none",
    opacity: "1",
    visibility: "visible",
  });
  expect(portraitState.width).toBeGreaterThan(0);
  expect(portraitState.height).toBeGreaterThan(0);
});

test("reduced motion leaves the hero visible without timing delays", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const heroCopy = page.locator("#about .hero-enter");
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

test("the mobile drawer transitions as one accessible unit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "load" });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );

  const openButton = page.getByRole("button", { name: "Open menu" });
  const drawer = page.locator("#mobile-nav-drawer");
  const transitionProperties = await drawer.evaluate((element) =>
    getComputedStyle(element)
      .transitionProperty.split(",")
      .map((property) => property.trim())
  );

  expect(transitionProperties).toEqual(
    expect.arrayContaining(["opacity", "translate"])
  );
  await expect(openButton).toHaveAttribute(
    "aria-controls",
    "mobile-nav-drawer"
  );
  await expect(openButton).toHaveAttribute("aria-expanded", "false");
  await expect(drawer).toHaveAttribute("aria-hidden", "true");

  await openButton.click();

  const closeButton = page.getByRole("button", { name: "Close menu" });
  const accessibleDrawer = page.getByRole("navigation", {
    name: "Mobile navigation",
  });
  await expect(closeButton).toHaveAttribute("aria-expanded", "true");
  await expect(accessibleDrawer).toHaveAttribute("aria-hidden", "false");
  await expect(accessibleDrawer).toHaveCSS("opacity", "1");

  await page.keyboard.press("Tab");
  await expect(
    accessibleDrawer.getByRole("link", { name: "Experience" })
  ).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(openButton).toBeFocused();
  await expect(openButton).toHaveAttribute("aria-expanded", "false");
  await expect(drawer).toHaveAttribute("aria-hidden", "true");
});

test("keyboard focus gives blog cards their supporting hover state", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name.startsWith("mobile-"),
    "Comparing hover and keyboard focus requires a hover-capable project."
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog/", { waitUntil: "domcontentloaded" });

  const card = page.locator("main article").first();
  const cardLink = card.locator("a[aria-label]").first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect(card.locator("img")).toHaveCSS("opacity", "0.9");

  const hoverState = await getBlogCardSupportingState(card);
  expect(hoverState.arrowTranslate).not.toBe("none");
  expect(hoverState.translate).not.toBe("none");

  await page.mouse.move(0, 0);
  await focusWithKeyboard(
    page,
    cardLink,
    testInfo.project.name.startsWith("webkit-") ? "Alt+Tab" : "Tab"
  );
  await expect(cardLink).toBeFocused();
  await expect.poll(() => getBlogCardSupportingState(card)).toEqual(hoverState);
});

test("each topic reveal moves focus to the newly revealed link", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoAndStabilize(page, "/blog/");

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
