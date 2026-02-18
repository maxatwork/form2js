// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { formToObject } from "@form2js/dom";
import { formDataToObject } from "@form2js/form-data";
import { objectToForm } from "@form2js/js2form";

describe("integration: full data flow", () => {
  it("supports form -> object -> form roundtrip", () => {
    document.body.innerHTML = `
      <form id="source">
        <input name="person.name.first" value="Neo" />
        <input name="person.name.last" value="Anderson" />
        <input type="checkbox" name="person.roles[]" value="admin" checked />
        <input type="checkbox" name="person.roles[]" value="operator" checked />
      </form>
      <form id="target">
        <input name="person.name.first" />
        <input name="person.name.last" />
        <input type="checkbox" name="person.roles[]" value="admin" />
        <input type="checkbox" name="person.roles[]" value="operator" />
      </form>
    `;

    const source = document.getElementById("source");
    const target = document.getElementById("target");

    const sourceObject = formToObject(source);
    objectToForm(target, sourceObject);
    const roundTripped = formToObject(target);

    expect(roundTripped).toEqual(sourceObject);
  });

  it("accepts FormData with same path semantics", () => {
    const formData = new FormData();
    formData.append("items[8].name", "A");
    formData.append("items[5].name", "B");

    const result = formDataToObject(formData);

    expect(result).toEqual({
      items: [{ name: "A" }, { name: "B" }]
    });
  });
});
