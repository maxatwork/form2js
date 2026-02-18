// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  flattenDataForForm,
  js2form,
  mapFieldsByName,
  objectToForm,
} from "../src/index";

describe("objectToForm", () => {
  it("populates text, checkbox, radio and select fields", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input name="person.name.first" />
        <input type="checkbox" name="person.favFood[]" value="steak" />
        <input type="checkbox" name="person.favFood[]" value="pizza" />
        <input type="radio" name="person.gender" value="male" />
        <input type="radio" name="person.gender" value="female" />
        <select name="person.city">
          <option value="msk">Moscow</option>
          <option value="paris">Paris</option>
        </select>
      </form>
    `;

    objectToForm("testForm", {
      person: {
        name: { first: "Jane" },
        favFood: ["steak"],
        gender: "female",
        city: "paris",
      },
    });

    const firstName = document.querySelector(
      "input[name='person.name.first']"
    ) as HTMLInputElement;
    const steak = document.querySelector(
      "input[name='person.favFood[]'][value='steak']"
    ) as HTMLInputElement;
    const pizza = document.querySelector(
      "input[name='person.favFood[]'][value='pizza']"
    ) as HTMLInputElement;
    const female = document.querySelector(
      "input[name='person.gender'][value='female']"
    ) as HTMLInputElement;
    const city = document.querySelector(
      "select[name='person.city']"
    ) as HTMLSelectElement;

    expect(firstName.value).toBe("Jane");
    expect(steak.checked).toBe(true);
    expect(pizza.checked).toBe(false);
    expect(female.checked).toBe(true);
    expect(city.value).toBe("paris");
  });

  it("keeps compatibility wrapper", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input name="foo.name.first" />
      </form>
    `;

    js2form("testForm", { foo: { name: { first: "Neo" } } });

    const input = document.querySelector(
      "input[name='foo.name.first']"
    ) as HTMLInputElement;
    expect(input.value).toBe("Neo");
  });

  it("supports nodeCallback by skipping default assignment when callback returns false", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input name="person.name.first" />
      </form>
    `;

    objectToForm(
      "testForm",
      { person: { name: { first: "Jane" } } },
      {
        nodeCallback(node) {
          if (node instanceof HTMLInputElement && node.name === "person.name.first") {
            node.value = "from-callback";
            return false;
          }

          return null;
        }
      }
    );

    const input = document.querySelector(
      "input[name='person.name.first']"
    ) as HTMLInputElement;
    expect(input.value).toBe("from-callback");
  });

  it("populates multi-select values from arrays", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <select name="person.colors[]" multiple>
          <option value="red">red</option>
          <option value="blue">blue</option>
          <option value="green">green</option>
        </select>
      </form>
    `;

    objectToForm("testForm", {
      person: {
        colors: ["red", "blue"]
      }
    });

    const red = document.querySelector("option[value='red']") as HTMLOptionElement;
    const blue = document.querySelector("option[value='blue']") as HTMLOptionElement;
    const green = document.querySelector("option[value='green']") as HTMLOptionElement;

    expect(red.selected).toBe(true);
    expect(blue.selected).toBe(true);
    expect(green.selected).toBe(false);
  });
});

describe("low-level helpers", () => {
  it("maps fields by normalized names", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input type="checkbox" name="items[5].name" value="a" />
        <input type="checkbox" name="items[1].name" value="b" />
      </form>
    `;

    const fields = mapFieldsByName("testForm", { shouldClean: false });
    expect(Object.keys(fields)).toContain("items[0].name");
    expect(Object.keys(fields)).toContain("items[1].name");
  });

  it("flattens object data to path entries", () => {
    const entries = flattenDataForForm({ foo: { bar: ["a", "b"] } });

    expect(entries).toContainEqual({ key: "foo.bar[0]", value: "a" });
    expect(entries).toContainEqual({ key: "foo.bar[1]", value: "b" });
  });

  it("maps multi-select names without creating one key per option", () => {
    document.body.innerHTML = `
      <form id="testForm">
        <select name="person.colors[]" multiple>
          <option value="red">red</option>
          <option value="blue">blue</option>
          <option value="green">green</option>
        </select>
      </form>
    `;

    const fields = mapFieldsByName("testForm", { shouldClean: false });
    expect(Object.keys(fields)).toContain("person.colors[]");
    expect(Object.keys(fields)).not.toContain("person.colors[1]");
    expect(Object.keys(fields)).not.toContain("person.colors[2]");
  });
});
