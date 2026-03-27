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

    expect(ciWorkflow).toContain("node-version: [22.14.0]");
    expect(ciWorkflow).toContain("name: docs-e2e (node 22.14.0)");
    expect(ciWorkflow).toContain("node-version: 22.14.0");
    expect(pagesWorkflow).toContain("node-version: 22.14.0");
  });
});
