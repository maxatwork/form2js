import { describe, expect, it } from "vitest";

import { VARIANT_IDS, variantsById } from "../src/components/playground/variant-registry";

describe("variant registry", () => {
  it("registers all expected variants", () => {
    expect(VARIANT_IDS).toEqual([
      "react",
      "form",
      "jquery",
      "js2form",
      "core",
      "form-data"
    ]);
  });

  it("provides seeded idle output state for every variant", () => {
    for (const id of VARIANT_IDS) {
      const variant = variantsById[id];

      expect(variant.id).toBe(id);
      expect(variant.label.length).toBeGreaterThan(0);
      expect(variant.summary.length).toBeGreaterThan(0);
      expect(variant.packages.length).toBeGreaterThan(0);
      expect(variant.createInitialOutputState().status).toBe("idle");
      expect(variant.createInitialOutputState().kind).toBe(variant.kind);
    }
  });
});
