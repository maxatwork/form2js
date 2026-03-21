import React from "react";

import type { ApiPackageEntry } from "../../lib/api-packages";
import { apiPackageDocsPath } from "../../lib/site-routes";

type ApiPackageNavEntry = Pick<ApiPackageEntry, "slug" | "packageName">;

interface ApiPackageNavProps {
  activeSlug?: ApiPackageNavEntry["slug"];
  basePath: string;
  packages: ApiPackageNavEntry[];
}

export function ApiPackageNav({
  activeSlug,
  basePath,
  packages
}: ApiPackageNavProps): React.JSX.Element {
  return (
    <nav aria-label="API packages" className="api-package-nav">
      <p className="api-package-nav__eyebrow">Packages</p>
      <ul className="api-package-nav__list">
        {packages.map((entry) => (
          <li key={entry.slug}>
            <a
              aria-current={entry.slug === activeSlug ? "page" : undefined}
              className="api-package-nav__link"
              href={apiPackageDocsPath(basePath, entry.slug)}
            >
              {entry.packageName}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
