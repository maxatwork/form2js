// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { installToObjectPlugin, maybeAutoInstallPlugin } from "../src/index";

type ToObjectOptions = {
  mode?: "first" | "all" | "combine";
};

type ToObjectResult = unknown;

type StubCollection = {
  length: number;
  get(index: number): Element | undefined;
  each(callback: (this: Element, index: number, element: Element) => void): StubCollection;
  toObject?: (options?: ToObjectOptions) => ToObjectResult;
};

type SelectorInput = string | Element | Element[];

type StubJQuery = ((input: SelectorInput) => StubCollection) & {
  fn: Record<string, unknown>;
  extend(target: object, ...sources: object[]): object;
};

function createCollection(elements: Element[], fn: Record<string, unknown>): StubCollection {
  const collection: StubCollection = {
    length: elements.length,
    get(index: number): Element | undefined {
      return elements[index];
    },
    each(callback) {
      for (let index = 0; index < elements.length; index += 1) {
        const element = elements[index];
        if (element) {
          callback.call(element, index, element);
        }
      }
      return this;
    }
  };

  Object.setPrototypeOf(collection, fn);
  return collection;
}

function createStubJQuery(): StubJQuery {
  const fn: Record<string, unknown> = {};

  const $ = ((input: SelectorInput): StubCollection => {
    if (typeof input === "string") {
      return createCollection(Array.from(document.querySelectorAll(input)), fn);
    }

    if (Array.isArray(input)) {
      return createCollection(input, fn);
    }

    return createCollection([input], fn);
  }) as StubJQuery;

  $.fn = fn;
  $.extend = (target, ...sources) => {
    Object.assign(target, ...sources);
    return target;
  };
  return $;
}

describe("installToObjectPlugin", () => {
  it("supports legacy first/all/combine modes", () => {
    document.body.innerHTML = `
      <form class="part" id="f1"><input name="person.first" value="Neo" /></form>
      <form class="part" id="f2"><input name="person.last" value="Anderson" /></form>
    `;

    const $ = createStubJQuery();
    installToObjectPlugin($);

    const first = $(".part").toObject?.({ mode: "first" });
    const all = $(".part").toObject?.({ mode: "all" });
    const combine = $(".part").toObject?.({ mode: "combine" });

    expect(first).toEqual({ person: { first: "Neo" } });
    expect(all).toEqual([{ person: { first: "Neo" } }, { person: { last: "Anderson" } }]);
    expect(combine).toEqual({ person: { first: "Neo", last: "Anderson" } });
  });

  it("can be auto-installed", () => {
    const $ = createStubJQuery();
    maybeAutoInstallPlugin($);

    expect(typeof $.fn.toObject).toBe("function");
  });
});

describe("standalone entry", () => {
  it("auto-installs plugin from global jQuery", async () => {
    const $ = createStubJQuery();
    const scope = globalThis as typeof globalThis & { jQuery?: StubJQuery };

    scope.jQuery = $;
    await import("../src/standalone");

    expect(typeof $.fn.toObject).toBe("function");
  });
});
