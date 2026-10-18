import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

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
});
