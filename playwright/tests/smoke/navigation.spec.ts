import type { Page } from "@playwright/test";

import {
  expect,
  gotoAndStabilize,
  test,
  waitForStablePage,
} from "../../fixtures/stableRendering";

async function clickPrimaryNavLink(page: Page, label: string) {
  const desktopLink = page
    .locator("header")
    .getByRole("link", { name: label, exact: true });

  if (await desktopLink.isVisible().catch(() => false)) {
    await desktopLink.click();
    return;
  }

  const menuButton = page.getByRole("button", { name: /Open menu|Close menu/ });
  await menuButton.click();

  const mobileNavDrawer = page.locator("#mobile-nav-drawer");
  await expect(mobileNavDrawer).toBeVisible();
  await mobileNavDrawer.getByRole("link", { name: label, exact: true }).click();
}

async function expectPrimaryNavLinkCurrent(page: Page, label: string) {
  const desktopLink = page
    .locator("header")
    .getByRole("link", { name: label, exact: true });

  if (await desktopLink.isVisible().catch(() => false)) {
    await expect(desktopLink).toHaveAttribute("aria-current", "page");
    return;
  }

  const menuButton = page.getByRole("button", { name: /Open menu|Close menu/ });
  await menuButton.click();

  const mobileNavDrawer = page.locator("#mobile-nav-drawer");
  await expect(mobileNavDrawer).toBeVisible();
  await expect(
    mobileNavDrawer.getByRole("link", { name: label, exact: true })
  ).toHaveAttribute("aria-current", "page");
}

test("home page renders the hero content", async ({ page }) => {
  await gotoAndStabilize(page, "/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Alex Leung" })
  ).toBeVisible();
  await expect(
    page.getByText("Software engineer and writer", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText(
      "I build products and systems that make new technology useful in everyday life. I write about software, technical books, and life outside work.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Get in touch" })
  ).toHaveAttribute("href", "/contact/");
  await expect(
    page.getByRole("link", { name: "Read my writing" })
  ).toHaveAttribute("href", "/blog/");
  await expect(
    page.getByRole("link", { name: "Now — what I’m reading and studying" })
  ).toHaveAttribute("href", "/now/");
  await expect(
    page.getByRole("heading", { level: 2, name: "Experience" })
  ).toBeVisible();
  await expect(
    page.getByText(
      "Building ChatGPT products and systems that bring model capabilities into everyday use."
    )
  ).toBeVisible();
  await expect(
    page.getByText(
      "Built products and systems to make home electrification easier across North America."
    )
  ).toBeVisible();
  await expect(
    page.getByText("Built the platform that powered Google's AR glasses.")
  ).toBeVisible();
  await expect(
    page.getByText(
      "Built products and systems used by millions of customers to move and manage their money."
    )
  ).toBeVisible();
  await expect(
    page.getByText(
      "Built the world's first display-integrated consumer smartglasses."
    )
  ).toBeVisible();
  await expect(
    page.locator("#interests p").filter({
      hasText:
        "My Now page is a short, current note on what I'm reading and studying.",
    })
  ).toHaveText(
    "My Now page is a short, current note on what I'm reading and studying."
  );
});

test("interests divider adapts to the content layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoAndStabilize(page, "/");

  const facts = page.locator("#interests dl");
  await expect(facts).toHaveCSS("border-top-width", "1px");
  await expect(facts).toHaveCSS("padding-top", "20px");

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(facts).toHaveCSS("border-top-width", "1px");
  await expect(facts).toHaveCSS("padding-top", "20px");

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(facts).toHaveCSS("border-top-width", "0px");
  await expect(facts).toHaveCSS("padding-top", "0px");
});

test("education details do not overflow at the tablet breakpoint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await gotoAndStabilize(page, "/#experience");

  await expect(page.getByText("Georgia Tech", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    )
    .toBe(true);
});

test("mobile navigation remains usable in a short viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 180 });
  await gotoAndStabilize(page, "/");

  await page.getByRole("button", { name: "Open menu" }).click();
  const drawer = page.getByRole("navigation", { name: "Mobile navigation" });

  await expect(drawer).toBeVisible();
  const dimensions = await drawer.evaluate((element) => ({
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
    scrollHeight: element.scrollHeight,
  }));
  expect(dimensions.overflowY).toBe("auto");
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
  await drawer.getByRole("link", { name: "Contact" }).scrollIntoViewIfNeeded();
  await expect(drawer.getByRole("link", { name: "Contact" })).toBeVisible();
});

test("primary navigation routes render expected page headings", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/");

  await clickPrimaryNavLink(page, "Experience");
  await expect(page).toHaveURL(/\/#experience$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "Experience" })
  ).toBeVisible();
  await expect(page.locator('a[href="/#experience"]').first()).toHaveAttribute(
    "aria-current",
    "location"
  );
  await expect
    .poll(() =>
      page.evaluate(() => {
        const header = document.querySelector("header");
        const experience = document.querySelector("#experience");

        if (!header || !experience) {
          return false;
        }

        const headerBottom = header.getBoundingClientRect().bottom;
        const experienceTop = experience.getBoundingClientRect().top;
        return (
          experienceTop >= headerBottom && experienceTop - headerBottom < 40
        );
      })
    )
    .toBe(true);

  const routes = [
    { label: "Writing", heading: "Writing" },
    { label: "Now", heading: "What I'm Doing Now" },
    { label: "Contact", heading: "Contact" },
  ];

  for (const route of routes) {
    await clickPrimaryNavLink(page, route.label);
    await waitForStablePage(page);

    await expect(
      page.getByRole("heading", { level: 1, name: route.heading })
    ).toBeVisible();
  }
});

test("tag archive routes render and keep the writing nav item active", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/blog/tags/ai/");

  await expect(
    page.getByRole("heading", { level: 1, name: "AI" })
  ).toBeVisible();
  await expectPrimaryNavLinkCurrent(page, "Writing");
});

test("legacy page URLs resolve to their canonical destinations", async ({
  page,
}) => {
  const redirects = [
    { legacy: "/about/", destination: "/" },
    { legacy: "/experimental/", destination: "/blog/" },
    {
      legacy: "/experimental/load-flow/",
      destination: "/blog/small-interactive-tools-with-a-coding-agent/",
    },
    { legacy: "/experimental/pid-controller/", destination: "/blog/" },
  ];

  for (const redirect of redirects) {
    await page.goto(redirect.legacy, { waitUntil: "domcontentloaded" });
    await page.waitForURL((url) => url.pathname === redirect.destination);
    expect(new URL(page.url()).pathname).toBe(redirect.destination);
  }
});
