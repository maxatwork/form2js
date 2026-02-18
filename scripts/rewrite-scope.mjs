#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_SCOPE = "@form2js";
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage", ".turbo"]);
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".mts",
  ".cts",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".html"
]);

function parseArgs(argv) {
  const args = { scope: "", dryRun: false };

  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];

    if (part === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (part === "--scope") {
      args.scope = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (part.startsWith("--scope=")) {
      args.scope = part.slice("--scope=".length);
      continue;
    }
  }

  return args;
}

function assertScope(scope) {
  if (!scope.startsWith("@") || scope.includes("/")) {
    throw new Error("Scope must look like @your-scope");
  }

  if (scope === SOURCE_SCOPE) {
    throw new Error("New scope is the same as current scope @form2js");
  }
}

async function walk(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }

      await walk(fullPath, files);
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function rewriteDependencyMap(map, targetScope) {
  if (!map) {
    return { changed: false, value: map };
  }

  let changed = false;
  const next = {};

  for (const [name, version] of Object.entries(map)) {
    if (name.startsWith(`${SOURCE_SCOPE}/`)) {
      const newName = name.replace(`${SOURCE_SCOPE}/`, `${targetScope}/`);
      next[newName] = version;
      changed = true;
    } else {
      next[name] = version;
    }
  }

  return { changed, value: next };
}

async function rewritePackageJson(filePath, targetScope, dryRun) {
  const source = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(source);
  let changed = false;

  if (typeof parsed.name === "string" && parsed.name.startsWith(`${SOURCE_SCOPE}/`)) {
    parsed.name = parsed.name.replace(`${SOURCE_SCOPE}/`, `${targetScope}/`);
    changed = true;
  }

  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const result = rewriteDependencyMap(parsed[field], targetScope);
    if (result.changed) {
      parsed[field] = result.value;
      changed = true;
    }
  }

  if (!changed) {
    return false;
  }

  if (!dryRun) {
    await fs.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  }

  return true;
}

async function rewriteTextFile(filePath, targetScope, dryRun) {
  const source = await fs.readFile(filePath, "utf8");
  const updated = source.replaceAll(`${SOURCE_SCOPE}/`, `${targetScope}/`);

  if (source === updated) {
    return false;
  }

  if (!dryRun) {
    await fs.writeFile(filePath, updated, "utf8");
  }

  return true;
}

async function main() {
  const { scope, dryRun } = parseArgs(process.argv.slice(2));

  if (!scope) {
    throw new Error("Usage: node scripts/rewrite-scope.mjs --scope @your-scope [--dry-run]");
  }

  assertScope(scope);

  const files = await walk(ROOT);
  const changedFiles = [];

  for (const filePath of files) {
    if (filePath.endsWith("package-lock.json")) {
      continue;
    }

    const relative = path.relative(ROOT, filePath);

    if (path.basename(filePath) === "package.json") {
      if (await rewritePackageJson(filePath, scope, dryRun)) {
        changedFiles.push(relative);
      }
      continue;
    }

    const extension = path.extname(filePath);
    if (!TEXT_EXTENSIONS.has(extension)) {
      continue;
    }

    if (await rewriteTextFile(filePath, scope, dryRun)) {
      changedFiles.push(relative);
    }
  }

  if (changedFiles.length === 0) {
    console.log("No files required changes.");
    return;
  }

  console.log(`${dryRun ? "[dry-run] " : ""}Updated ${changedFiles.length} file(s):`);
  for (const file of changedFiles) {
    console.log(`- ${file}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
