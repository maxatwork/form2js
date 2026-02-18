import { describe, expect, it } from "vitest";
import { entriesToObject, objectToEntries, processNameValues, setPathValue } from "../src/index";

describe("entriesToObject", () => {
  it("builds nested objects with dot notation", () => {
    const result = entriesToObject([
      { key: "person.name.first", value: "John" },
      { key: "person.name.last", value: "Doe" }
    ]);

    expect(result).toEqual({
      person: {
        name: {
          first: "John",
          last: "Doe"
        }
      }
    });
  });

  it("builds array values with [] syntax", () => {
    const result = entriesToObject([
      { key: "person.favFood[]", value: "steak" },
      { key: "person.favFood[]", value: "chicken" }
    ]);

    expect(result).toEqual({
      person: {
        favFood: ["steak", "chicken"]
      }
    });
  });

  it("keeps indexed arrays in first-seen order", () => {
    const result = entriesToObject([
      { key: "person.friends[5].name", value: "Neo" },
      { key: "person.friends[3].name", value: "Smith" }
    ]);

    expect(result).toEqual({
      person: {
        friends: [{ name: "Neo" }, { name: "Smith" }]
      }
    });
  });

  it("supports rails style object paths", () => {
    const result = entriesToObject([
      { key: "rails[field1][foo]", value: "baz" },
      { key: "rails[field1][bar]", value: "qux" }
    ]);

    expect(result).toEqual({
      rails: {
        field1: {
          foo: "baz",
          bar: "qux"
        }
      }
    });
  });

  it("skips empty and null values by default", () => {
    const result = entriesToObject([
      { key: "a", value: "" },
      { key: "b", value: null },
      { key: "c", value: "ok" }
    ]);

    expect(result).toEqual({ c: "ok" });
  });

  it("can keep empty values", () => {
    const result = entriesToObject(
      [
        { key: "a", value: "" },
        { key: "b", value: null },
        { key: "c", value: "ok" }
      ],
      { skipEmpty: false }
    );

    expect(result).toEqual({
      a: "",
      b: null,
      c: "ok"
    });
  });

  it("rejects unsafe path segments by default", () => {
    expect(() =>
      entriesToObject([{ key: "__proto__.polluted", value: "yes" }], {
        skipEmpty: false
      })
    ).toThrow(/Unsafe path segment/);
  });

  it("can opt into unsafe path segments for trusted inputs", () => {
    const target = Object.create(null) as Record<string, unknown>;

    setPathValue(target, "__proto__.polluted", "yes", {
      allowUnsafePathSegments: true
    });

    expect(target.__proto__).toEqual({ polluted: "yes" });
  });
});

describe("processNameValues", () => {
  it("keeps compatibility name field", () => {
    const result = processNameValues([
      { name: "person.name.first", value: "John" },
      { name: "person.name.last", value: "Doe" }
    ]);

    expect(result).toEqual({
      person: {
        name: {
          first: "John",
          last: "Doe"
        }
      }
    });
  });
});

describe("objectToEntries", () => {
  it("flattens nested objects and arrays", () => {
    const result = objectToEntries({
      person: {
        name: {
          first: "John"
        },
        emails: ["a@example.com", "b@example.com"]
      }
    });

    expect(result).toContainEqual({ key: "person.name.first", value: "John" });
    expect(result).toContainEqual({ key: "person.emails[0]", value: "a@example.com" });
    expect(result).toContainEqual({ key: "person.emails[1]", value: "b@example.com" });
  });

  it("only serializes own enumerable properties", () => {
    const value = Object.create({ leaked: "secret" }) as Record<string, unknown>;
    value.safe = "ok";

    const result = objectToEntries(value);

    expect(result).toEqual([{ key: "safe", value: "ok" }]);
  });
});
