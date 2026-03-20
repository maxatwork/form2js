// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OutputState, VariantComponentProps, VariantDefinition, VariantId } from "../src/components/playground/types";

function createReactOutput(statusMessage: string): OutputState {
  return {
    kind: "react",
    status: "success",
    statusMessage,
    submitFlags: {
      isSubmitting: false,
      isError: false,
      isSuccess: true
    },
    error: null,
    parsedPayload: { ok: true },
    meta: {
      submitMode: "onSubmit",
      validationEnabled: true
    }
  };
}

function createStandardOutput(statusMessage: string): OutputState {
  return {
    kind: "standard",
    status: "success",
    statusMessage,
    errorMessage: null,
    parsedPayload: { ok: true }
  };
}

function makeVariant(
  id: VariantId,
  kind: VariantDefinition["kind"],
  label: string,
  statusMessage: string,
  options?: {
    throwWhenActive?: boolean;
  }
): VariantDefinition {
  function Component(props: VariantComponentProps) {
    if (options?.throwWhenActive && props.isActive) {
      throw new Error(`${label} render exploded`);
    }

    return (
      <div data-testid={`${id}-variant`}>
        <span>{props.isActive ? `${label} active` : `${label} hidden`}</span>
        <button
          onClick={() => {
            props.onOutputChange(
              kind === "react" ? createReactOutput(statusMessage) : createStandardOutput(statusMessage)
            );
          }}
          type="button"
        >
          Emit {label}
        </button>
        <button
          onClick={() => {
            props.reportFatalError({
              message: `${label} crashed`,
              source: "event"
            });
          }}
          type="button"
        >
          Fail {label}
        </button>
      </div>
    );
  }

  return {
    id,
    kind,
    label,
    summary: `${label} summary`,
    packages: [`@form2js/${id}`],
    createInitialOutputState: () =>
      kind === "react"
        ? {
            kind: "react",
            status: "idle",
            statusMessage: `Ready for ${label}`,
            submitFlags: {
              isSubmitting: false,
              isError: false,
              isSuccess: false
            },
            error: null,
            parsedPayload: null
          }
        : {
            kind: "standard",
            status: "idle",
            statusMessage: `Ready for ${label}`,
            errorMessage: null,
            parsedPayload: null
          },
    Component
  };
}

const { mockVariantsById } = vi.hoisted(() => ({
  mockVariantsById: {
    react: makeVariant("react", "react", "React", "React complete"),
    form: makeVariant("form", "standard", "Form", "Form complete"),
    jquery: makeVariant("jquery", "standard", "jQuery", "jQuery complete"),
    js2form: makeVariant("js2form", "standard", "js2form", "js2form complete"),
    core: makeVariant("core", "standard", "Core", "Core complete"),
    "form-data": makeVariant("form-data", "standard", "FormData", "FormData complete")
  } satisfies Record<VariantId, VariantDefinition>
}));

vi.mock("../src/components/playground/variant-registry", () => ({
  VARIANT_IDS: ["react", "form", "jquery", "js2form", "core", "form-data"],
  variantsById: mockVariantsById
}));

import { PlaygroundShell } from "../src/components/playground/PlaygroundShell";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  consoleErrorSpy.mockRestore();
  vi.clearAllMocks();
});

function renderShell(): void {
  act(() => {
    root.render(<PlaygroundShell />);
  });
}

describe("PlaygroundShell", () => {
  it("renders the active variant and chooses the output panel by kind", () => {
    window.history.replaceState({}, "", "/?variant=react");

    renderShell();

    expect(container.textContent).toContain("React summary");
    expect(container.textContent).toContain("React active");
    expect(container.textContent).toContain("Submit state");
    expect(container.textContent).toContain("Ready for React");
  });

  it("updates the query string when switching variants", () => {
    window.history.replaceState({}, "", "/docs/start?variant=react#top");

    renderShell();

    const formButton = container.querySelector('button[data-variant-id="form"]');
    expect(formButton).not.toBeNull();

    act(() => {
      formButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(window.location.pathname).toBe("/docs/start");
    expect(window.location.search).toBe("?variant=form");
    expect(window.location.hash).toBe("");
    expect(container.textContent).toContain("Form active");
    expect(container.textContent).toContain("Parsed result");
  });

  it("does not render placeholder payload output while a variant is idle", () => {
    window.history.replaceState({}, "", "/?variant=react");

    renderShell();

    expect(container.textContent).toContain("Ready for React");
    expect(container.textContent).not.toContain("null");

    const formButton = container.querySelector('button[data-variant-id="form"]');
    act(() => {
      formButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Ready for Form");
    expect(container.textContent).not.toContain("null");
  });

  it("preserves emitted output state when switching away and back", () => {
    renderShell();

    const emitReact = [...container.querySelectorAll("button")].find((button) => button.textContent === "Emit React");
    expect(emitReact).not.toBeUndefined();

    act(() => {
      emitReact?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("React complete");
    expect(container.textContent).toContain("submitMode");
    expect(container.textContent).toContain("onSubmit");
    expect(container.textContent).toContain("validationEnabled");
    expect(container.textContent).toContain("true");

    const formButton = container.querySelector('button[data-variant-id="form"]');
    act(() => {
      formButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("React hidden");

    const reactButton = container.querySelector('button[data-variant-id="react"]');
    act(() => {
      reactButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("React complete");
  });

  it("renders a failed-state fallback and keeps it when revisiting the variant", () => {
    renderShell();

    const emitReact = [...container.querySelectorAll("button")].find((button) => button.textContent === "Emit React");
    const failReact = [...container.querySelectorAll("button")].find((button) => button.textContent === "Fail React");
    expect(emitReact).not.toBeUndefined();
    expect(failReact).not.toBeUndefined();

    act(() => {
      emitReact?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("React complete");

    act(() => {
      failReact?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("React crashed");
    expect(container.textContent).not.toContain("React complete");
    expect(container.textContent).not.toContain("submitMode");
    expect(container.textContent).not.toContain("React active");

    const formButton = container.querySelector('button[data-variant-id="form"]');
    act(() => {
      formButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const reactButton = container.querySelector('button[data-variant-id="react"]');
    act(() => {
      reactButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("React crashed");
    expect(container.textContent).not.toContain("React complete");
    expect(container.textContent).not.toContain("submitMode");
  });

  it("isolates a thrown active-variant render failure and keeps the switcher usable", async () => {
    mockVariantsById.react = makeVariant("react", "react", "React", "React complete", {
      throwWhenActive: true
    });

    renderShell();

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain("React failed");
    expect(container.textContent).toContain("React render exploded");
    expect(container.textContent).not.toContain("Form failed");

    const formButton = container.querySelector('button[data-variant-id="form"]');
    expect(formButton).not.toBeNull();

    act(() => {
      formButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Form active");
    expect(container.textContent).toContain("Parsed result");

    const reactButton = container.querySelector('button[data-variant-id="react"]');
    act(() => {
      reactButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain("React failed");
    expect(container.textContent).toContain("React render exploded");

    mockVariantsById.react = makeVariant("react", "react", "React", "React complete");
  });
});
