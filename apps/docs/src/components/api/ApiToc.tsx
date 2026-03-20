import React, { useEffect, useMemo, useState } from "react";

import type { ApiHeading } from "../../lib/api-docs-source";

interface ApiTocProps {
  headings: ApiHeading[];
  initialActiveSlug?: string;
}

interface TocGroup {
  heading: ApiHeading;
  children: ApiHeading[];
}

function groupHeadings(headings: ApiHeading[]): TocGroup[] {
  const groups: TocGroup[] = [];

  for (const heading of headings) {
    if (heading.depth === 2 || groups.length === 0) {
      groups.push({
        heading,
        children: []
      });
      continue;
    }

    groups[groups.length - 1]?.children.push(heading);
  }

  return groups;
}

export function ApiToc({ headings, initialActiveSlug }: ApiTocProps): React.JSX.Element {
  const groups = useMemo(() => groupHeadings(headings), [headings]);
  const [activeSlug, setActiveSlug] = useState(initialActiveSlug ?? headings[0]?.slug ?? "");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hashSlug = window.location.hash.replace(/^#/, "");
    if (hashSlug) {
      setActiveSlug(hashSlug);
    }

    const observedHeadings = headings
      .map((heading) => document.getElementById(heading.slug))
      .filter((heading): heading is HTMLElement => Boolean(heading));

    if (observedHeadings.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSlug(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.2, 0.6, 1]
      }
    );

    for (const heading of observedHeadings) {
      observer.observe(heading);
    }

    const handleHashChange = (): void => {
      const nextHashSlug = window.location.hash.replace(/^#/, "");
      if (nextHashSlug) {
        setActiveSlug(nextHashSlug);
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [headings]);

  return (
    <nav aria-label="On this page" className="api-toc">
      <p className="api-toc__eyebrow">On this page</p>
      <ul className="api-toc__list">
        {groups.map((group) => (
          <li key={group.heading.slug}>
            <a
              aria-current={activeSlug === group.heading.slug ? "true" : undefined}
              className="api-toc__link"
              href={`#${group.heading.slug}`}
              onClick={() => {
                setActiveSlug(group.heading.slug);
              }}
            >
              {group.heading.text}
            </a>
            {group.children.length > 0 ? (
              <ul className="api-toc__sublist">
                {group.children.map((child) => (
                  <li key={child.slug}>
                    <a
                      aria-current={activeSlug === child.slug ? "true" : undefined}
                      className="api-toc__sublink"
                      href={`#${child.slug}`}
                      onClick={() => {
                        setActiveSlug(child.slug);
                      }}
                    >
                      {child.text}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
