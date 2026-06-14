import {
  expect,
  gotoAndStabilize,
  test,
  waitForStablePage,
} from "../../fixtures/stableRendering";

test("blog index navigates into a post and renders article metadata", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/blog/");

  const firstPostCard = page
    .locator("main a[aria-label][href^='/blog/']")
    .first();
  const postTitle = await firstPostCard.getAttribute("aria-label");

  if (!postTitle) {
    throw new Error("Expected the first blog card to expose an aria-label.");
  }

  await firstPostCard.click();
  await waitForStablePage(page);

  await expect(
    page.getByRole("heading", { level: 1, name: postTitle })
  ).toBeVisible();
  await expect(page.locator("article time").first()).toContainText("Published");
  await expect(
    page.getByRole("heading", { name: "Get new posts by email" })
  ).toBeVisible();
});

test("contact page shows the email CTA and social profile links", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/contact/");

  const main = page.locator("main");

  await expect(page.getByText("alex [at] alexleung.ca")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Subscribe" })).toBeVisible();
  await expect(
    main.getByRole("link", { name: "LinkedIn Profile", exact: true })
  ).toHaveAttribute("href", "https://www.linkedin.com/in/aclyx");
  await expect(
    main.getByRole("link", { name: "GitHub Profile", exact: true })
  ).toHaveAttribute("href", "https://www.github.com/aclyx");
  await expect(
    main.getByRole("link", { name: "Corporate GitHub Profile", exact: true })
  ).toHaveAttribute("href", "https://github.com/aclyx-oai");
});

test("unknown routes render the exported not found page", async ({ page }) => {
  await gotoAndStabilize(page, "/this-route-should-not-exist/");

  await expect(
    page.getByRole("heading", { level: 1, name: "404" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Page Not Found" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back home" })).toHaveAttribute(
    "href",
    "/"
  );
});

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
  expect(feedText).toContain("https://alexleung.ca/feed.xsl");

  expect(robotsText).toContain("Sitemap: https://alexleung.ca/sitemap.xml");
  expect(sitemapText).toContain("<urlset");
  expect(sitemapText).toContain("https://alexleung.ca/now/");
});
