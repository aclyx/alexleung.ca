import {
  expect,
  gotoAndStabilize,
  test,
  waitForStablePage,
} from "../../fixtures/stableRendering";

test("blog index top fold stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/blog/");

  await expect(page).toHaveScreenshot("blog-index-top-fold.png");
});

test("blog post top fold stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/blog/boring-blog-architecture/");

  await expect(page).toHaveScreenshot("blog-post-top-fold.png");
});

test("tag archive top fold stays visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/blog/tags/ai/");

  await expect(page).toHaveScreenshot("blog-tag-archive-top-fold.png");
});

test("related posts stay visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/blog/boring-blog-architecture/");
  const relatedPosts = page.getByRole("region", { name: "Related posts" });
  await relatedPosts.scrollIntoViewIfNeeded();
  await waitForStablePage(page);

  await expect(relatedPosts).toHaveScreenshot("blog-related-posts.png");
});

test("expanded blog topics stay visually stable", async ({ page }) => {
  await gotoAndStabilize(page, "/blog/");
  await page.getByText("Browse topics and series", { exact: true }).click();

  const topicList = page.locator("#blog-topic-list");
  const revealButton = topicList.getByRole("button", {
    name: /View \d+ more/,
  });

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if ((await revealButton.count()) === 0) {
      break;
    }

    await revealButton.click();
  }

  await expect(revealButton).toHaveCount(0);
  await waitForStablePage(page);

  await expect(page).toHaveScreenshot("blog-topics-expanded.png");
});
