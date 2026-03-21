// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ApiPackageNav } from "../src/components/api/ApiPackageNav";
import { ApiPackageSummaryList } from "../src/components/api/ApiPackageSummaryList";
import { ApiToc } from "../src/components/api/ApiToc";

describe("ApiPackageNav", () => {
  it("renders package links and marks the active package", () => {
    const markup = renderToStaticMarkup(
      <ApiPackageNav
        activeSlug="react"
        basePath="/form2js/"
        packages={[
          {
            slug: "core",
            packageName: "@form2js/core"
          },
          {
            slug: "react",
            packageName: "@form2js/react"
          }
        ]}
      />
    );

    expect(markup).toContain("Packages");
    expect(markup).toContain('href="/form2js/api/react/"');
    expect(markup).toContain('aria-current="page"');
  });
});

describe("ApiPackageSummaryList", () => {
  it("renders package summaries with package routes", () => {
    const markup = renderToStaticMarkup(
      <ApiPackageSummaryList
        basePath="/form2js/"
        packages={[
          {
            slug: "dom",
            packageName: "@form2js/dom",
            summary: "DOM parsing"
          }
        ]}
      />
    );

    expect(markup).toContain("@form2js/dom");
    expect(markup).toContain("DOM parsing");
    expect(markup).toContain('href="/form2js/api/dom/"');
  });
});

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
