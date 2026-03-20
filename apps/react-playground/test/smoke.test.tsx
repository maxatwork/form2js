// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";

const reactActScope = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
reactActScope.IS_REACT_ACT_ENVIRONMENT = true;

interface MountedRoot {
  root: ReturnType<typeof createRoot>;
  container: HTMLDivElement;
}

const mountedRoots: MountedRoot[] = [];

afterEach(() => {
  for (const mounted of mountedRoots) {
    act(() => {
      mounted.root.unmount();
    });
    mounted.container.remove();
  }

  mountedRoots.length = 0;
});

describe("react playground app", () => {
  it("renders the lifecycle demo layout", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    mountedRoots.push({ root, container });

    act(() => {
      root.render(<App />);
    });

    expect(container.textContent).toContain("React Playground");
    expect(container.querySelector("form")).toBeInstanceOf(HTMLFormElement);
    expect(container.textContent).toContain("Keep the form. Skip the manual parsing.");
    expect(container.textContent).toContain("How It Works");
    expect(container.textContent).toContain("Submit intercepted");
    expect(container.textContent).toContain("Live Hook State");
    expect(container.textContent).toContain("Validation / Error Output");
    expect(container.textContent).toContain("Parsed Result");
  });
});
