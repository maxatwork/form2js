import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseApiDocsMarkdown } from "../src/lib/api-docs-source";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const apiIndexMarkdown = readFileSync(path.resolve(testDir, "../../../docs/api-index.md"), "utf8");
const apiCoreMarkdown = readFileSync(path.resolve(testDir, "../../../docs/api-core.md"), "utf8");
const apiDomMarkdown = readFileSync(path.resolve(testDir, "../../../docs/api-dom.md"), "utf8");
const apiFormDataMarkdown = readFileSync(path.resolve(testDir, "../../../docs/api-form-data.md"), "utf8");
const apiJqueryMarkdown = readFileSync(path.resolve(testDir, "../../../docs/api-jquery.md"), "utf8");
const apiJs2formMarkdown = readFileSync(path.resolve(testDir, "../../../docs/api-js2form.md"), "utf8");
const apiReactMarkdown = readFileSync(path.resolve(testDir, "../../../docs/api-react.md"), "utf8");
const migrationMarkdown = readFileSync(path.resolve(testDir, "../../../docs/migrate.md"), "utf8");
const readmeMarkdown = readFileSync(path.resolve(testDir, "../../../README.md"), "utf8");

describe("parseApiDocsMarkdown", () => {
  it("extracts the H1 title, intro copy, headings, and rewrites package markdown links", () => {
    const source = parseApiDocsMarkdown(
      `# React API

Intro with [index](api-index.md).

## Installation

Text with [core](api-core.md).

### npm

More text.
`,
      { basePath: "/form2js/" }
    );

    expect(source.title).toBe("React API");
    expect(source.introMarkdown).toContain("Intro with");
    expect(source.introHtml).toContain('href="/form2js/api/"');
    expect(source.bodyHtml).toContain('href="/form2js/api/core/"');
    expect(source.bodyHtml).toContain('id="installation"');
    expect(source.bodyHtml).toContain('id="npm"');
    expect(source.headings).toEqual([
      { depth: 2, slug: "installation", text: "Installation" },
      { depth: 3, slug: "npm", text: "npm" }
    ]);
  });

  it("returns an empty intro when the first section starts immediately after the title", () => {
    const source = parseApiDocsMarkdown(
      `# API Title

## Section

Text.
`,
      { basePath: "/" }
    );

    expect(source.introMarkdown).toBe("");
    expect(source.introHtml).toBe("");
  });

  it("deduplicates repeated heading slugs", () => {
    const source = parseApiDocsMarkdown(
      `# API Title

Intro

## Repeated Name

### Repeated Name

## Repeated Name
`,
      { basePath: "/" }
    );

    expect(source.headings).toEqual([
      { depth: 2, slug: "repeated-name", text: "Repeated Name" },
      { depth: 3, slug: "repeated-name-2", text: "Repeated Name" },
      { depth: 2, slug: "repeated-name-3", text: "Repeated Name" }
    ]);
  });

  it("throws when the markdown does not start with an H1", () => {
    expect(() =>
      parseApiDocsMarkdown(
        `## Missing title

Text.
`,
        { basePath: "/" }
      )
    ).toThrow("API docs markdown must start with an H1 heading.");
  });

  it("documents the split api markdown sources and updates the readme source link", () => {
    expect(apiIndexMarkdown).toContain("# form2js API Reference");
    expect(apiCoreMarkdown).toContain("## Installation");
    expect(apiCoreMarkdown).toContain("## General Example");
    expect(apiCoreMarkdown).toContain("## Types and Properties");
    expect(apiCoreMarkdown).toContain("npm install @form2js/core");
    expect(apiCoreMarkdown).toContain("### Schema validation");
    expect(apiCoreMarkdown).toContain("entriesToObject(rawEntries, { schema: PersonSchema })");
    expect(apiDomMarkdown).toContain("https://unpkg.com/@form2js/dom/dist/standalone.global.js");
    expect(apiDomMarkdown).toContain("### `useIdIfEmptyName`");
    expect(apiDomMarkdown).toContain("### `nodeCallback`");
    expect(apiFormDataMarkdown).toContain("### Schema validation");
    expect(apiFormDataMarkdown).toContain("formDataToObject(formData, { schema: PersonSchema })");
    expect(apiJqueryMarkdown).toContain("https://unpkg.com/@form2js/jquery/dist/standalone.global.js");
    expect(apiJqueryMarkdown).toContain("### `mode: \"all\"`");
    expect(apiJs2formMarkdown).toContain("### `shouldClean: false`");
    expect(apiJs2formMarkdown).toContain("### `useIdIfEmptyName`");
    expect(apiReactMarkdown).toContain("npm install @form2js/react react");
    expect(readmeMarkdown).toContain("[API Reference Source](docs/api-index.md)");
  });

  it("parses the migration guide markdown and rewrites package links", () => {
    const source = parseApiDocsMarkdown(migrationMarkdown, {
      basePath: "/form2js/"
    });

    expect(source.title).toBe("Migrate from Legacy form2js");
    expect(source.introMarkdown).toContain("single `form2js` script");
    expect(source.bodyHtml).toContain('href="/form2js/api/dom/"');
    expect(source.bodyHtml).toContain('href="/form2js/api/jquery/"');
    expect(source.bodyHtml).toContain('href="/form2js/api/form-data/"');
    expect(source.headings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: "quick-chooser", text: "Quick Chooser" }),
        expect.objectContaining({ slug: "legacy-api-mapping", text: "Legacy API Mapping" }),
        expect.objectContaining({ slug: "where-to-go-now", text: "Where To Go Now" })
      ])
    );
  });
});
