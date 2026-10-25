import { expect, test } from "@playwright/test";

test("shared docs navigation opens the migration guide and its package links", async ({ page }) => {
  await page.goto("/api/");
  await page.getByRole("link", { name: "Migration", exact: true }).click();
  await expect(page).toHaveURL(/\/migrate\/$/);
  await expect(page.getByRole("heading", { name: "Migrate from Legacy form2js" })).toBeVisible();
  await page.getByRole("link", { name: "@form2js/dom", exact: true }).first().click();
  await expect(page).toHaveURL(/\/api\/dom\/$/);
  await expect(page.getByRole("heading", { name: "@form2js/dom", exact: true })).toBeVisible();
});

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
