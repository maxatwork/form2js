import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const homepageSource = readFileSync(path.resolve(import.meta.dirname, "../src/pages/index.astro"), "utf8");

describe("docs homepage shell", () => {
  it("wires the landing page sections together", () => {
    expect(homepageSource).toContain("<Hero />");
    expect(homepageSource).toContain('id="playground"');
    expect(homepageSource).toContain("<InstallSection />");
    expect(homepageSource).toContain("<ApiDocsCta />");
  });
});
