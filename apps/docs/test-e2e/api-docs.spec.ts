import { expect, test } from "@playwright/test";

test("api docs route renders the TOC and supports section anchors on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/api/");

  await expect(page.getByRole("heading", { name: "form2js API Reference" })).toBeVisible();
  await expect(page.getByText("On this page")).toBeVisible();

  await page.getByRole("link", { name: "@form2js/react" }).click();
  await expect(page).toHaveURL(/#form2js-react$/);
  await expect(page.getByRole("heading", { name: "@form2js/react" })).toBeVisible();
});
