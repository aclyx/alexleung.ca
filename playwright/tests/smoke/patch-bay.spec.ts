import { expect, test } from "@playwright/test";

test("a bad campaign download leaves the practice board playable", async ({
  page,
}) => {
  let requested = false;
  await page.route("**/CHIPS.DAT", async (route) => {
    requested = true;
    await route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      contentType: "application/octet-stream",
      body: "Wrong Windows edition",
    });
  });
  await page.goto("/experimental/patch-bay/");
  await expect(page.getByRole("heading", { name: "Bench test" })).toBeVisible();
  expect(requested).toBe(true);
  expect(
    await page.evaluate(() => localStorage.getItem("patch-bay.v1.dat"))
  ).toBeNull();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Levels", exact: true }).click();
  await expect(page.getByText("Open CHIPS.DAT", { exact: true })).toBeVisible();
});
