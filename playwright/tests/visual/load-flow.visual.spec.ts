import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

test("parallel circuits have separate visible tracks", async ({ page }) => {
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
  await page.getByRole("button", { name: "Fit diagram" }).click();
  await page.mouse.move(0, 0);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("load-flow-diagram")).toHaveScreenshot(
    "load-flow-parallel.png"
  );
});

test("load-flow diagram and terminal inspector stay readable", async ({
  page,
}) => {
  await gotoAndStabilize(page, "/experimental/load-flow/");
  await expect(page).toHaveScreenshot("load-flow.png", { fullPage: true });
  await expect(page.getByTestId("load-flow-diagram")).toHaveScreenshot(
    "load-flow-diagram.png"
  );
  await page
    .getByRole("combobox", { name: "Inspect", exact: true })
    .selectOption("BRANCH:line-1-2");
  await page.getByRole("button", { name: "Q · MVAr", exact: true }).click();
  await expect(
    page.getByRole("region", {
      name: "Interactive load-flow tool",
      exact: true,
    })
  ).toHaveScreenshot("load-flow-reactive.png");
  await page
    .getByRole("combobox", { name: "Network", exact: true })
    .selectOption("ieee-14-bus");
  await expect(page.getByTestId("load-flow-diagram")).toHaveScreenshot(
    "load-flow-ieee14.png"
  );
  await page
    .getByRole("combobox", { name: "Network", exact: true })
    .selectOption("ieee-30-bus");
  await expect(page.getByTestId("load-flow-diagram")).toHaveScreenshot(
    "load-flow-ieee30.png"
  );
  await page.getByRole("button", { name: /^Bus Bus 2,/ }).focus();
  await expect(page.getByRole("tooltip")).toHaveScreenshot(
    "load-flow-power-card.png"
  );
});
