// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { entriesToObject, formDataToObject } from "../src/index";

describe("formDataToObject", () => {
  it("converts FormData entries into structured objects", () => {
    const formData = new FormData();
    formData.append("person.name.first", "John");
    formData.append("person.name.last", "Doe");
    formData.append("person.colors[]", "red");
    formData.append("person.colors[]", "blue");

    const result = formDataToObject(formData);

    expect(result).toEqual({
      person: {
        name: {
          first: "John",
          last: "Doe"
        },
        colors: ["red", "blue"]
      }
    });
  });

  it("supports generic iterable entries", () => {
    const result = formDataToObject([
      ["user.id", "1"],
      ["user.roles[]", "admin"],
      ["user.roles[]", "editor"]
    ]);

    expect(result).toEqual({
      user: {
        id: "1",
        roles: ["admin", "editor"]
      }
    });
  });
});

describe("entriesToObject adapter", () => {
  it("accepts key/value object entries", () => {
    const result = entriesToObject([
      { key: "profile.email", value: "neo@example.com" },
      { key: "profile.active", value: true }
    ]);

    expect(result).toEqual({
      profile: {
        email: "neo@example.com",
        active: true
      }
    });
  });
});
