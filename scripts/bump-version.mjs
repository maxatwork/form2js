#!/usr/bin/env node

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const VERSION_PARTS_RE = /^(\d+)\.(\d+)\.(\d+)$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const BUMP_TYPES = new Set(["patch", "minor", "major"]);
const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

function usage(exitCode = 1) {
  console.error(
    "Usage: npm run bump-version -- [patch|minor|major|<exact-semver>]"
  );
  process.exit(exitCode);
}

function nextVersion(currentVersion, bumpType) {
  const parts = VERSION_PARTS_RE.exec(currentVersion);
  if (!parts) {
    throw new Error(
      `Version ${JSON.stringify(
        currentVersion
      )} is not x.y.z; use an exact version instead.`
    );
  }

  let major = Number(parts[1]);
  let minor = Number(parts[2]);
  let patch = Number(parts[3]);

  if (bumpType === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bumpType === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

async function expandWorkspacePattern(pattern) {
  if (!pattern.endsWith("/*")) {
    throw new Error(
      `Unsupported workspace pattern ${JSON.stringify(
        pattern
      )}; only trailing /* patterns are supported.`
    );
  }

  const baseDir = pattern.slice(0, -2);
  const absoluteBaseDir = path.resolve(baseDir);
  const entries = await readdir(absoluteBaseDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(baseDir, entry.name));
}

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function rewriteDependencyRange(currentRange, targetVersion) {
  const clean = currentRange.trim();

  if (clean.startsWith("workspace:")) {
    const workspaceRange = clean.slice("workspace:".length);
    if (workspaceRange.startsWith("^")) return `workspace:^${targetVersion}`;
    if (workspaceRange.startsWith("~")) return `workspace:~${targetVersion}`;
    if (workspaceRange === "*" || workspaceRange === "^" || workspaceRange === "~") {
      return clean;
    }
    return `workspace:${targetVersion}`;
  }

  if (clean.startsWith("^")) return `^${targetVersion}`;
  if (clean.startsWith("~")) return `~${targetVersion}`;
  return targetVersion;
}

async function main() {
  const input = process.argv[2];
  if (!input || input === "--help" || input === "-h") {
    usage(input ? 0 : 1);
  }

  const rootManifest = await readJson(path.resolve("package.json"));
  const workspacePatterns = Array.isArray(rootManifest.workspaces)
    ? rootManifest.workspaces
    : rootManifest.workspaces?.packages;

  if (!Array.isArray(workspacePatterns) || workspacePatterns.length === 0) {
    throw new Error("No workspaces found in root package.json.");
  }

  const workspaceDirs = (
    await Promise.all(workspacePatterns.map((pattern) => expandWorkspacePattern(pattern)))
  ).flat();

  const packagePaths = workspaceDirs.map((dir) => path.resolve(dir, "package.json"));
  const manifests = await Promise.all(
    packagePaths.map(async (packagePath) => ({
      packagePath,
      data: await readJson(packagePath),
    }))
  );

  const workspacePackageNames = new Set(
    manifests.map((manifest) => manifest.data.name).filter(Boolean)
  );

  const versionedManifests = manifests.filter(
    (manifest) => typeof manifest.data.version === "string"
  );
  if (versionedManifests.length === 0) {
    throw new Error("No versioned workspace packages were found.");
  }

  const uniqueVersions = [...new Set(versionedManifests.map((m) => m.data.version))];
  const currentVersion = uniqueVersions[0];
  if (BUMP_TYPES.has(input) && uniqueVersions.length !== 1) {
    throw new Error(
      `Workspace versions are not aligned: ${uniqueVersions.join(
        ", "
      )}. Use an exact version to set all packages explicitly.`
    );
  }

  const targetVersion = BUMP_TYPES.has(input) ? nextVersion(currentVersion, input) : input;
  if (!SEMVER_RE.test(targetVersion)) {
    throw new Error(
      `Invalid version input ${JSON.stringify(
        input
      )}. Use patch/minor/major or an exact semver version.`
    );
  }

  for (const manifest of manifests) {
    if (typeof manifest.data.version === "string") {
      manifest.data.version = targetVersion;
    }

    for (const field of DEP_FIELDS) {
      const deps = manifest.data[field];
      if (!deps || typeof deps !== "object") continue;

      for (const [depName, depRange] of Object.entries(deps)) {
        if (
          workspacePackageNames.has(depName) &&
          typeof depRange === "string"
        ) {
          deps[depName] = rewriteDependencyRange(depRange, targetVersion);
        }
      }
    }
  }

  await Promise.all(
    manifests.map(({ packagePath, data }) =>
      writeFile(packagePath, `${JSON.stringify(data, null, 2)}\n`, "utf8")
    )
  );

  console.log(`Bumped workspace package versions to ${targetVersion}`);
}

main().catch((error) => {
  console.error(`bump-version failed: ${error.message}`);
  process.exit(1);
});
