// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { SKIP_NODE, extractPairs, form2js, formToObject } from "../src/index";

describe("extractPairs", () => {
  it("extracts input/select values", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input type="text" name="person.name.first" value="John" />
        <input type="text" name="person.name.last" value="Doe" />
        <select name="person.colors[]" multiple>
          <option value="red" selected>red</option>
          <option value="blue">blue</option>
          <option value="green" selected>green</option>
        </select>
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;
    const result = extractPairs(form);

    expect(result).toContainEqual({ key: "person.name.first", value: "John" });
    expect(result).toContainEqual({ key: "person.name.last", value: "Doe" });
    expect(result).toContainEqual({ key: "person.colors", value: ["red", "green"] });
  });

  it("extracts nested form controls inside arbitrary container markup", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <div class="wrapper">
          <section>
            <input type="text" name="person.name.first" value="John" />
          </section>
        </div>
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;
    const result = extractPairs(form);

    expect(result).toEqual([{ key: "person.name.first", value: "John" }]);
  });

  it("supports callback extraction", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <div id="person.callbackTest">hello world</div>
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;
    const result = extractPairs(form, {
      nodeCallback(node) {
        if (node instanceof HTMLDivElement && node.id === "person.callbackTest") {
          return { name: node.id, value: node.textContent };
        }

        return false;
      }
    });

    expect(result).toEqual([{ key: "person.callbackTest", value: "hello world" }]);
  });

  it("supports explicit callback exclusion without overloading falsy returns", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input name="person.changed" value="yes" data-changed="true" />
        <input name="person.unchanged" value="no" />
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;
    const result = extractPairs(form, {
      nodeCallback(node) {
        if (!(node instanceof HTMLInputElement)) {
          return false;
        }

        if (node.dataset.changed === "true") {
          return null;
        }

        return SKIP_NODE;
      }
    });

    expect(result).toEqual([{ key: "person.changed", value: "yes" }]);
  });

  it("excludes an entire supplied root when the callback returns SKIP_NODE for that root", () => {
    document.body.innerHTML = `
      <section id="wrapper">
        <input name="person.changed" value="yes" />
      </section>
    `;

    const wrapper = document.getElementById("wrapper") as HTMLElement;
    const result = extractPairs(wrapper, {
      nodeCallback(node) {
        if (node === wrapper) {
          return SKIP_NODE;
        }

        return false;
      }
    });

    expect(result).toEqual([]);
  });

  it("returns empty pairs when the root cannot be resolved", () => {
    expect(extractPairs("missing-form")).toEqual([]);
  });
});

describe("formToObject", () => {
  it("keeps legacy checkbox and radio coercion quirks", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input type="checkbox" name="person.agree" value="true" />
        <input type="radio" name="person.optOut" value="false" checked />
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;
    const result = formToObject(form);

    expect(result).toEqual({
      person: {
        agree: false,
        optOut: false
      }
    });
  });

  it("does not coerce an empty checked radio option to false when true and false siblings exist", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input type="radio" name="state" value="" checked />
        <input type="radio" name="state" value="true" />
        <input type="radio" name="state" value="false" />
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;
    const result = formToObject(form, { skipEmpty: false });

    expect(result).toEqual({
      state: ""
    });
  });

  it("supports id fallback and disabled field extraction", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input id="person.name.first" name="" value="John" />
        <input id="person.name.last" disabled value="Doe" />
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;

    const withoutDisabled = formToObject(form, {
      useIdIfEmptyName: true
    });

    expect(withoutDisabled).toEqual({
      person: {
        name: {
          first: "John"
        }
      }
    });

    const withDisabled = formToObject(form, {
      useIdIfEmptyName: true,
      getDisabled: true
    });

    expect(withDisabled).toEqual({
      person: {
        name: {
          first: "John",
          last: "Doe"
        }
      }
    });
  });

  it("respects disabled fieldset semantics", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <fieldset disabled>
          <legend><input name="insideLegend" value="legend-value" /></legend>
          <input name="outsideLegend" value="blocked-value" />
        </fieldset>
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;

    const withoutDisabled = formToObject(form);
    expect(withoutDisabled).toEqual({
      insideLegend: "legend-value"
    });

    const withDisabled = formToObject(form, { getDisabled: true });
    expect(withDisabled).toEqual({
      insideLegend: "legend-value",
      outsideLegend: "blocked-value"
    });
  });

  it("skips button-like input fields even when skipEmpty is false", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input type="submit" name="submitButton" value="Submit" />
        <input type="button" name="plainButton" value="Click" />
        <input type="text" name="person.name" value="Trinity" />
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;
    const result = formToObject(form, { skipEmpty: false });

    expect(result).toEqual({
      person: {
        name: "Trinity"
      }
    });
  });

  it("rejects unsafe path segments from field names", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input name="__proto__.polluted" value="yes" />
      </form>
    `;

    const form = document.getElementById("testForm") as HTMLFormElement;

    expect(() => formToObject(form)).toThrow(/Unsafe path segment/);
  });

  it("can combine NodeList roots", () => {
    document.body.innerHTML = `
      <form class="part"><input name="person.first" value="Neo" /></form>
      <form class="part"><input name="person.last" value="Anderson" /></form>
    `;

    const roots = document.querySelectorAll(".part");
    const result = formToObject(roots);

    expect(result).toEqual({
      person: {
        first: "Neo",
        last: "Anderson"
      }
    });
  });

  it("can combine HTMLCollection roots", () => {
    document.body.innerHTML = `
      <form class="part"><input name="person.first" value="Neo" /></form>
      <form class="part"><input name="person.last" value="Anderson" /></form>
    `;

    const roots = document.getElementsByClassName("part");
    const result = formToObject(roots);

    expect(result).toEqual({
      person: {
        first: "Neo",
        last: "Anderson"
      }
    });
  });

  it("resolves string roots against an explicit document", () => {
    const customDocument = document.implementation.createHTMLDocument("custom");
    customDocument.body.innerHTML = `
      <form id="testForm">
        <input name="person/name" value="Sam" />
      </form>
    `;

    const result = formToObject("testForm", {
      document: customDocument,
      delimiter: "/"
    });

    expect(result).toEqual({
      person: {
        name: "Sam"
      }
    });
  });

  it("keeps compatibility wrapper", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input name="person.name" value="Trinity" />
      </form>
    `;

    const result = form2js("testForm");

    expect(result).toEqual({
      person: {
        name: "Trinity"
      }
    });
  });

  it("returns an empty object when the root cannot be resolved", () => {
    expect(formToObject("missing-form")).toEqual({});
  });
});

describe("standalone entry", () => {
  it("attaches browser globals", async () => {
    const scope = globalThis as typeof globalThis & {
      formToObject?: unknown;
      form2js?: unknown;
      SKIP_NODE?: unknown;
    };

    Reflect.deleteProperty(scope, "formToObject");
    Reflect.deleteProperty(scope, "form2js");
    Reflect.deleteProperty(scope, "SKIP_NODE");

    await import("../src/standalone");

    expect(typeof scope.formToObject).toBe("function");
    expect(typeof scope.form2js).toBe("function");
    expect(typeof scope.SKIP_NODE).toBe("symbol");
  });
});
