import {
  expect,
  gotoAndStabilize,
  test,
  waitForStablePage,
} from "../../fixtures/stableRendering";

test("home page introduces Alex, selected writing, and current interests", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Alex Leung" })
  ).toBeVisible();
  await expect(
    page.getByText(
      "I work on ChatGPT at OpenAI. I write about software, technical books, and life outside work.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Selected writing" })
  ).toBeVisible();
  await expect(page.locator("#writing article")).toHaveCount(3);
  await expect(
    page.getByRole("link", { name: "All writing →" })
  ).toHaveAttribute("href", "/blog/");
  await expect(
    page.getByRole("region", { name: "From the blog" }).getByRole("link", {
      name: "Two Nights in Desolation Wilderness",
      exact: true,
    })
  ).toHaveAttribute("href", "/blog/two-nights-in-desolation-wilderness/");
  await expect(
    page.getByRole("heading", { level: 2, name: "Work", exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Previously at Jetson, Google, Cash App, and North.")
  ).toBeVisible();
});

test("the homepage Now preview and date match the full Now page", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/");

  const preview = page.getByRole("complementary", { name: "Now", exact: true });
  const entryTitle = await preview
    .getByRole("heading", { level: 3 })
    .innerText();
  const paragraphs = await preview.locator("section p").allTextContents();
  const readingHref = await preview.locator("section a").getAttribute("href");
  const updatedAt = await preview.locator("time").getAttribute("datetime");
  const displayDate = await preview.locator("time").innerText();

  if (!updatedAt || !readingHref || paragraphs.length === 0) {
    throw new Error(
      "Expected the Now preview to contain dated reading content."
    );
  }

  await preview.getByRole("link", { name: "More on the Now page →" }).click();
  await waitForStablePage(page);
  await expect(page).toHaveURL(/\/now\/$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Now" })
  ).toBeVisible();

  const fullEntry = page.locator("main section").filter({
    has: page.getByRole("heading", { level: 2, name: entryTitle, exact: true }),
  });
  expect(await fullEntry.locator("p").allTextContents()).toEqual(paragraphs);
  await expect(fullEntry.getByRole("link")).toHaveAttribute(
    "href",
    readingHref
  );
  await expect(page.locator("main time")).toHaveAttribute(
    "datetime",
    updatedAt
  );
  await expect(page.locator("main time")).toHaveText(`Updated ${displayDate}`);
});

for (const width of [360, 768, 1280]) {
  test(`home, writing, and Now fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const path of ["/", "/blog/", "/now/"]) {
      await gotoAndStabilize(page, path);
      const navigation = page.getByRole("navigation", {
        name: "Primary navigation",
      });

      for (const label of ["Home", "Writing", "Now", "Contact"]) {
        const link = navigation.getByRole("link", { name: label, exact: true });
        await expect(link).toBeVisible();
        const bounds = await link.boundingBox();
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
      }

      if (path === "/") {
        for (const label of ["All writing →", "More on the Now page →"]) {
          const link = page.getByRole("link", { name: label, exact: true });
          await expect(link).toBeVisible();
          const bounds = await link.boundingBox();
          expect(bounds?.height).toBeGreaterThanOrEqual(44);
          expect(bounds?.width).toBeGreaterThanOrEqual(44);
        }
      }

      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        )
        .toBe(true);
    }
  });
}

test("primary navigation routes render expected page headings and active states", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/");
  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  const routes = [
    { label: "Writing", heading: "Writing", path: "/blog/" },
    { label: "Now", heading: "Now", path: "/now/" },
    { label: "Contact", heading: "Contact", path: "/contact/" },
    { label: "Home", heading: "Alex Leung", path: "/" },
  ];

  for (const route of routes) {
    await navigation
      .getByRole("link", { name: route.label, exact: true })
      .click();
    await waitForStablePage(page);

    expect(new URL(page.url()).pathname).toBe(route.path);
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading })
    ).toBeVisible();
    await expect(
      navigation.getByRole("link", { name: route.label, exact: true })
    ).toHaveAttribute("aria-current", "page");
    await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  }
});

test("tag archive routes render and keep the writing nav item active", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/blog/tags/ai/");

  await expect(
    page.getByRole("heading", { level: 1, name: "AI" })
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Writing", exact: true })
  ).toHaveAttribute("aria-current", "page");
});

test("PID controller notes preserve the retired simulator model", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/pid-controller/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "PID Controller Simulator Notes",
    })
  ).toBeVisible();
  await expect(page.getByText(/first-order process/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "controller and simulation modules" })
  ).toHaveAttribute("href", /src\/features\/pid-simulator/);
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
  ];

  for (const redirect of redirects) {
    await page.goto(redirect.legacy, { waitUntil: "domcontentloaded" });
    await page.waitForURL((url) => url.pathname === redirect.destination);
    expect(new URL(page.url()).pathname).toBe(redirect.destination);
  }
});
