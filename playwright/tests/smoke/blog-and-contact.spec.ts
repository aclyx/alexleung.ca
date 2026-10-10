import type { Locator } from "@playwright/test";

import {
  expect,
  gotoAndStabilize,
  test,
  waitForStablePage,
} from "../../fixtures/stableRendering";

async function expectLinksFitViewport(links: Locator, width: number) {
  expect(await links.count()).toBeGreaterThan(0);

  for (const link of await links.all()) {
    await expect(link).toBeVisible();
    const bounds = await link.boundingBox();
    if (!bounds) {
      throw new Error("Expected the link to have visible bounds.");
    }
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
  }
}

test("blog index navigates into a post and renders article metadata", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/blog/");

  const firstPostLink = page.locator("main article a[aria-label]").first();
  const postTitle = await firstPostLink.getAttribute("aria-label");

  if (!postTitle) {
    throw new Error(
      "Expected the first writing link to expose its post title."
    );
  }

  await expect(firstPostLink.locator("time")).toHaveAttribute(
    "datetime",
    /\d{4}-\d{2}-\d{2}/
  );
  await firstPostLink.click();
  await waitForStablePage(page);

  await expect(
    page.getByRole("heading", { level: 1, name: postTitle })
  ).toBeVisible();
  await expect(page.locator("main time").first()).toContainText("Published");
  await expect(
    page.getByRole("heading", { name: "Get new posts by email" })
  ).toBeVisible();
});

test("contact page shows email, profile links, and subscription", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/contact/");

  const main = page.locator("main");

  await expect(page.getByText("alex@alexleung.ca")).toBeVisible();
  await expect(
    main.getByRole("link", { name: "alex@alexleung.ca", exact: true })
  ).toHaveAttribute("href", "mailto:alex@alexleung.ca");
  await expect(main.getByRole("button", { name: "Copy email" })).toBeVisible();
  await expect(
    main.getByRole("heading", { level: 2, name: "Get new posts by email" })
  ).toBeVisible();
  await expect(main.getByLabel("Email address")).toHaveAttribute(
    "required",
    ""
  );
  const profiles = main.getByRole("navigation", { name: "Profiles" });
  await expect(profiles.getByRole("link")).toHaveText([
    "LinkedIn",
    "GitHub",
    "X",
  ]);
  await expect(
    profiles.getByRole("link", { name: "LinkedIn Profile", exact: true })
  ).toHaveAttribute("href", "https://www.linkedin.com/in/aclyx");
  await expect(
    profiles.getByRole("link", { name: "GitHub Profile", exact: true })
  ).toHaveAttribute("href", "https://www.github.com/aclyx");
  await expect(
    profiles.getByRole("link", { name: "X (Twitter) Profile", exact: true })
  ).toHaveAttribute("href", "https://www.x.com/aclyxpse");
  await expect(
    profiles.getByRole("link", {
      name: "Work GitHub Profile",
      exact: true,
    })
  ).toHaveCount(0);
});

