// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ApiToc } from "../src/components/api/ApiToc";

describe("ApiToc", () => {
  it("renders nested section links and marks the active section", () => {
    const markup = renderToStaticMarkup(
      <ApiToc
        headings={[
          { depth: 2, slug: "package-index", text: "Package Index" },
          { depth: 3, slug: "common-tasks", text: "Common tasks" },
          { depth: 2, slug: "api", text: "API" }
        ]}
        initialActiveSlug="common-tasks"
      />
    );

    expect(markup).toContain("On this page");
    expect(markup).toContain('href="#package-index"');
    expect(markup).toContain('href="#common-tasks"');
    expect(markup).toContain('aria-current="true"');
  });
});
