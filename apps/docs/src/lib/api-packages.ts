import path from "node:path";

export type ApiPackageSlug =
  | "core"
  | "dom"
  | "form-data"
  | "react"
  | "js2form"
  | "jquery";

export interface ApiPackageEntry {
  slug: ApiPackageSlug;
  packageName: string;
  summary: string;
  markdownPath: string;
}

function resolveDocsPath(filename: string): string {
  return path.resolve(process.cwd(), "..", "..", "docs", filename);
}

export const apiIndexMarkdownPath = resolveDocsPath("api-index.md");

export const apiPackages: ApiPackageEntry[] = [
  {
    slug: "core",
    packageName: "@form2js/core",
    summary: "Turn path-like key/value pairs into nested objects and flatten them back into entries.",
    markdownPath: resolveDocsPath("api-core.md")
  },
  {
    slug: "dom",
    packageName: "@form2js/dom",
    summary: "Parse browser form controls into an object while preserving native submission behavior.",
    markdownPath: resolveDocsPath("api-dom.md")
  },
  {
    slug: "form-data",
    packageName: "@form2js/form-data",
    summary: "Parse FormData and tuple entries with the same path rules used by the core parser.",
    markdownPath: resolveDocsPath("api-form-data.md")
  },
  {
    slug: "react",
    packageName: "@form2js/react",
    summary: "Handle React form submission with parsed payloads, optional schema validation, and submit state.",
    markdownPath: resolveDocsPath("api-react.md")
  },
  {
    slug: "js2form",
    packageName: "@form2js/js2form",
    summary: "Push nested object data back into matching DOM form controls.",
    markdownPath: resolveDocsPath("api-js2form.md")
  },
  {
    slug: "jquery",
    packageName: "@form2js/jquery",
    summary: "Install a jQuery plugin wrapper around the DOM parser for legacy form handling flows.",
    markdownPath: resolveDocsPath("api-jquery.md")
  }
];

export function getApiPackageBySlug(slug: string): ApiPackageEntry | undefined {
  return apiPackages.find((entry) => entry.slug === slug);
}

export function getApiPackageByMarkdownBasename(
  basename: string
): ApiPackageEntry | undefined {
  return apiPackages.find(
    (entry) => path.basename(entry.markdownPath) === basename
  );
}
