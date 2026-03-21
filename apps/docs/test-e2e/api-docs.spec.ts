import { expect, test } from "@playwright/test";

test("api docs index links to package pages and package toc anchors work on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/api/");

  await expect(page.getByRole("heading", { name: "form2js API Reference" })).toBeVisible();
  await expect(
    page.getByLabel("API packages").getByRole("link", { name: "@form2js/react" })
  ).toBeVisible();

  await page.getByLabel("API packages").getByRole("link", { name: "@form2js/react" }).click();
  await expect(page).toHaveURL(/\/api\/react\/$/);
  await expect(page.getByRole("heading", { name: "@form2js/react" })).toBeVisible();
  await expect(page.getByText("On this page")).toBeVisible();

  await page.getByLabel("On this page").getByRole("link", { name: "Installation" }).click();
  await expect(page).toHaveURL(/#installation$/);
});
