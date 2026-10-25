import { getReferenceScenarioById } from "../../../src/features/load-flow/solver/referenceScenarios";
import { runLoadFlow } from "../../../src/features/load-flow/solver/runLoadFlow";
import {
  expect,
  gotoAndStabilize,
  test,
  waitForStablePage,
} from "../../fixtures/stableRendering";

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
  const generatorBus = page.getByRole("button", {
    name: /^Bus Gen Bus, PV, Generator, Load/,
  });
  await expect(generatorBus.locator('[data-device="generator"]')).toBeVisible();
  await expect(generatorBus.locator('[data-device="load"]')).toBeVisible();
  await expect(page.locator('[data-device="grid"]')).toBeVisible();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(generatorBus).toHaveAttribute(
    "aria-description",
    /Generator: 50.0 MW, 7.0 MVAr; Load: 20.0 MW, 10.0 MVAr/
  );
  await generatorBus.focus();
  await expect(page.getByRole("tooltip")).toContainText("50.0 MW");
  await expect(page.getByRole("tooltip")).toContainText("7.0 MVAr");
  await generatorBus.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
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
  await expect(
    page.getByRole("button", { name: "Pause motion" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("flow-motion").first()).toHaveCSS(
    "animation-name",
    "load-flow-travel"
  );
  const motion = page
    .locator(
      '[data-component="p"] [data-terminal="from"] [data-testid="flow-motion"]'
    )
    .first();
  const initialDuration = await motion.evaluate((node) =>
    parseFloat(getComputedStyle(node).animationDuration)
  );
  const scenario = getReferenceScenarioById("two-bus-radial")!.loadFlowCase;
  const flow = runLoadFlow(scenario).branchFlows![0];
  expect(initialDuration).toBeCloseTo(52 / Math.abs(flow.pFromToMW), 4);
  await page.getByRole("slider").focus();
  for (let step = 0; step < 10; step++)
    await page.getByRole("slider").press("ArrowRight");
  const largerDuration = await motion.evaluate((node) =>
    parseFloat(getComputedStyle(node).animationDuration)
  );
  expect(largerDuration).toBeLessThan(initialDuration);
  await page.getByRole("button", { name: "Pause motion" }).click();
  await expect(page.getByTestId("flow-motion")).toHaveCount(0);
  await page.getByRole("button", { name: "Animate flow" }).click();
  await expect(page.getByTestId("flow-motion").first()).toHaveCSS(
    "animation-name",
    "load-flow-travel"
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
  const paths = await diagram
    .locator(".load-flow-line-focus, [data-testid='flow-motion']")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")!));
  for (const path of paths) {
    expect(path).not.toMatch(/[QC]/);
    const coordinates = path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    for (let i = 2; i < coordinates.length; i += 2) {
      expect(
        coordinates[i] === coordinates[i - 2] ||
          coordinates[i + 1] === coordinates[i - 1]
      ).toBe(true);
    }
  }
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

test("parallel circuits remain independently selectable after dragging a bus", async ({
  page,
  isMobile,
}) => {
  await gotoAndStabilize(page, "/experimental/load-flow/");
  await page
    .getByRole("combobox", { name: "Network", exact: true })
    .selectOption("two-bus-radial");
  await page.getByText("Network editor & model", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "From bus", exact: true })
    .selectOption("bus-1");
  await page
    .getByRole("combobox", { name: "To bus", exact: true })
    .selectOption("bus-2");
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", { name: "Connect buses", exact: true })
      .click();
  await page.getByText("Network editor & model", { exact: true }).click();
  const diagram = page.getByTestId("load-flow-diagram");
  const lines = diagram.getByRole("button", { name: /^Line / });
  await expect(lines).toHaveCount(4);
  for (let pass = 0; pass < 2; pass++) {
    await page.getByRole("button", { name: "Fit diagram" }).click();
    await diagram.scrollIntoViewIfNeeded();
    await waitForStablePage(page);
    const paths = await lines
      .locator(".load-flow-line-focus")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    expect(new Set(paths).size).toBe(4);
    for (let i = 0; i < 4; i++) {
      const line = lines.nth(i);
      const point = await line.evaluate((group) => {
        const path = group.querySelector<SVGPathElement>(
          ".load-flow-line-focus"
        )!;
        const matrix = path.getScreenCTM()!;
        const steps = Array.from({ length: 39 }, (_, index) => index + 1).sort(
          (a, b) => Math.abs(a - 20) - Math.abs(b - 20)
        );
        for (const step of steps) {
          const p = path
            .getPointAtLength((path.getTotalLength() * step) / 40)
            .matrixTransform(matrix);
          if (
            [-3, 0, 3].every((dx) =>
              [-3, 0, 3].every(
                (dy) =>
                  document
                    .elementFromPoint(p.x + dx, p.y + dy)
                    ?.closest('[role="button"]') === group
              )
            )
          )
            return { x: p.x, y: p.y };
        }
        return null;
      });
      expect(point).not.toBeNull();
      if (isMobile) await page.touchscreen.tap(point!.x, point!.y);
      else await page.mouse.click(point!.x, point!.y);
      await expect(line).toHaveAttribute("aria-pressed", "true");
      await page.keyboard.press("Escape");
    }
    if (pass === 0) {
      const bus = diagram.getByRole("button", { name: /^Bus Plant Bus,/ });
      const before = await bus.getAttribute("transform");
      const box = (await bus.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width / 2 - 35,
        box.y + box.height / 2 + 60,
        { steps: 5 }
      );
      await page.mouse.up();
      await expect(bus).not.toHaveAttribute("transform", before!);
    }
  }
});

test("IEEE 9 terminal arrows clear bus cards and device icons", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/load-flow/");
  await page
    .getByRole("combobox", { name: "Network", exact: true })
    .selectOption("ieee-9-bus");
  const line = page.getByRole("button", { name: /^Line line-6-7-5:/ });
  await expect(line.locator("[data-flow-arrow]")).toHaveCount(4);
  const hiddenArrows = await page
    .getByTestId("load-flow-diagram")
    .evaluate((svg) => {
      const obstacles = Array.from(
        svg.querySelectorAll(".load-flow-bus-focus, [data-device]")
      ).map((element) => element.getBoundingClientRect());
      return Array.from(svg.querySelectorAll("[data-flow-arrow]"))
        .filter((arrow) => {
          const box = arrow.getBoundingClientRect();
          return obstacles.some(
            (obstacle) =>
              box.left < obstacle.right &&
              box.right > obstacle.left &&
              box.top < obstacle.bottom &&
              box.bottom > obstacle.top
          );
        })
        .map((arrow) =>
          arrow.closest('[role="button"]')?.getAttribute("aria-label")
        );
    });
  expect(hiddenArrows).toEqual([]);
  await page
    .getByRole("combobox", { name: "Inspect", exact: true })
    .selectOption("BRANCH:line-6-7-5");
  const lines = page.getByRole("button", { name: /^Line / });
  await expect(lines.nth(1)).toHaveCSS("opacity", "0.3");
  await lines.first().press("Tab");
  await expect(lines.nth(1)).toBeFocused();
  await expect(lines.nth(1)).toHaveCSS("opacity", "1");
});

test("pinch-style and Command-scroll wheel zoom stay under the cursor", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Native wheel input is a desktop interaction.");
  await gotoAndStabilize(page, "/experimental/load-flow/");
  const diagram = page.getByTestId("load-flow-diagram");
  await diagram.scrollIntoViewIfNeeded();
  const initial = await diagram.getAttribute("viewBox");
  const box = (await diagram.boundingBox())!;
  const cursor = {
    x: Math.round(box.x + box.width * 0.3),
    y: Math.round(box.y + box.height * 0.4),
  };
  const pointUnderCursor = () =>
    diagram.evaluate((svg, cursor) => {
      if (!(svg instanceof SVGSVGElement)) throw new Error("Expected diagram");
      const point = new DOMPoint(cursor.x, cursor.y).matrixTransform(
        svg.getScreenCTM()!.inverse()
      );
      return { x: point.x, y: point.y };
    }, cursor);
  await page.mouse.move(cursor.x, cursor.y);
  const before = await pointUnderCursor();
  const scrollBefore = await page.evaluate(() => scrollY);
  for (const key of ["Meta", "Control"]) {
    await page.keyboard.down(key);
    await page.mouse.wheel(0, -40);
    await page.keyboard.up(key);
    await expect(diagram).not.toHaveAttribute("viewBox", initial!);
    await expect
      .poll(async () => (await pointUnderCursor()).x)
      .toBeCloseTo(before.x, 4);
    await expect
      .poll(async () => (await pointUnderCursor()).y)
      .toBeCloseTo(before.y, 4);
    expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
    await page.getByRole("button", { name: "Fit diagram" }).click();
    await expect(diagram).toHaveAttribute("viewBox", initial!);
    await page.mouse.move(cursor.x, cursor.y);
  }
  await page.mouse.wheel(0, 120);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(scrollBefore);
  await expect(diagram).toHaveAttribute("viewBox", initial!);
});

