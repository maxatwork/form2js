import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const turboConfig = JSON.parse(readFileSync(path.join(repoRoot, "turbo.json"), "utf8")) as {
  tasks?: Record<string, { dependsOn?: string[] }>;
};

describe("docs CI task graph", () => {
  it("builds workspace package dependencies before docs lint and typecheck", () => {
    expect(turboConfig.tasks?.lint?.dependsOn).toEqual(expect.arrayContaining(["^build"]));
    expect(turboConfig.tasks?.typecheck?.dependsOn).toEqual(expect.arrayContaining(["^build"]));
  });
});
