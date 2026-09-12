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

function packageNameFromPath(packagePath: string): string | undefined {
  const segments = packagePath.split("/");
  const lastSegment = segments.at(-1);

  if (segments.at(-2)?.startsWith("@") && lastSegment) {
    return `${segments.at(-2)}/${lastSegment}`;
  }

  return lastSegment;
}

function isVulnerableVersion(name: string, version: string): boolean {
  const [major = 0] = version.split(".", 1).map(Number);

  if (name === "@humanfs/node") {
    return compareSemver(version, "0.16.8") < 0;
  }

  if (name === "@vitest/mocker" || name === "vitest") {
    return compareSemver(version, "2.1.0") >= 0 && compareSemver(version, "4.1.11") < 0;
  }

  if (name === "baseline-browser-mapping") {
    return compareSemver(version, "2.0.0") >= 0 && compareSemver(version, "2.11.0") < 0;
  }

  if (name === "browserslist") {
    return compareSemver(version, "4.28.7") < 0;
  }

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
    return compareSemver(version, "1.7.1") < 0;
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

  if (name === "postcss") {
    return compareSemver(version, "8.5.23") < 0;
  }

  if (name === "esbuild") {
    return compareSemver(version, "0.28.1") < 0;
  }

  if (name === "js-yaml") {
    if (major === 3) {
      return compareSemver(version, "3.15.2") < 0;
    }

    if (major === 4) {
      return compareSemver(version, "4.3.2") < 0;
    }

    return false;
  }

  if (name === "nanoid") {
    return compareSemver(version, "3.3.18") < 0;
  }

  if (name === "sharp") {
    return compareSemver(version, "0.35.4") < 0;
  }

  if (name === "svgo") {
    return compareSemver(version, "4.1.0") < 0;
  }

  if (name === "@babel/core") {
    return compareSemver(version, "7.29.6") < 0;
  }

  if (name === "ws") {
    return compareSemver(version, "8.21.0") < 0;
  }

  if (name === "turbo") {
    return compareSemver(version, "2.9.14") < 0;
  }

  if (name === "astro") {
    return major < 7 || (major === 7 && compareSemver(version, "7.2.8") < 0);
  }

  return false;
}

describe("dependency security", () => {
  it("does not leave known vulnerable dependency versions in the lockfile", () => {
    const lockfile = readLockfile();
    const packages = lockfile.packages ?? {};
    const vulnerablePackages = [
      "@babel/core",
      "@humanfs/node",
      "@vitest/mocker",
      "astro",
      "baseline-browser-mapping",
      "browserslist",
      "brace-expansion",
      "defu",
      "esbuild",
      "js-yaml",
      "nanoid",
      "picomatch",
      "postcss",
      "sharp",
      "smol-toml",
      "svgo",
      "turbo",
      "vite",
      "vitest",
      "ws",
      "yaml"
    ];

    for (const [packagePath, packageInfo] of Object.entries(packages)) {
      const packageName = packageNameFromPath(packagePath);
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
