import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type PackageManifest = {
  bugs?: { url?: string } | string;
  homepage?: string;
  keywords?: string[];
  license?: string;
  repository?: { url?: string } | string;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const packages = [
  "packages/core",
  "packages/dom",
  "packages/form-data",
  "packages/js2form",
  "packages/jquery",
  "packages/react",
] as const;

function readManifest(packageDir: string): PackageManifest {
  const manifestPath = path.join(repoRoot, packageDir, "package.json");
  return JSON.parse(readFileSync(manifestPath, "utf8")) as PackageManifest;
}

describe("published package metadata", () => {
  for (const packageDir of packages) {
    it(`${packageDir} includes npm-facing metadata and a package README`, () => {
      const manifest = readManifest(packageDir);
      const readmePath = path.join(repoRoot, packageDir, "README.md");

      expect(existsSync(readmePath), `${packageDir} is missing README.md`).toBe(true);
      expect(manifest.license, `${packageDir} is missing license`).toBeTruthy();
      expect(manifest.homepage, `${packageDir} is missing homepage`).toBeTruthy();
      expect(manifest.repository, `${packageDir} is missing repository`).toBeTruthy();
      expect(manifest.bugs, `${packageDir} is missing bugs`).toBeTruthy();
      expect(manifest.keywords, `${packageDir} is missing keywords`).toBeInstanceOf(Array);
      expect(manifest.keywords?.length ?? 0, `${packageDir} has no keywords`).toBeGreaterThan(0);
    });
  }
});
