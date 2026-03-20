// apps/docs/test/standard-variants.test.tsx
// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OutputState, VariantComponentProps } from "../src/components/playground/types";
import { ensureJqueryBootstrap } from "../src/components/playground/bootstrap/jquery-bootstrap";
import { FormVariant } from "../src/components/playground/variants/form-variant";
import { JQueryVariant } from "../src/components/playground/variants/jquery-variant";
import { Js2FormVariant } from "../src/components/playground/variants/js2form-variant";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

interface RenderResult {
  container: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
  getLastOutputState: () => OutputState | null;
  render: () => void;
}

function renderVariant(Component: (props: VariantComponentProps) => React.ReactNode): RenderResult {
  let lastOutputState: OutputState | null = null;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  function render(): void {
    act(() => {
      root.render(
        <Component
          isActive
          onOutputChange={(outputState) => { lastOutputState = outputState; }}
          reportFatalError={(errorInfo) => { throw new Error(`Unexpected fatal error: ${errorInfo.message}`); }}
        />
      );
    });
  }

  render();
  return { container, root, render, getLastOutputState: () => lastOutputState };
}

describe("standard playground variants", () => {
  beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("runs the form variant with seeded controls via form submit", () => {
    const view = renderVariant(FormVariant);

    const firstNameInput = view.container.querySelector<HTMLInputElement>('input[name="person.name.first"]');
    const lastNameInput = view.container.querySelector<HTMLInputElement>('input[name="person.name.last"]');
    const form = view.container.querySelector("form");

    expect(firstNameInput?.value).toBe("Esme");
    expect(lastNameInput?.value).toBe("Weatherwax");
    expect(form).toBeDefined();

    act(() => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "standard",
      status: "success",
      statusMessage: "@form2js/dom -> formToObject(form)",
      errorMessage: null,
      parsedPayload: {
        person: {
          approved: false,
          city: "lancre",
          guild: "witches",
          name: { first: "Esme", last: "Weatherwax" },
          tags: ["witch", "headology"]
        }
      }
    });

    act(() => { view.root.unmount(); });
  });

  it("runs the jquery variant in combine mode and installs the plugin idempotently", () => {
    const beforeInstall = ensureJqueryBootstrap();
    const secondInstall = ensureJqueryBootstrap();
    expect(secondInstall).toBe(beforeInstall);

    const view = renderVariant(JQueryVariant);
    const modeSelect = view.container.querySelector<HTMLSelectElement>('select[name="jquery-mode"]');
    const runButton = [...view.container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("@form2js/jquery")
    );

    expect(modeSelect?.value).toBe("combine");

    act(() => {
      runButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "standard",
      status: "success",
      statusMessage: '@form2js/jquery -> $(".jq-slice").toObject({ mode: "combine" })',
      errorMessage: null,
      parsedPayload: {
        person: {
          city: "lancre",
          first: "Gytha",
          guild: "witches",
          last: "Ogg"
        }
      }
    });

    act(() => { view.root.unmount(); });
  });

  it("applies js2form data, reports invalid JSON, and resets back to idle", () => {
    const view = renderVariant(Js2FormVariant);
    const jsonInput = view.container.querySelector<HTMLTextAreaElement>('textarea[name="js2form-json"]');
    const firstNameInput = view.container.querySelector<HTMLInputElement>('input[name="person.name.first"]');
    const applyButton = [...view.container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Apply js2form")
    );
    const resetButton = [...view.container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Reset form")
    );

    expect(jsonInput?.value).toContain('"first": "Tiffany"');
    expect(firstNameInput?.value).toBe("Esme");

    act(() => {
      if (!jsonInput) throw new Error("Missing js2form JSON input.");
      jsonInput.value = "{";
      jsonInput.dispatchEvent(new Event("input", { bubbles: true }));
      applyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "standard",
      status: "error",
      statusMessage: "js2form apply failed.",
      errorMessage: "JSON parse error: please provide valid JSON before applying js2form.",
      parsedPayload: null
    });

    act(() => {
      if (!jsonInput) throw new Error("Missing js2form JSON input.");
      jsonInput.value = `{
  "person": {
    "name": { "first": "Tiffany", "last": "Aching" },
    "city": "quirm",
    "tags": ["witch"]
  }
}`;
      jsonInput.dispatchEvent(new Event("input", { bubbles: true }));
      applyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "standard",
      status: "success",
      statusMessage: "@form2js/js2form -> objectToForm(...), then formToObject(...)",
      errorMessage: null,
      parsedPayload: {
        person: { city: "quirm", name: { first: "Tiffany", last: "Aching" }, tags: ["witch"] }
      }
    });

    expect(firstNameInput?.value).toBe("Tiffany");

    act(() => {
      resetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(firstNameInput?.value).toBe("Esme");
    expect(view.getLastOutputState()).toEqual({
      kind: "standard",
      status: "idle",
      statusMessage: "Ready to apply object data.",
      errorMessage: null,
      parsedPayload: null
    });

    act(() => { view.root.unmount(); });
  });
});
