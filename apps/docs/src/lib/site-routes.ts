function normalizeBase(basePath: string): string {
  if (basePath === "/") {
    return "/";
  }

  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export function homepagePath(basePath: string): string {
  return normalizeBase(basePath);
}

export function apiDocsPath(basePath: string): string {
  return `${normalizeBase(basePath)}api/`;
}

export function apiPackageDocsPath(basePath: string, slug: string): string {
  return `${apiDocsPath(basePath)}${encodeURIComponent(slug)}/`;
}

export function homepageVariantPath(basePath: string, variant: string): string {
  return `${normalizeBase(basePath)}?variant=${encodeURIComponent(variant)}`;
}
