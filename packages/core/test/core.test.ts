import { describe, expect, it } from "vitest";
import { entriesToObject, objectToEntries, processNameValues, setPathValue } from "../src/index";

describe("entriesToObject", () => {
  it("handles a long unmatched bracket suffix without repeated scanning", () => {
    const name = `data${"[".repeat(100_000)}`;
    const start = Date.now();
    const result = entriesToObject([[name, "value"]]);
    const elapsed = Date.now() - start;

    expect(result).toEqual({ data: ["value"] });
    expect(elapsed).toBeLessThan(1000);
  });

  it("handles deeply nested matched indexes without quadratic array bookkeeping", () => {
    const depth = 20_000;
    const start = Date.now();
    const result = entriesToObject([[`data${"[0]".repeat(depth)}`, "value"]]);
    const elapsed = Date.now() - start;

    let node: unknown = result.data;
    for (let level = 1; level < depth; level += 1) {
      node = (node as unknown[])[0];
    }

    expect(node).toEqual(["value"]);
    expect(elapsed).toBeLessThan(1000);
  });

  it("accepts tuple entries directly", () => {
    const result = entriesToObject([
      ["person.name.first", "John"],
      ["person.name.last", "Doe"]
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

  it("accepts name/value object entries directly", () => {
    const result = entriesToObject([
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

  it.each([false, true])("keeps distinct nested array paths isolated (reverse: %s)", (reverse) => {
    const entries: [string, string][] = [
      ["a.b.c[0].x", "A"],
      ["ab.c[0].y", "B"]
    ];

    expect(entriesToObject(reverse ? entries.reverse() : entries)).toEqual({
      a: { b: { c: [{ x: "A" }] } },
      ab: { c: [{ y: "B" }] }
    });
  });

  it("does not confuse underscores in names with array path boundaries", () => {
    expect(entriesToObject([
      ["a_b.c[5].x", "A"],
      ["a.b_c[5].y", "B"],
      ["a_b[c][5][z]", "C"]
    ])).toEqual({
      a_b: { c: [{ x: "A", z: "C" }] },
      a: { b_c: [{ y: "B" }] }
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

  it("supports rails style keys with underscores and one-character names", () => {
    const result = entriesToObject(
      [
        { key: "data[Topic][topic_id]", value: "1" },
        { key: "person.ruby[field2][f]", value: "baz" }
      ],
      { skipEmpty: false }
    );

    expect(result).toEqual({
      data: {
        Topic: {
          topic_id: "1"
        }
      },
      person: {
        ruby: {
          field2: {
            f: "baz"
          }
        }
      }
    });
  });

  it("supports single-bracket rails object segments at the root", () => {
    const result = entriesToObject([{ key: "testitem[test_property]", value: "ok" }], {
      skipEmpty: false
    });

    expect(result).toEqual({
      testitem: {
        test_property: "ok"
      }
    });
  });

  it("supports mixed indexed rails arrays and nested object traversal", () => {
    const result = entriesToObject(
      [
        { key: "tables[1][features][0][title]", value: "Feature A" },
        { key: "something[something][title]", value: "Nested" },
        { key: "something[description]", value: "Test" }
      ],
      { skipEmpty: false }
    );

    expect(result).toEqual({
      tables: [
        {
          features: [
            {
              title: "Feature A"
            }
          ]
        }
      ],
      something: {
        something: {
          title: "Nested"
        },
        description: "Test"
      }
    });
  });

  it("supports consecutive indexed segments for nested arrays", () => {
    const result = entriesToObject([{ key: "foo[0][1][bar]", value: "baz" }], {
      skipEmpty: false
    });

    expect(result).toEqual({
      foo: [
        [
          {
            bar: "baz"
          }
        ]
      ]
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

  it("stores trusted unsafe path segments as own properties on plain objects", () => {
    const target = {} as Record<string, unknown>;

    setPathValue(target, "__proto__.polluted", "yes", {
      allowUnsafePathSegments: true
    });

    expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(target, "__proto__")).toBe(true);
    expect(target.__proto__).toEqual({ polluted: "yes" });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("does not treat trusted array index markers as prototype access", () => {
    const target = {} as Record<string, unknown>;

    setPathValue(target, "items[__proto__].title", "safe", {
      allowUnsafePathSegments: true
    });

    expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).title).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(target.items as Record<string, unknown>, "__proto__")).toBe(true);
    expect((target.items as Record<string, unknown>).__proto__).toEqual({ title: "safe" });
  });

  it("validates and transforms using schema.parse when schema is provided", () => {
    const schema = {
      parse(value: unknown) {
        const record = value as { person?: { age?: string } };
        return {
          person: {
            age: Number(record.person?.age ?? "0")
          }
        };
      }
    };

    const result = entriesToObject([{ key: "person.age", value: "42" }], { schema });

    expect(result).toEqual({
      person: {
        age: 42
      }
    });
  });

  it("throws validation errors from schema.parse", () => {
    const schema = {
      parse() {
        throw new Error("Validation failed");
      }
    };

    expect(() =>
      entriesToObject([{ key: "person.name", value: "Neo" }], {
        schema
      })
    ).toThrow("Validation failed");
  });

  it("throws for invalid entry shapes", () => {
    expect(() =>
      entriesToObject([{ value: "missing-key" } as unknown as { key: string; value: unknown }])
    ).toThrow("Invalid entry");
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
  it("uses custom delimiters without rewriting literal dots in property names", () => {
    const data = { person: { "first.last": "Neo", roles: ["watch"] } };
    const options = { delimiter: "/" };
    const entries = objectToEntries(data, options);

    expect(entries).toEqual([
      { key: "person/first.last", value: "Neo" },
      { key: "person/roles[0]", value: "watch" }
    ]);
    expect(entriesToObject(entries, options)).toEqual(data);
  });

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
