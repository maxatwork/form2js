import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function readWorkflow(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("workflow node versions", () => {
  it("runs docs-related GitHub workflows on a supported Node.js version", () => {
    const ciWorkflow = readWorkflow(".github/workflows/ci.yml");
    const pagesWorkflow = readWorkflow(".github/workflows/pages.yml");

    expect(ciWorkflow).toContain("node-version: [22.22.0]");
    expect(ciWorkflow).toContain("name: docs-e2e (node 22.22.0)");
    expect(ciWorkflow).toContain("node-version: 22.22.0");
    expect(pagesWorkflow).toContain("node-version: 22.22.0");
  });

  it("uses action majors compatible with the current GitHub runner", () => {
    const ciWorkflow = readWorkflow(".github/workflows/ci.yml");
    const pagesWorkflow = readWorkflow(".github/workflows/pages.yml");
    const releaseWorkflow = readWorkflow(".github/workflows/release.yml");

    expect(ciWorkflow).toContain("uses: actions/checkout@v7");
    expect(ciWorkflow).toContain("uses: actions/setup-node@v7");
    expect(pagesWorkflow).toContain("uses: actions/configure-pages@v6");
    expect(pagesWorkflow).toContain("uses: actions/upload-pages-artifact@v5");
    expect(pagesWorkflow).toContain("uses: actions/deploy-pages@v5");
    expect(releaseWorkflow).toContain("uses: changesets/action@v2");
    expect(releaseWorkflow).toContain("version-script: npx changeset version");
    expect(releaseWorkflow).toContain("publish-script: npm run release");
    expect(ciWorkflow).toContain("runs-on: ubuntu-24.04");
    expect(pagesWorkflow).toContain("runs-on: ubuntu-24.04");
    expect(releaseWorkflow).toContain("runs-on: ubuntu-24.04");
  });
});
