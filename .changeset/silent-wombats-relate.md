---
"@form2js/core": patch
"@form2js/dom": patch
"@form2js/form-data": patch
"@form2js/jquery": patch
"@form2js/js2form": patch
---

Hardened parser security by rejecting unsafe key path segments by default and aligned DOM extraction with HTML semantics (disabled fieldsets, no button-like inputs). Added a writer hook, improved multi-select mapping, tightened ESLint, added a version bump script, and aligned packages to 3.1.0 with updated docs, tests, and repo/website links.

    New Features
        Added allowUnsafePathSegments option across core, dom, form-data, and jQuery plugin to explicitly allow trusted unsafe segments.
        Added nodeCallback to objectToForm/js2form; returning false skips default assignment for that node.
        Improved multi-select handling: matches names with [] and bare-name fallbacks without per-option keys.
        Added bump-version script to sync workspace versions and ranges; bumped packages to 3.1.0.
        Enabled vitest for examples and added smoke tests; updated tsconfig and lint script.

    Bug Fixes
        Prevented prototype pollution by blocking "proto", "prototype", and "constructor" path tokens by default.
        objectToEntries now serializes only own enumerable properties.
        DOM extraction respects disabled fieldset rules (legend exception) and excludes button-like inputs even when skipEmpty is false.
        ESLint config now errors on unsafe TypeScript operations (no-unsafe-* rules).
