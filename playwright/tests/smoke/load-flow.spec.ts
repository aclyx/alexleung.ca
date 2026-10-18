import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

test("load flow hydrates, scales demand, and inspects terminal power", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await gotoAndStabilize(page, "/experimental/load-flow/");
  await expect(
    page.getByRole("heading", { name: "Load Flow Analysis", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Converged");
  const slider = page.getByRole("slider");
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("105");
  await expect(page.getByText("115.5 MW / 42.0 MVAr")).toBeVisible();
  await page.getByRole("button", { name: "Q · MVAr", exact: true }).click();
  await expect(page.locator('[data-component="p"]')).toHaveCount(0);
  await expect(page.locator('[data-component="q"]')).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Inspect", exact: true })
    .selectOption("BRANCH:line-1-2");
  await expect(page.getByText("From end · Slack")).toBeVisible();
  await page.getByText("Edit selected element", { exact: true }).click();
  await page.getByLabel("X (pu)", { exact: true }).fill("0.08");
  await page.getByLabel("X (pu)", { exact: true }).press("Enter");
  await expect(page.getByRole("status")).toContainText("Converged");
  await page.getByRole("button", { name: "Reset network" }).click();
  await expect(slider).toHaveValue("100");
  await expect(page.getByLabel("X (pu)", { exact: true })).toHaveValue("0.06");
  expect(errors).toEqual([]);
});

test("line outages hide results and animation respects reduced motion", async ({
  page,
}) => {
  await page.goto("/experimental/load-flow/");
  await page
    .getByRole("combobox", { name: "Network", exact: true })
    .selectOption("two-bus-radial");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Animate flow" }).click();
  await expect(page.getByTestId("flow-motion").first()).toHaveCSS(
    "animation-name",
    "load-flow-travel"
  );
  await expect(page.getByTestId("flow-motion").first()).toHaveCSS(
    "animation-duration",
    "1.2s"
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByTestId("flow-motion").first()).toBeHidden();
  await page
    .getByRole("combobox", { name: "Inspect", exact: true })
    .selectOption("BRANCH:line-1");
  await page.getByText("Edit selected element", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Line status", exact: true })
    .selectOption("OUT_OF_SERVICE");
  await expect(
    page
      .getByRole("region", { name: "Interactive load-flow tool", exact: true })
      .getByRole("alert")
  ).toContainText("island");
  await expect(page.locator("[data-component]")).toHaveCount(0);
  await expect(page.getByText("Unsolved", { exact: true })).toHaveCount(2);
  await expect(page.getByTestId("flow-motion")).toHaveCount(0);
});

test("diagram works with keyboard, fits the viewport, and is reachable from home", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/");
  await page
    .getByRole("link", { name: "Load flow analysis →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/experimental\/load-flow\/$/);
  const diagram = page.getByTestId("load-flow-diagram");
  const bus = page.getByRole("button", { name: /^Bus Load Bus,/ });
  await bus.focus();
  await bus.press("Enter");
  await expect(
    page.getByRole("combobox", { name: "Inspect", exact: true })
  ).toHaveValue("BUS:bus-3");
  const before = await bus.getAttribute("transform");
  await bus.press("ArrowRight");
  await expect(bus).not.toHaveAttribute("transform", before!);
  const view = await diagram.getAttribute("viewBox");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(diagram).not.toHaveAttribute("viewBox", view!);
  await page.getByRole("button", { name: "Fit diagram" }).click();
  await expect(diagram).toHaveAttribute("viewBox", view!);
  await bus.scrollIntoViewIfNeeded();
  const box = await bus.boundingBox();
  expect(box).not.toBeNull();
  const beforeDrag = await bus.getAttribute("transform");
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 30,
    box!.y + box!.height / 2 - 20,
    { steps: 5 }
  );
  await page.mouse.up();
  await expect(bus).not.toHaveAttribute("transform", beforeDrag!);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://alexleung.ca/experimental/load-flow/"
  );
});
