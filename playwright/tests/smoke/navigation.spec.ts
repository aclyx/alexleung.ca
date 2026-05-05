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
    page.getByRole("heading", { name: "What you'll find here" })
  ).toBeVisible();
});

test("primary navigation routes render expected page headings", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/");

  const routes = [
    { label: "About", heading: "About" },
    { label: "Now", heading: "What I'm Doing Now" },
    { label: "Blog", heading: "Blog" },
    { label: "Experiments", heading: "Experiments" },
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

test("now page links to the timeline archive", async ({ page }) => {
  await gotoAndStabilize(page, "/now/");

  await page.getByRole("link", { name: "Past Now Pages" }).click();
  await waitForStablePage(page);

  await expect(
    page.getByRole("heading", { level: 1, name: "Now Archive" })
  ).toBeVisible();
});

test("experiment child routes keep the experiments nav item active", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/mandelbrot/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Mandelbrot Explorer" })
  ).toBeVisible();
  await expectPrimaryNavLinkCurrent(page, "Experiments");
});

test("tag archive routes render and keep the blog nav item active", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/blog/tags/ai/");

  await expect(
    page.getByRole("heading", { level: 1, name: "AI" })
  ).toBeVisible();
  await expectPrimaryNavLinkCurrent(page, "Blog");
});
