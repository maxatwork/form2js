import { expect, test } from "@playwright/test";

test("homepage switcher supports keyboard navigation and preserves parser output", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "API Docs", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Core" })).toBeVisible();

  const coreButton = page.locator('button[data-variant-id="core"]');
  await coreButton.focus();
  await coreButton.press("Space");
  await expect(coreButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#install-cmd")).toContainText("npm install @form2js/core");
  await expect(page.locator("#install-snippet")).toContainText("entriesToObject");
  await page.getByRole("button", { name: "Run @form2js/core" }).click();

  const resultJson = page.locator(".result-json");
  await expect(page.getByText("@form2js/core -> entriesToObject(entry objects)")).toBeVisible();
  await expect(resultJson).toContainText("von Lipwig");

  await page.locator('button[data-variant-id="form"]').click();
  await page.locator('button[data-variant-id="core"]').click();

  await expect(page.getByText("@form2js/core -> entriesToObject(entry objects)")).toBeVisible();
  await expect(resultJson).toContainText("von Lipwig");
});

test("fault-injected variant failure keeps the switcher usable", async ({ page }) => {
  await page.goto("/?variant=react&__fault=react:render");

  await expect(page.getByText("React failed to load.")).toBeVisible();
  await expect(page.getByText("Injected render fault for React")).toBeVisible();

  await page.locator('button[data-variant-id="form"]').click();
  await expect(page.getByRole("button", { name: "Run @form2js/dom" })).toBeVisible();
});
