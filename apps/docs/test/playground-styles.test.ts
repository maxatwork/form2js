import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const stylesheetPath = path.resolve(import.meta.dirname, "../src/styles/playground.css");
const stylesheet = readFileSync(stylesheetPath, "utf8");

describe("playground responsive styles", () => {
  it("drops the desktop form-column divider in the one-column mobile layout", () => {
    expect(stylesheet).toContain("@media (max-width: 760px)");
    expect(stylesheet).toContain(".pg-form-col { border-right: none; }");
  });
});
