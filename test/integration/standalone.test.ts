import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("published standalone entry points", () => {
  it("resolves and runs the DOM bundle as a browser script", () => {
    const dom = new JSDOM('<form id="profile"><input name="person.name" value="Neo" /></form>', {
      runScripts: "outside-only"
    });

    try {
      dom.window.eval(readFileSync(require.resolve("@form2js/dom/standalone"), "utf8"));
      const parse = Reflect.get(dom.window, "formToObject") as (root: string) => unknown;
      expect(parse("profile")).toEqual({ person: { name: "Neo" } });
      expect(typeof Reflect.get(dom.window, "form2js")).toBe("function");
      expect(typeof Reflect.get(dom.window, "SKIP_NODE")).toBe("symbol");
    } finally {
      dom.window.close();
    }
  });

  it("resolves the jQuery bundle and installs a working plugin on real jQuery", () => {
    const dom = new JSDOM('<form id="profile"><input name="person/name" value="Neo" /></form>', {
      runScripts: "outside-only"
    });

    try {
      dom.window.eval(readFileSync(require.resolve("jquery"), "utf8"));
      dom.window.eval(readFileSync(require.resolve("@form2js/jquery/standalone"), "utf8"));
      const jquery = Reflect.get(dom.window, "jQuery") as (selector: string) => {
        toObject(options: { delimiter: string }): unknown;
      };
      expect(jquery("#profile").toObject({ delimiter: "/" })).toEqual({ person: { name: "Neo" } });
    } finally {
      dom.window.close();
    }
  });
});
