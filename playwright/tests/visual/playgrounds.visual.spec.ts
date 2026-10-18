import { expect, gotoAndStabilize, test } from "../../fixtures/stableRendering";

for (const route of ["ray-tracing", "seam-carving"]) {
  test(route + " stays readable on desktop and mobile", async ({ page }) => {
    test.setTimeout(120_000);
    await gotoAndStabilize(page, "/experimental/" + route + "/");
    if (route === "ray-tracing")
      await expect(page.getByRole("status")).toContainText("Render complete", {
        timeout: 60_000,
      });
    if (route === "seam-carving")
      await expect(page.getByRole("status")).toContainText("Ready.", {
        timeout: 20_000,
      });
    await expect(page).toHaveScreenshot(route + ".png", { fullPage: true });
    if (route === "seam-carving") {
      await page.getByRole("button", { name: "Paint protection" }).click();
      const source = page.getByRole("img", {
        name: /Paint protection on the original/,
      });
      await source.focus();
      await source.press("Enter");
      await expect(page.getByRole("status")).toContainText("Ready.");
      await page.getByText("Inspect the seams").click();
      await expect(
        page.getByRole("region", { name: "Seam carving playground" })
      ).toHaveScreenshot("seam-energy-protection.png");
    }
    if (route === "ray-tracing") {
      await page.getByRole("checkbox", { name: "Inspect a pixel" }).check();
      await expect(
        page.getByRole("region", { name: "Ray tracing playground" })
      ).toHaveScreenshot("ray-path-inspector.png");
    }
  });
}
