import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type Lockfile = {
  packages?: Record<string, { version?: string }>;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const lockfilePath = path.join(repoRoot, "package-lock.json");

function readLockfile(): Lockfile {
  return JSON.parse(readFileSync(lockfilePath, "utf8")) as Lockfile;
}

function compareSemver(left: string, right: string): number {
  const leftParts = left.split("-", 1)[0].split(".").map(Number);
  const rightParts = right.split("-", 1)[0].split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

function isVulnerableVersion(name: string, version: string): boolean {
  const [major = 0] = version.split(".", 1).map(Number);

  if (name === "brace-expansion") {
    if (major === 1) {
      return compareSemver(version, "1.1.13") < 0;
    }

    if (major === 2) {
      return compareSemver(version, "2.0.3") < 0;
    }

    if (major === 4) {
      return true;
    }

    if (major === 5) {
      return compareSemver(version, "5.0.5") < 0;
    }

    return false;
  }

  if (name === "picomatch") {
    if (major === 2) {
      return compareSemver(version, "2.3.2") < 0;
    }

    if (major === 4) {
      return compareSemver(version, "4.0.4") < 0;
    }

    return false;
  }

  if (name === "smol-toml") {
    return compareSemver(version, "1.6.1") < 0;
  }

  if (name === "vite") {
    if (major === 6) {
      return compareSemver(version, "6.4.2") < 0;
    }

    if (major === 7) {
      return compareSemver(version, "7.3.2") < 0;
    }

    if (major === 8) {
      return compareSemver(version, "8.0.5") < 0;
    }

    return false;
  }

  if (name === "defu") {
    if (major === 6) {
      return compareSemver(version, "6.1.5") < 0;
    }

    return false;
  }

  if (name === "yaml" && major === 2) {
    return compareSemver(version, "2.8.3") < 0;
  }

  return false;
}

describe("dependency security", () => {
  it("does not leave known vulnerable dependency versions in the lockfile", () => {
    const lockfile = readLockfile();
    const packages = lockfile.packages ?? {};
    const vulnerablePackages = ["brace-expansion", "defu", "picomatch", "smol-toml", "vite", "yaml"];

    for (const [packagePath, packageInfo] of Object.entries(packages)) {
      const packageName = packagePath.split("/").at(-1);
      const version = packageInfo.version;

      if (!packageName || !version || !vulnerablePackages.includes(packageName)) {
        continue;
      }

      expect(
        isVulnerableVersion(packageName, version),
        `${packagePath} resolves to vulnerable ${packageName}@${version}`
      ).toBe(false);
    }
  });
});
