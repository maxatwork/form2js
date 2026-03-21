import React from "react";

import type { ApiPackageEntry } from "../../lib/api-packages";
import { apiPackageDocsPath } from "../../lib/site-routes";

type ApiPackageSummaryEntry = Pick<
  ApiPackageEntry,
  "slug" | "packageName" | "summary"
>;

interface ApiPackageSummaryListProps {
  basePath: string;
  packages: ApiPackageSummaryEntry[];
}

export function ApiPackageSummaryList({
  basePath,
  packages
}: ApiPackageSummaryListProps): React.JSX.Element {
  return (
    <section aria-labelledby="api-package-list" className="api-package-summary-list">
      <h2 id="api-package-list">Packages</h2>
      <div className="api-package-summary-list__items">
        {packages.map((entry) => (
          <article className="api-package-summary" key={entry.slug}>
            <h3>
              <a href={apiPackageDocsPath(basePath, entry.slug)}>{entry.packageName}</a>
            </h3>
            <p>{entry.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
