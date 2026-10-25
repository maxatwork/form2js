import { expect, test } from "@playwright/test";

test("landing page renders its sections and updates install guidance for each browser adapter", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Turn forms");
  await expect(page.getByRole("heading", { name: "Try it live" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Install", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "API Documentation" })).toBeVisible();
  await expect(page.locator("#install-cmd")).toHaveText("npm install @form2js/react react");
  await expect(page.locator("#install-alt-snippet")).toBeHidden();

  for (const variant of [
    { id: "form", command: "npm install @form2js/dom", bundle: "@form2js/dom" },
    { id: "jquery", command: "npm install @form2js/jquery jquery", bundle: "@form2js/jquery" }
  ]) {
    await page.locator(`button[data-variant-id="${variant.id}"]`).click();
    await expect(page.locator("#hero-install-pkg")).toHaveText(variant.command);
    await expect(page.locator("#install-cmd")).toHaveText(variant.command);
    await expect(page.locator("#install-alt-snippet")).toBeVisible();
    await expect(page.locator("#install-alt-snippet")).toContainText(
      `https://unpkg.com/${variant.bundle}/dist/standalone.global.js`
    );
  }
});

test("playground stacks its columns and removes the divider on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const formColumn = page.locator(".pg-form-col");
  const outputColumn = page.locator(".pg-output-col");

  await expect(formColumn).toHaveCSS("border-right-width", "1px");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(formColumn).toHaveCSS("border-right-width", "0px");
  const formBounds = await formColumn.boundingBox();
  const outputBounds = await outputColumn.boundingBox();
  expect(formBounds).not.toBeNull();
  expect(outputBounds).not.toBeNull();
  if (!formBounds || !outputBounds) throw new Error("Playground columns are missing");
  expect(outputBounds.y).toBeGreaterThanOrEqual(formBounds.y + formBounds.height);
});

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
