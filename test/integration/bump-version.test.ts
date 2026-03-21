import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const scriptPath = path.join(repoRoot, "scripts", "bump-version.mjs");

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

describe("bump-version script", () => {
  it("skips workspace directories that do not contain a package manifest", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "form2js-bump-version-"));

    mkdirSync(path.join(tempDir, "packages", "core"), { recursive: true });
    mkdirSync(path.join(tempDir, "apps", "docs"), { recursive: true });
    mkdirSync(path.join(tempDir, "apps", "examples"), { recursive: true });

    writeJson(path.join(tempDir, "package.json"), {
      name: "fixture-monorepo",
      private: true,
      workspaces: ["packages/*", "apps/*"],
    });

    writeJson(path.join(tempDir, "packages", "core", "package.json"), {
      name: "@form2js/core",
      version: "1.0.0",
    });

    writeJson(path.join(tempDir, "apps", "docs", "package.json"), {
      name: "@form2js/docs",
      dependencies: {
        "@form2js/core": "1.0.0",
      },
    });

    const result = spawnSync(process.execPath, [scriptPath, "1.2.3"], {
      cwd: tempDir,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);

    const bumpedCore = JSON.parse(
      readFileSync(path.join(tempDir, "packages", "core", "package.json"), "utf8")
    ) as { version: string };
    const docsManifest = JSON.parse(
      readFileSync(path.join(tempDir, "apps", "docs", "package.json"), "utf8")
    ) as { dependencies: { "@form2js/core": string } };

    expect(bumpedCore.version).toBe("1.2.3");
    expect(docsManifest.dependencies["@form2js/core"]).toBe("1.2.3");
  });
});
