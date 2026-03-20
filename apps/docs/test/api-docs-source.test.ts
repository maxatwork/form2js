import { describe, expect, it } from "vitest";

import { parseApiDocsMarkdown } from "../src/lib/api-docs-source";

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
});