test("two-finger touch pinch scales the diagram without rearranging the network", async ({
  page,
  browserName,
  isMobile,
}) => {
  test.skip(
    browserName !== "chromium" || !isMobile,
    "Real multi-touch input uses Chromium's mobile input protocol."
  );
  await gotoAndStabilize(page, "/experimental/load-flow/");
  const diagram = page.getByTestId("load-flow-diagram");
  await diagram.scrollIntoViewIfNeeded();
  const box = (await diagram.boundingBox())!;
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const initial = await diagram.getAttribute("viewBox");
  const busPositions = () =>
    diagram
      .locator('[aria-label^="Bus "]')
      .evaluateAll((buses) =>
        buses.map((bus) => bus.getAttribute("transform"))
      );
  const positionsBefore = await busPositions();
  const session = await page.context().newCDPSession(page);
  const points = (radius: number) => [
    { x: center.x - radius, y: center.y, id: 1 },
    { x: center.x + radius, y: center.y, id: 2 },
  ];
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: points(40),
  });
  for (const radius of [45, 50, 60, 70, 80]) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: points(radius),
    });
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(diagram).not.toHaveAttribute("viewBox", initial!);
  const width = () =>
    diagram.evaluate((svg) =>
      Number(svg.getAttribute("viewBox")!.split(" ")[2])
    );
  const initialWidth = Number(initial!.split(" ")[2]);
  await expect.poll(width).toBeCloseTo(initialWidth / 2, 1);
  expect(await busPositions()).toEqual(positionsBefore);
  expect(await page.evaluate(() => window.visualViewport?.scale)).toBe(1);
  await page.getByRole("button", { name: "Fit diagram" }).click();
  await expect(diagram).toHaveAttribute("viewBox", initial!);
  await session.detach();
});