for (const width of [320, 390, 1280]) {
  test(`footer links stay consistent and usable across pages at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const expectedLinks = [
      { name: "GitHub Profile", href: "https://www.github.com/aclyx" },
      { name: "LinkedIn Profile", href: "https://www.linkedin.com/in/aclyx" },
      { name: "X (Twitter) Profile", href: "https://www.x.com/aclyxpse" },
      { name: "RSS", href: "/feed.xml" },
      { name: "Contact", href: "/contact/" },
    ];

    for (const path of ["/", "/contact/", "/now/", "/blog/"]) {
      await gotoAndStabilize(page, path);
      const footer = page.getByRole("contentinfo");
      await footer.scrollIntoViewIfNeeded();
      const navigation = footer.getByRole("navigation", {
        name: "Footer navigation",
      });
      await expect(navigation.getByRole("link")).toHaveText([
        "GitHub",
        "LinkedIn",
        "X",
        "RSS",
        "Contact",
      ]);

      for (const expectedLink of expectedLinks) {
        const link = navigation.getByRole("link", {
          name: expectedLink.name,
          exact: true,
        });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", expectedLink.href);
        const bounds = await link.boundingBox();
        if (!bounds) {
          throw new Error(`Expected visible bounds for ${expectedLink.name}.`);
        }
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    }
  });
}

test("unknown routes render the exported not found page", async ({ page }) => {
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await gotoAndStabilize(page, "/this-route-should-not-exist/");

    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" })
    ).toBeVisible();
    await expect(
      page.locator("main").getByText("404", { exact: true })
    ).toBeVisible();
    const recovery = page.getByRole("navigation", { name: "Page recovery" });
    await expectLinksFitViewport(recovery.getByRole("link"), width);
    await expect(
      recovery.getByRole("link", { name: "Home", exact: true })
    ).toHaveAttribute("href", "/");
    const writingLink = recovery.getByRole("link", {
      name: "Writing",
      exact: true,
    });
    await expect(writingLink).toHaveAttribute("href", "/blog/");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator("footer")).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);

    await writingLink.click();
    await expect(page).toHaveURL(/\/blog\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Writing" })
    ).toBeVisible();
  }
});

for (const width of [320, 1280]) {
  test(`topic and related-post rows remain usable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoAndStabilize(page, "/blog/tags/ai/");

    const allWriting = page.getByRole("link", {
      name: "All writing",
      exact: true,
    });
    await expect(allWriting).toHaveAttribute("href", "/blog/");
    await expectLinksFitViewport(allWriting, width);
    const topicPosts = page.locator("main article a[aria-label]");
    await expectLinksFitViewport(topicPosts, width);
    for (const post of await topicPosts.all()) {
      await expect(post).toHaveAttribute("href", /^\/blog\/[^/]+\/$/);
      await expect(post.locator("time")).toHaveAttribute(
        "datetime",
        /\d{4}-\d{2}-\d{2}/
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);

    const firstPost = topicPosts.first();
    const postTitle = await firstPost.getAttribute("aria-label");
    if (!postTitle) {
      throw new Error("Expected the topic row to expose its post title.");
    }
    await firstPost.click({ position: { x: 8, y: 8 } });
    await waitForStablePage(page);
    await expect(
      page.getByRole("heading", { level: 1, name: postTitle, exact: true })
    ).toBeVisible();

    const related = page.getByRole("region", { name: "Related posts" });
    await related.scrollIntoViewIfNeeded();
    const relatedLinks = related.getByRole("link");
    await expect(relatedLinks).toHaveCount(3);
    await expectLinksFitViewport(relatedLinks, width);
    for (const link of await relatedLinks.all()) {
      await expect(link).toHaveAttribute("href", /^\/blog\/[^/]+\/$/);
      await expect(link.locator("time")).toHaveAttribute(
        "datetime",
        /\d{4}-\d{2}-\d{2}/
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);

    const firstRelated = relatedLinks.first();
    const relatedTitle = await firstRelated
      .getByRole("heading", { level: 3 })
      .innerText();
    await firstRelated.click({ position: { x: 8, y: 8 } });
    await expect(
      page.getByRole("heading", { level: 1, name: relatedTitle, exact: true })
    ).toBeVisible();
  });

  test(`RSS exposes a selectable feed address at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoAndStabilize(page, "/feed.xml");

    await expect(
      page.getByRole("heading", { level: 1, name: "Alex Leung's Writing" })
    ).toBeVisible();
    const feedAddress = page.getByLabel("Feed address", { exact: true });
    await expect(feedAddress).toHaveValue("https://alexleung.ca/feed.xml");
    await expect(feedAddress).not.toBeEditable();
    const fieldBounds = await feedAddress.boundingBox();
    expect(fieldBounds?.height).toBeGreaterThanOrEqual(44);
    // WebKit ignores keyboard selection commands on readonly inputs.
    await feedAddress.click({ clickCount: 3 });
    await expect(feedAddress).toBeFocused();
    expect(
      await feedAddress.evaluate((element: HTMLInputElement) =>
        element.value.slice(
          element.selectionStart ?? 0,
          element.selectionEnd ?? 0
        )
      )
    ).toBe("https://alexleung.ca/feed.xml");

    const navigation = page.getByRole("navigation", {
      name: "Feed navigation",
    });
    await expectLinksFitViewport(navigation.getByRole("link"), width);
    await expect(
      navigation.getByRole("link", { name: "← Back to Writing", exact: true })
    ).toHaveAttribute("href", "https://alexleung.ca/blog/");
    const postLinks = page.locator("main h2 a");
    await expectLinksFitViewport(postLinks, width);
    for (const post of await postLinks.all()) {
      await expect(post).toHaveAttribute(
        "href",
        /^https:\/\/alexleung\.ca\/blog\/[^/]+\/$/
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
  });
}

test("static export metadata artifacts are served", async ({ request }) => {
  const [feedResponse, robotsResponse, sitemapResponse] = await Promise.all([
    request.get("/feed.xml"),
    request.get("/robots.txt"),
    request.get("/sitemap.xml"),
  ]);

  await expect(feedResponse).toBeOK();
  await expect(robotsResponse).toBeOK();
  await expect(sitemapResponse).toBeOK();

  const feedText = await feedResponse.text();
  const robotsText = await robotsResponse.text();
  const sitemapText = await sitemapResponse.text();

  expect(feedResponse.headers()["content-type"]).toContain("xml");
  expect(feedText).toContain("<rss");
  expect(feedText).toContain('href="/feed.xsl"');

  expect(robotsText).toContain("Sitemap: https://alexleung.ca/sitemap.xml");
  expect(sitemapText).toContain("<urlset");
  expect(sitemapText).toContain("https://alexleung.ca/now/");
});
