// apps/docs/test/data-variants.test.tsx
// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlaygroundShell } from "../src/components/playground/PlaygroundShell";
import type { OutputState, VariantComponentProps } from "../src/components/playground/types";
import { CoreVariant } from "../src/components/playground/variants/core-variant";
import { FormDataVariant } from "../src/components/playground/variants/form-data-variant";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

interface RenderResult {
  container: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
  getLastOutputState: () => OutputState | null;
}

function renderVariant(Component: (props: VariantComponentProps) => React.ReactNode): RenderResult {
  let lastOutputState: OutputState | null = null;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <Component
        isActive
        onOutputChange={(outputState) => { lastOutputState = outputState; }}
        reportFatalError={(errorInfo) => { throw new Error(`Unexpected fatal error: ${errorInfo.message}`); }}
      />
    );
  });
  return { container, root, getLastOutputState: () => lastOutputState };
}

describe("parser playground variants", () => {
  beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("runs the core variant from seeded entry objects (Moist von Lipwig)", () => {
    const view = renderVariant(CoreVariant);
    const jsonInput = view.container.querySelector<HTMLTextAreaElement>('textarea[name="core-entries-json"]');
    const runButton = [...view.container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("@form2js/core")
    );

    expect(jsonInput?.value).toContain('"key": "person.name.first"');
    expect(jsonInput?.value).toContain("Moist");

    act(() => {
      runButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "standard",
      status: "success",
      statusMessage: "@form2js/core -> entriesToObject(entry objects)",
      errorMessage: null,
      parsedPayload: {
        person: {
          city: "ankh-morpork",
          guild: "thieves",
          name: { first: "Moist", last: "von Lipwig" },
          tags: ["crime", "banking"]
        }
      }
    });

    act(() => { view.root.unmount(); });
  });

  it("runs the form-data variant from a submitted form (Tiffany Aching)", () => {
    const view = renderVariant(FormDataVariant);
    const firstNameInput = view.container.querySelector<HTMLInputElement>('input[name="person.name.first"]');
    const form = view.container.querySelector("form");

    expect(firstNameInput?.value).toBe("Tiffany");
    expect(form).not.toBeNull();

    act(() => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "standard",
      status: "success",
      statusMessage: "@form2js/form-data -> formDataToObject(form)",
      errorMessage: null,
      parsedPayload: {
        person: {
          city: "quirm",
          guild: "witches",
          name: { first: "Tiffany", last: "Aching" },
          tags: ["witch"]
        }
      }
    });

    act(() => { view.root.unmount(); });
  });

  it("reports runtime merge failures from the core parser instead of labeling them as JSON parse errors", () => {
    const view = renderVariant(CoreVariant);
    const jsonInput = view.container.querySelector<HTMLTextAreaElement>('textarea[name="core-entries-json"]');
    const runButton = [...view.container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("@form2js/core")
    );

    act(() => {
      if (!jsonInput) throw new Error("Missing core JSON input.");
      jsonInput.value = JSON.stringify([
        { key: "person", value: "watch" },
        { key: "person.name.first", value: "Sam" }
      ]);
      jsonInput.dispatchEvent(new Event("input", { bubbles: true }));
      runButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "standard",
      status: "error",
      statusMessage: "core parse failed.",
      errorMessage: "Core conversion failed: Expected object-like container while setting nested path",
      parsedPayload: null
    });

    act(() => { view.root.unmount(); });
  });

  it("preserves core output when switching away and back through the shell", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    act(() => { root.render(<PlaygroundShell />); });

    const coreButton = container.querySelector('button[data-variant-id="core"]');
    act(() => { coreButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });

    const runButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("@form2js/core")
    );
    act(() => { runButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });

    expect(container.textContent).toContain("@form2js/core -> entriesToObject(entry objects)");
    expect(container.textContent).toContain("von Lipwig");

    const formButton = container.querySelector('button[data-variant-id="form"]');
    act(() => { formButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    act(() => { coreButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });

    expect(container.textContent).toContain("@form2js/core -> entriesToObject(entry objects)");
    expect(container.textContent).toContain("von Lipwig");

    act(() => { root.unmount(); });
  });
});