test("power cards work on hover and touch, stay readable at zoom, and clear on exit", async ({
  page,
  isMobile,
}) => {
  await gotoAndStabilize(page, "/experimental/load-flow/");
  const bus = page.getByRole("button", { name: /^Bus Gen Bus,/ });
  const diagram = page.getByTestId("load-flow-diagram");
  await diagram.scrollIntoViewIfNeeded();
  if (isMobile) await bus.tap();
  else await bus.hover();
  const card = page.getByRole("tooltip");
  await expect(card).toContainText("Generator");
  await expect(card).toContainText("20.0 MW");
  const cardBox = (await card.boundingBox())!;
  const diagramBox = (await diagram.boundingBox())!;
  expect(cardBox.x).toBeGreaterThanOrEqual(diagramBox.x);
  expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(
    diagramBox.x + diagramBox.width
  );
  expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(
    diagramBox.y + diagramBox.height
  );
  if (!isMobile) {
    await card.hover();
    await expect(card).toBeVisible();
    await page
      .getByRole("heading", { name: "Single-line diagram", exact: true })
      .hover();
    await expect(card).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await bus.focus();
  await expect(card).toHaveCSS("font-size", "12px");
  await bus.press("Escape");
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: "Fit diagram", exact: true }).click();
  const line = page.getByRole("button", { name: /^Line line-1-2:/ });
  await line.focus();
  await expect(card).toContainText("From · Slack");
  await expect(card).toContainText("To · Gen Bus");
  await expect(card).toContainText("Positive = into line at that end");
});

test("IEEE 30 arrangement is repeatable without resetting load or manual edits", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/load-flow/");
  await page
    .getByRole("combobox", { name: "Network", exact: true })
    .selectOption("ieee-30-bus");
  const bus = page.getByRole("button", { name: /^Bus Bus 2,/ });
  const position = await bus.getAttribute("transform");
  await bus.focus();
  await bus.press("ArrowRight");
  await expect(bus).not.toHaveAttribute("transform", position!);
  await page.getByRole("slider").focus();
  await page.getByRole("slider").press("ArrowRight");
  await page
    .getByRole("button", { name: "Arrange buses", exact: true })
    .click();
  await expect(bus).toHaveAttribute("transform", position!);
  await expect(page.getByRole("slider")).toHaveValue("105");
  await expect(page.getByRole("status")).toContainText("Converged");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
