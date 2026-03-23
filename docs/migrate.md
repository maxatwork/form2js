# Migrate from Legacy form2js

If you built around the old single `form2js` script or the archived jQuery plugin flow, the main change is that modern form2js is now a small package family. You install only the part you need instead of pulling one browser-era bundle into every environment.

The legacy code and historical examples still live in the [legacy branch](https://github.com/maxatwork/form2js/tree/legacy), but new work should move to the current packages and docs.

## Quick Chooser

| If your legacy code does this | Use now | Notes |
| --- | --- | --- |
| `form2js(form)` in the browser | [`@form2js/dom`](api-dom.md) | Closest direct replacement. Exports both `formToObject()` and a compatibility `form2js()` wrapper. |
| `$("#form").toObject()` in jQuery | [`@form2js/jquery`](api-jquery.md) | Keeps the plugin shape while using the modern DOM parser underneath. |
| Parse `FormData` on the server or in browser pipelines | [`@form2js/form-data`](api-form-data.md) | Best fit for fetch actions, loaders, workers, and Node. |
| Handle submit state in React | [`@form2js/react`](api-react.md) | Wraps form parsing in a hook with async submit state and optional schema validation. |
| Push object data back into a form | [`@form2js/js2form`](api-js2form.md) | Modern replacement for the old "object back into fields" helpers around the ecosystem. |
| Work directly with path/value entries | [`@form2js/core`](api-core.md) | Lowest-level parser and formatter. |

## What Changed

- The archived project exposed one browser-oriented `form2js(rootNode, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName)` entry point.
- The current project splits that behavior by environment and responsibility.
- Browser DOM extraction lives in `@form2js/dom`.
- jQuery compatibility lives in `@form2js/jquery`.
- `FormData`, React, object-to-form, and low-level entry parsing each have their own package.

That split is the point of the rewrite: smaller installs, clearer environment boundaries, and first-class TypeScript/ESM support without making every user drag along legacy browser assumptions.

## Legacy API Mapping

Legacy browser code usually looked like this:

```js
var data = form2js(rootNode, ".", true, nodeCallback, false);
```

Modern browser code should usually look like this:

```ts
import { formToObject } from "@form2js/dom";

const data = formToObject(rootNode, {
  delimiter: ".",
  skipEmpty: true,
  nodeCallback,
  useIdIfEmptyName: false
});
```

If you want the smallest possible migration diff, `@form2js/dom` also exports a compatibility wrapper:

```ts
import { form2js } from "@form2js/dom";

const data = form2js(rootNode, ".", true, nodeCallback, false);
```

Parameter mapping:

| Legacy parameter | Modern equivalent |
| --- | --- |
| `rootNode` | `rootNode` |
| `delimiter` | `options.delimiter` |
| `skipEmpty` | `options.skipEmpty` |
| `nodeCallback` | `options.nodeCallback` |
| `useIdIfEmptyName` | `options.useIdIfEmptyName` |

The main migration decision is not the parameter mapping. It is choosing the right package for the environment where parsing now happens.

## Browser Migration

For plain browser forms, install `@form2js/dom`:

```bash
npm install @form2js/dom
```

Module usage:

```ts
import { formToObject } from "@form2js/dom";

const data = formToObject(document.getElementById("profileForm"));
```

Standalone usage is still available for the DOM package:

```html
<script src="https://unpkg.com/@form2js/dom/dist/standalone.global.js"></script>
<script>
  const data = formToObject(document.getElementById("profileForm"));
  // or form2js(document.getElementById("profileForm"))
</script>
```

## jQuery Migration

If your codebase still expects `$.fn.toObject()`, move to `@form2js/jquery` instead of rebuilding that glue yourself.

```bash
npm install @form2js/jquery jquery
```

```ts
import $ from "jquery";
import { installToObjectPlugin } from "@form2js/jquery";

installToObjectPlugin($);

const data = $("#profileForm").toObject({ mode: "first" });
```

Standalone usage is also available:

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://unpkg.com/@form2js/jquery/dist/standalone.global.js"></script>
<script>
  const data = $("#profileForm").toObject({ mode: "combine" });
</script>
```

## Behavior Differences To Check

- `skipEmpty` still defaults to `true`, so empty strings and `null` values are skipped unless you opt out.
- Disabled controls are ignored by default. Set `getDisabled: true` only if you really want them parsed.
- Unsafe path segments such as `__proto__`, `prototype`, and `constructor` are rejected by default in the modern parser.
- Only `@form2js/dom` and `@form2js/jquery` ship standalone browser globals. The other packages are module-only.
- React and `FormData` use cases now have dedicated packages instead of being squeezed through the DOM entry point.

## Where To Go Now

If the legacy code used browser DOM access only because that was the only option at the time, this is the modern package map:

- Use [`@form2js/form-data`](api-form-data.md) when your app already has `FormData`, request entries, or server-side action handlers.
- Use [`@form2js/react`](api-react.md) when you want submit-state handling around parsing in React.
- Use [`@form2js/js2form`](api-js2form.md) when you need to populate forms from nested objects.
- Use [`@form2js/core`](api-core.md) when you already have raw key/value pairs and just need the parser rules.

## Migration Checklist

1. Identify whether the old code is DOM-based, jQuery-based, React-based, or really just `FormData` processing.
2. Swap the legacy package or script include for the specific current package.
3. Move old positional arguments to an options object where appropriate.
4. Re-test any custom `nodeCallback` logic and any flows that depend on disabled or empty fields.
5. Replace browser-only parsing with `@form2js/form-data` or `@form2js/react` when the parsing no longer needs direct DOM traversal.
