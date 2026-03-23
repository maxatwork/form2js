import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const homepageSource = readFileSync(path.resolve(testDir, "../src/pages/index.astro"), "utf8");
const installSectionSource = readFileSync(
  path.resolve(testDir, "../src/components/landing/InstallSection.astro"),
  "utf8"
);
const docsShellSource = readFileSync(path.resolve(testDir, "../src/layouts/DocsShell.astro"), "utf8");
const readmeSource = readFileSync(path.resolve(testDir, "../../../README.md"), "utf8");

describe("docs homepage shell", () => {
  it("wires the landing page sections together", () => {
    expect(homepageSource).toContain("<Hero />");
    expect(homepageSource).toContain('id="playground"');
    expect(homepageSource).toContain("<InstallSection />");
    expect(homepageSource).toContain("<ApiDocsCta />");
    expect(readFileSync(path.resolve(testDir, "../src/components/landing/Hero.astro"), "utf8")).toContain(
      "npm install @form2js/react react"
    );
  });

  it("includes npm and standalone install guidance for supported variants", () => {
    expect(installSectionSource).toContain("npm install @form2js/react react");
    expect(installSectionSource).toContain("https://unpkg.com/@form2js/dom/dist/standalone.global.js");
    expect(installSectionSource).toContain("https://unpkg.com/@form2js/jquery/dist/standalone.global.js");
  });

  it("surfaces the migration guide in the shared docs chrome and the README", () => {
    expect(docsShellSource).toContain("migrationGuidePath");
    expect(docsShellSource).toContain(">Migration<");
    expect(readmeSource).toContain("Migrating from legacy form2js?");
    expect(readmeSource).toContain("https://maxatwork.github.io/form2js/migrate/");
    expect(readmeSource).toContain("## Migration from Legacy");
  });
});
