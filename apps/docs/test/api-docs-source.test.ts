import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseApiDocsMarkdown } from "../src/lib/api-docs-source";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const apiDocsMarkdown = readFileSync(path.resolve(testDir, "../../../docs/api.md"), "utf8");

describe("parseApiDocsMarkdown", () => {
  it("extracts the H1 title, intro copy, headings, and rewrites markdown links", () => {
    const source = parseApiDocsMarkdown(
      `# API Title

Intro line with [README.md](README.md).

## First Section

Paragraph

### Nested Topic

More text.

## Second Section

Tail text.
`,
      { basePath: "/form2js/" }
    );

    expect(source.title).toBe("API Title");
    expect(source.introMarkdown).toContain("Intro line");
    expect(source.introHtml).toContain('href="/form2js/"');
    expect(source.bodyHtml).toContain('id="first-section"');
    expect(source.bodyHtml).toContain('id="nested-topic"');
    expect(source.headings).toEqual([
      { depth: 2, slug: "first-section", text: "First Section" },
      { depth: 3, slug: "nested-topic", text: "Nested Topic" },
      { depth: 2, slug: "second-section", text: "Second Section" }
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
    ).toThrow("docs/api.md must start with an H1 heading.");
  });

  it("documents installation for every package, including standalone globals where supported", () => {
    expect(apiDocsMarkdown).toContain("npm install @form2js/core");
    expect(apiDocsMarkdown).toContain("npm install @form2js/dom");
    expect(apiDocsMarkdown).toContain("npm install @form2js/form-data");
    expect(apiDocsMarkdown).toContain("npm install @form2js/react react");
    expect(apiDocsMarkdown).toContain("npm install @form2js/js2form");
    expect(apiDocsMarkdown).toContain("npm install @form2js/jquery jquery");
    expect(apiDocsMarkdown).toContain("https://unpkg.com/@form2js/dom/dist/standalone.global.js");
    expect(apiDocsMarkdown).toContain("https://unpkg.com/@form2js/jquery/dist/standalone.global.js");
    expect(apiDocsMarkdown).toContain("Standalone/global build is not shipped for this package.");
  });
});
