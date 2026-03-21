import { describe, expect, it } from "vitest";

import {
  apiDocsPath,
  apiPackageDocsPath,
  homepagePath,
  homepageVariantPath
} from "../src/lib/site-routes";

describe("site routes", () => {
  it("builds homepage and api paths under a base path", () => {
    expect(homepagePath("/form2js/")).toBe("/form2js/");
    expect(apiDocsPath("/form2js/")).toBe("/form2js/api/");
    expect(apiPackageDocsPath("/form2js/", "react")).toBe("/form2js/api/react/");
    expect(apiPackageDocsPath("/", "form-data")).toBe("/api/form-data/");
  });

  it("adds variant query params to the homepage only", () => {
    expect(homepageVariantPath("/form2js/", "react")).toBe("/form2js/?variant=react");
    expect(homepageVariantPath("/", "form-data")).toBe("/?variant=form-data");
  });
});
