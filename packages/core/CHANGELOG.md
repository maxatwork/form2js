# @form2js/core

## 3.3.0

### Minor Changes

- Restore Rails-style bracket path compatibility across parsing and form population, align DOM checkbox and radio handling with native browser submission behavior, and add explicit `SKIP_NODE` callback support for DOM extraction.

## 3.2.2

### Patch Changes

- Republish the package metadata and package-level README improvements across all public packages after fixing publish configuration.

## 3.2.1

### Patch Changes

- Add npm package metadata (`license`, `bugs`, `keywords`) and publish package-level README files for all public packages.

## 3.2.0

### Minor Changes

- 4d2f923: Added optional schema validation support (structural `parse`) to parsing APIs in core and form-data, plus a new `@form2js/react` package with `useForm2js` for async submit state management in React forms.

## 3.1.1

### Patch Changes

- 77b8543: Hardened parser security by rejecting unsafe key path segments by default and aligned DOM extraction with HTML semantics (disabled fieldsets, no button-like inputs). Added a writer hook, improved multi-select mapping, tightened ESLint, added a version bump script, and aligned packages to 3.1.0 with updated docs, tests, and repo/website links.

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
