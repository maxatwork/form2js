# form2js

🚀 **form2js is back — modernized and actively maintained.**

Originally created in 2010, now rewritten for modern JavaScript, TypeScript, ESM, and modular usage.

Legacy version is available in the [`legacy` branch](https://github.com/maxatwork/form2js/tree/legacy).

## Description

A small family of packages for turning form-shaped data into objects, and objects back into forms.

It is not a serializer, not an ORM, and not a new religion. It just does this one job and does it reliably.

## Documentation

- [API Reference](docs/api.md) - full package-by-package API docs with defaults, signatures, and compatibility notes.

## Packages

| Package              | Purpose                                                     | Module | Standalone | Node.js                 |
| -------------------- | ----------------------------------------------------------- | ------ | ---------- | ----------------------- |
| `@form2js/core`      | Path parsing and object transformation engine               | Yes    | No         | Yes                     |
| `@form2js/dom`       | Extract DOM fields to object (`formToObject`, `form2js`)    | Yes    | Yes        | With DOM shim (`jsdom`) |
| `@form2js/form-data` | Convert `FormData`/entries to object                        | Yes    | No         | Yes                     |
| `@form2js/js2form`   | Populate DOM fields from object (`objectToForm`, `js2form`) | Yes    | No         | With DOM shim (`jsdom`) |
| `@form2js/jquery`    | jQuery plugin adapter (`$.fn.toObject`)                     | Yes    | Yes        | Browser-focused         |

## Installation

Install only what you need:

```bash
npm install @form2js/dom
npm install @form2js/form-data
npm install @form2js/js2form
npm install @form2js/core
npm install @form2js/jquery jquery
```

For browser standalone usage, use script builds where available:

- `@form2js/dom`: `dist/standalone.global.js`
- `@form2js/jquery`: `dist/standalone.global.js`

## Usage

### `@form2js/dom`

HTML used in examples:

```html
<form id="profileForm">
  <input name="person.name.first" value="Esme" />
  <input name="person.name.last" value="Weatherwax" />
  <label
    ><input type="checkbox" name="person.tags[]" value="witch" checked />
    witch</label
  >
</form>
```

Module:

```ts
import { formToObject } from "@form2js/dom";

const result = formToObject(document.getElementById("profileForm"));
// => { person: { name: { first: "Esme", last: "Weatherwax" }, tags: ["witch"] } }
```

Standalone:

```html
<script src="https://unpkg.com/@form2js/dom/dist/standalone.global.js"></script>
<script>
  const result = formToObject(document.getElementById("profileForm"));
  // or form2js(...)
</script>
```

### `@form2js/form-data`

Module (browser or Node 18+):

```ts
import { formDataToObject } from "@form2js/form-data";

const fd = new FormData(formElement);
const result = formDataToObject(fd);
```

Node.js note:

- Node 18+ has global `FormData`.
- You can also pass iterable entries directly, which is handy in server pipelines:

```ts
import { entriesToObject } from "@form2js/form-data";

const result = entriesToObject([
  ["person.name.first", "Sam"],
  ["person.roles[]", "captain"],
]);
// => { person: { name: { first: "Sam" }, roles: ["captain"] } }
```

Standalone:

- Not shipped for this package. Use module imports.

### `@form2js/jquery`

HTML used in examples:

```html
<form id="profileForm">
  <input name="person.name.first" value="Sam" />
  <input name="person.name.last" value="Vimes" />
</form>
```

Module:

```ts
import $ from "jquery";
import { installToObjectPlugin } from "@form2js/jquery";

installToObjectPlugin($);
const data = $("#profileForm").toObject({ mode: "first" });
// => { person: { name: { first: "Sam", last: "Vimes" } } }
```

Standalone:

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://unpkg.com/@form2js/jquery/dist/standalone.global.js"></script>
<script>
  const data = $("#profileForm").toObject({ mode: "combine" });
</script>
```

### `@form2js/js2form`

HTML used in examples (before calling `objectToForm`):

```html
<form id="profileForm">
  <input name="person.name.first" />
  <input name="person.name.last" />
</form>
```

Module:

```ts
import { objectToForm } from "@form2js/js2form";

objectToForm(document.getElementById("profileForm"), {
  person: { name: { first: "Tiffany", last: "Aching" } },
});
// fields are now populated in the form
```

Standalone:

- Not shipped as a dedicated global bundle. Use module imports.

### `@form2js/core`

Module:

```ts
import { entriesToObject, objectToEntries } from "@form2js/core";

const data = entriesToObject([
  { key: "person.name.first", value: "Vimes" },
  { key: "person.tags[]", value: "watch" },
]);

const pairs = objectToEntries(data);
```

Node.js:

- Fully supported (no DOM dependency).

Standalone:

- Not shipped for this package. Use module imports.

## Legacy behavior notes

Compatibility with the old project is intentional.

- Name paths define output shape (`person.name.first`).
- Array and indexed syntax is preserved (`items[]`, `items[5].name`).
- Rails-style names are supported (`rails[field][value]`).
- Checkbox/radio `"true"` and `"false"` quirks are preserved.
- This library does data shaping, not JSON/XML serialization.

## Design boundaries and non-goals

These boundaries are intentional and are used for issue triage.

- Sparse indexes are compacted in first-seen order (`items[5]`, `items[8]` -> `items[0]`, `items[1]`).
- Type inference is minimal by design; only legacy checkbox/radio `"true"` and `"false"` coercion is built in.
- `formToObject` reads form control values, not option labels. Use `nodeCallback` if you need custom shape/value extraction.
- `objectToForm` sets form control state and values; it does not dispatch synthetic `change` or `input` events.
- Empty collections are not synthesized when no matching fields are present (for example, unchecked checkbox groups).
- Dynamic key/value remapping (for example, converting `key`/`val` fields into arbitrary object keys) is application logic.
- For file payloads and richer multipart semantics, use `FormData` and `@form2js/form-data`.

## Contributing

### Setup

```bash
npm ci
```

### Local checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run pack:dry-run
```

### Examples

```bash
npm run playground
# or directly:
# npm -w @form2js/examples run dev
```

### GitHub Pages playground

The live playground is deployed by `.github/workflows/pages.yml`.

- Trigger: push to `master` (or manual `workflow_dispatch`).
- Output: `apps/examples/dist`.
- URL pattern: `https://<owner>.github.io/<repo>/` (for this repo, likely `.../form2js/`).

In repository settings, set Pages source to `GitHub Actions` once, and then the workflow handles updates.

### Before opening a PR

1. Keep changes focused to one problem area where possible.
2. Add or update tests for behavior changes.
3. Add a changeset (`npm run changeset`) for user-visible changes.
4. Include migration notes in README if behavior or API changes.

### Filing PRs and issues

Please include:

- Clear expected vs actual behavior.
- Minimal reproduction (HTML snippet or input entries).
- Package name and version.
- Environment (`node -v`, browser/version if relevant).

## Release workflow

- CI runs lint, typecheck, test, build, and package dry-run.
- Releases are managed with Changesets and independent package versions.

## Scope rewrite helper

Default scope is `@form2js/*`.

If you need to publish under another scope:

```bash
npm run scope:rewrite -- --scope @your-scope --dry-run
npm run scope:rewrite -- --scope @your-scope
```

This rewrites package names, internal dependencies, and import references.

## License

MIT, see `LICENSE`.
