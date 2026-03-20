// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SchemaValidator } from "@form2js/form-data";
import { useForm2js, type UseForm2jsOptions, type UseForm2jsResult, type UseForm2jsSubmit } from "../src/index";

const reactActScope = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
reactActScope.IS_REACT_ACT_ENVIRONMENT = true;

interface HarnessProps<TSchema extends SchemaValidator | undefined = undefined> {
  submit: UseForm2jsSubmit<TSchema>;
  options?: UseForm2jsOptions<TSchema>;
  onSnapshot: (state: UseForm2jsResult) => void;
  renderFields?: () => React.ReactNode;
}

function Harness<TSchema extends SchemaValidator | undefined = undefined>(
  props: HarnessProps<TSchema>
): React.ReactElement {
  const state = useForm2js(props.submit, props.options);
  props.onSnapshot(state);
  const fields =
    props.renderFields?.() ??
    React.createElement("input", { name: "person.name", defaultValue: "Neo" });

  return React.createElement(
    "form",
    { onSubmit: state.onSubmit },
    fields,
    React.createElement("button", { type: "submit" }, "Submit")
  );
}

interface MountedHarness {
  root: Root;
  container: HTMLDivElement;
}

const mountedHarnesses: MountedHarness[] = [];

afterEach(() => {
  for (const mounted of mountedHarnesses) {
    act(() => {
      mounted.root.unmount();
    });
    mounted.container.remove();
  }

  mountedHarnesses.length = 0;
});

function renderHarness<TSchema extends SchemaValidator | undefined = undefined>(
  submit: UseForm2jsSubmit<TSchema>,
  options?: UseForm2jsOptions<TSchema>,
  renderFields?: () => React.ReactNode
): {
  form: HTMLFormElement;
  getState: () => UseForm2jsResult;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedHarnesses.push({ root, container });

  let latestState: UseForm2jsResult | null = null;

  const harnessProps: HarnessProps<TSchema> = {
    submit,
    onSnapshot(state) {
      latestState = state;
    }
  };

  if (options !== undefined) {
    harnessProps.options = options;
  }

  if (renderFields !== undefined) {
    harnessProps.renderFields = renderFields;
  }

  act(() => {
    root.render(React.createElement(Harness, harnessProps));
  });

  const form = container.querySelector("form");
  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Harness form was not rendered");
  }

  return {
    form,
    getState() {
      if (!latestState) {
        throw new Error("Hook state snapshot is not available");
      }

      return latestState;
    }
  };
}

function dispatchSubmit(form: HTMLFormElement): void {
  act(() => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

async function submitAndFlush(form: HTMLFormElement): Promise<void> {
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();
  });
}

function createDeferred<TValue = undefined>(): {
  promise: Promise<TValue>;
  resolve: (value: TValue) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: TValue) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<TValue>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

describe("useForm2js", () => {
  it("submits validated data and marks submit as successful", async () => {
    const schema = {
      parse(value: unknown) {
        const record = value as { person?: { name?: string } };
        return {
          profileName: (record.person?.name ?? "").toUpperCase()
        };
      }
    };
    const received: unknown[] = [];
    const submit = vi.fn((data: { profileName: string }) => {
      received.push(data);
    });

    const { form, getState } = renderHarness(submit, { schema });
    await submitAndFlush(form);

    expect(submit).toHaveBeenCalledTimes(1);
    expect(received).toEqual([{ profileName: "NEO" }]);
    expect(getState().isSubmitting).toBe(false);
    expect(getState().isError).toBe(false);
    expect(getState().error).toBeNull();
    expect(getState().isSuccess).toBe(true);
  });

  it("captures validation errors and does not call submit callback", async () => {
    const schema = {
      parse() {
        throw new Error("Invalid payload");
      }
    };
    const submit = vi.fn(() => Promise.resolve());

    const { form, getState } = renderHarness(submit, { schema });
    await submitAndFlush(form);

    expect(submit).not.toHaveBeenCalled();
    expect(getState().isSubmitting).toBe(false);
    expect(getState().isError).toBe(true);
    expect(getState().isSuccess).toBe(false);
    expect(getState().error).toBeInstanceOf(Error);
  });

  it("captures submit errors from async callback", async () => {
    const submit = vi.fn(() => Promise.reject(new Error("Network failed")));

    const { form, getState } = renderHarness(submit);
    await submitAndFlush(form);

    expect(submit).toHaveBeenCalledTimes(1);
    expect(getState().isError).toBe(true);
    expect(getState().isSuccess).toBe(false);
    expect(getState().error).toBeInstanceOf(Error);
  });

  it("ignores duplicate submit attempts while request is in flight", async () => {
    const deferred = createDeferred();
    const submit = vi.fn(() => deferred.promise);

    const { form, getState } = renderHarness(submit);

    dispatchSubmit(form);
    dispatchSubmit(form);

    expect(submit).toHaveBeenCalledTimes(1);
    expect(getState().isSubmitting).toBe(true);

    deferred.resolve(undefined);
    await act(async () => {
      await deferred.promise;
      await Promise.resolve();
    });

    expect(getState().isSubmitting).toBe(false);
  });

  it("reset clears error and success flags", async () => {
    const submit = vi.fn(() => Promise.reject(new Error("submit failed")));

    const { form, getState } = renderHarness(submit);
    await submitAndFlush(form);
    expect(getState().isError).toBe(true);

    act(() => {
      getState().reset();
    });

    expect(getState().isError).toBe(false);
    expect(getState().error).toBeNull();
    expect(getState().isSuccess).toBe(false);
  });

  it("submits parsed object when schema is omitted", async () => {
    const received: unknown[] = [];
    const submit = vi.fn((data: unknown) => {
      received.push(data);
    });

    const { form, getState } = renderHarness(submit);
    await submitAndFlush(form);

    expect(submit).toHaveBeenCalledTimes(1);
    expect(received).toEqual([
      {
        person: {
          name: "Neo"
        }
      }
    ]);
    expect(getState().isSuccess).toBe(true);
  });

  it("forwards delimiter and skipEmpty options to the parser", async () => {
    const received: unknown[] = [];
    const submit = vi.fn((data: unknown) => {
      received.push(data);
    });

    const { form } = renderHarness(
      submit,
      {
        delimiter: "/",
        skipEmpty: false
      },
      () =>
        React.createElement(
          React.Fragment,
          null,
          React.createElement("input", { name: "person/name", defaultValue: "Neo" }),
          React.createElement("input", { name: "person/alias", defaultValue: "" })
        )
    );

    await submitAndFlush(form);

    expect(received).toEqual([
      {
        person: {
          name: "Neo",
          alias: ""
        }
      }
    ]);
  });

  it("forwards allowUnsafePathSegments to the parser", async () => {
    const submit = vi.fn(() => Promise.resolve());

    const { form, getState } = renderHarness(
      submit,
      {
        allowUnsafePathSegments: true
      },
      () => React.createElement("input", { name: "__proto__.polluted", defaultValue: "yes" })
    );

    await submitAndFlush(form);

    expect(submit).toHaveBeenCalledTimes(1);
    expect(getState().isError).toBe(false);
    expect(getState().isSuccess).toBe(true);
  });
});
