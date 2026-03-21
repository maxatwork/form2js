import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const rootPackageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("root docs scripts", () => {
  it("builds workspace packages before local docs commands that depend on package dist output", () => {
    expect(rootPackageJson.scripts?.docs).toContain("npm run build:packages");
    expect(rootPackageJson.scripts?.["docs:build"]).toContain("npm run build:packages");
    expect(rootPackageJson.scripts?.["test:docs"]).toContain("npm run build:packages");
  });
});
