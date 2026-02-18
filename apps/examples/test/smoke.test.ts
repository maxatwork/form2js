// @vitest-environment jsdom

import $ from "jquery";
import { entriesToObject } from "@form2js/core";
import { formToObject } from "@form2js/dom";
import { formDataToObject } from "@form2js/form-data";
import { installToObjectPlugin } from "@form2js/jquery";
import { objectToForm } from "@form2js/js2form";
import { describe, expect, it } from "vitest";

type JQueryToObjectCollection = JQuery & {
  toObject?: (options?: { mode?: "first" | "all" | "combine" }) => unknown;
};

describe("examples smoke tests", () => {
  it("covers @form2js/core, @form2js/dom and @form2js/form-data", () => {
    document.body.innerHTML = `
      <form id="profile">
        <input name="person.name.first" value="Esme" />
        <input type="checkbox" name="person.tags[]" value="witch" checked />
      </form>
    `;

    const form = document.getElementById("profile") as HTMLFormElement;
    const domResult = formToObject(form);
    const formDataResult = formDataToObject(new FormData(form));
    const coreResult = entriesToObject([...new FormData(form).entries()]);

    expect(domResult).toEqual({
      person: {
        name: { first: "Esme" },
        tags: ["witch"]
      }
    });
    expect(formDataResult).toEqual(domResult);
    expect(coreResult).toEqual(domResult);
  });

  it("covers @form2js/jquery plugin flow", () => {
    installToObjectPlugin($);

    document.body.innerHTML = `
      <form class="jq-slice"><input name="person.first" value="Sam" /></form>
      <form class="jq-slice"><input name="person.last" value="Vimes" /></form>
    `;

    const result = ($(".jq-slice") as JQueryToObjectCollection).toObject?.({
      mode: "combine"
    });

    expect(result).toEqual({
      person: {
        first: "Sam",
        last: "Vimes"
      }
    });
  });

  it("covers @form2js/js2form write flow", () => {
    document.body.innerHTML = `
      <form id="target">
        <input name="person.name.first" />
        <input name="person.name.last" />
      </form>
    `;

    const target = document.getElementById("target");
    objectToForm(target, {
      person: {
        name: {
          first: "Tiffany",
          last: "Aching"
        }
      }
    });

    const roundTrip = formToObject(target);
    expect(roundTrip).toEqual({
      person: {
        name: {
          first: "Tiffany",
          last: "Aching"
        }
      }
    });
  });
});
