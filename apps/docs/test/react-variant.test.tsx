// apps/docs/test/react-variant.test.tsx
// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OutputState, VariantComponentProps } from "../src/components/playground/types";
import { ReactVariant } from "../src/components/playground/variants/react-variant";

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

async function submitForm(container: HTMLDivElement): Promise<void> {
  const form = container.querySelector("form");
  if (!form) throw new Error("Missing React variant form.");
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();
  });
}

describe("ReactVariant", () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("submits the seeded valid form and emits react output states", async () => {
    const view = renderVariant(ReactVariant);
    const firstNameInput = view.container.querySelector<HTMLInputElement>('input[name="person.name.first"]');
    const emailInput = view.container.querySelector<HTMLInputElement>('input[name="person.email"]');

    expect(firstNameInput?.value).toBe("Sam");
    expect(emailInput?.value).toBe("sam.vimes@ankh-morpork.gov");

    await submitForm(view.container);

    expect(view.getLastOutputState()).toMatchObject({
      kind: "react",
      status: "running",
      submitFlags: { isSubmitting: true, isError: false, isSuccess: false },
      parsedPayload: null,
      meta: { submitMode: "onSubmit", validationEnabled: true }
    });

    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "react",
      status: "success",
      statusMessage: "Callback resolved",
      submitFlags: { isSubmitting: false, isError: false, isSuccess: true },
      error: null,
      parsedPayload: {
        person: {
          age: 45,
          email: "sam.vimes@ankh-morpork.gov",
          guild: "watchman",
          interests: ["city-watch", "cigars"],
          name: { first: "Sam", last: "Vimes" }
        }
      },
      meta: { submitMode: "onSubmit", validationEnabled: true }
    });

    act(() => { view.root.unmount(); });
  });

  it("emits validation failure output when seeded fields become invalid", async () => {
    const view = renderVariant(ReactVariant);
    const emailInput = view.container.querySelector<HTMLInputElement>('input[name="person.email"]');

    act(() => {
      if (!emailInput) throw new Error("Missing email input.");
      emailInput.value = "bad-email";
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await submitForm(view.container);

    expect(view.getLastOutputState()).toEqual({
      kind: "react",
      status: "error",
      statusMessage: "Submit failed",
      submitFlags: { isSubmitting: false, isError: true, isSuccess: false },
      error: { message: "person.email: Email must be valid." },
      parsedPayload: null,
      meta: { submitMode: "onSubmit", validationEnabled: true }
    });

    act(() => { view.root.unmount(); });
  });

  it("emits callback failure output when the Force Error button is clicked", async () => {
    const view = renderVariant(ReactVariant);
    const forceErrorButton = [...view.container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Force Error")
    );

    expect(forceErrorButton).toBeDefined();

    act(() => {
      forceErrorButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(view.getLastOutputState()).toMatchObject({
      kind: "react",
      status: "running"
    });

    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "react",
      status: "error",
      statusMessage: "Submit failed",
      submitFlags: { isSubmitting: false, isError: true, isSuccess: false },
      error: { message: "Simulated server error." },
      parsedPayload: null,
      meta: { submitMode: "onSubmit", validationEnabled: true }
    });

    act(() => { view.root.unmount(); });
  });

  it("resets back to idle and clears the last successful payload", async () => {
    const view = renderVariant(ReactVariant);
    const resetButton = [...view.container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Reset state")
    );

    await submitForm(view.container);
    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
    });

    expect(view.getLastOutputState()).toMatchObject({ kind: "react", status: "success" });

    act(() => {
      resetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(view.getLastOutputState()).toEqual({
      kind: "react",
      status: "idle",
      statusMessage: "Ready to submit.",
      submitFlags: { isSubmitting: false, isError: false, isSuccess: false },
      error: null,
      parsedPayload: null,
      meta: { submitMode: "onSubmit", validationEnabled: true }
    });

    act(() => { view.root.unmount(); });
  });
});
