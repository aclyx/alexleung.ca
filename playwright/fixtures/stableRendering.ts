import {
  expect as baseExpect,
  test as baseTest,
  type Page,
} from "@playwright/test";

const BLOCKED_REQUEST_PATTERNS = [
  "https://www.googletagmanager.com/**",
  "https://www.google-analytics.com/**",
];

const STABLE_RENDERING_CSS = `
  *,
  *::before,
  *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
  }
`;

export const test = baseTest.extend({
  page: async ({ page }, use) => {
    for (const pattern of BLOCKED_REQUEST_PATTERNS) {
      await page.route(pattern, (route) => route.abort());
    }

    await use(page);
  },
});

export const expect = baseExpect;

export async function gotoAndStabilize(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForStablePage(page);
}

export async function waitForStablePage(page: Page) {
  await expect(page.locator("main")).toBeVisible();
  await page.addStyleTag({ content: STABLE_RENDERING_CSS });
  await waitForFonts(page);
  await waitForImages(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      })
  );
}

async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    if ("fonts" in document) {
      await document.fonts.ready;
    }
  });
}

async function waitForImages(page: Page) {
  await page.evaluate(async () => {
    const imageLoadTimeoutMs = 5_000;
    const images = Array.from(document.images).filter((image) => {
      if (image.loading !== "lazy") {
        return true;
      }

      const rect = image.getBoundingClientRect();
      return rect.top < window.innerHeight * 1.5;
    });

    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }

            const finish = () => {
              clearTimeout(timeoutId);
              resolve();
            };

            const timeoutId = window.setTimeout(finish, imageLoadTimeoutMs);

            image.addEventListener("load", finish, { once: true });
            image.addEventListener("error", finish, { once: true });
          })
      )
    );
  });
}
