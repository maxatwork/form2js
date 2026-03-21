# @form2js/jquery

`@form2js/jquery` is the legacy-friendly adapter for projects that still rely on jQuery forms. Use it when you want `$.fn.toObject()` on top of the DOM parser without rewriting the rest of the form handling code.

## Installation

```bash
npm install @form2js/jquery jquery
```

Standalone via `unpkg`:

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://unpkg.com/@form2js/jquery/dist/standalone.global.js"></script>
<script>
  const data = $("#profileForm").toObject({ mode: "first" });
</script>
```

## General Example

```ts
import $ from "jquery";
import { installToObjectPlugin } from "@form2js/jquery";

installToObjectPlugin($);

const data = $("#profileForm").toObject({ mode: "first" });
```

## Types and Properties

### Exported Surface

| Export | Kind | What it does |
| --- | --- | --- |
| `ToObjectMode` | type | `"first" | "all" | "combine"` |
| `ToObjectOptions` | interface | Plugin options mapped to `@form2js/dom` behavior. |
| `installToObjectPlugin` | function | Adds `toObject()` to `$.fn` if missing. |
| `maybeAutoInstallPlugin` | function | Installs the plugin only when a jQuery-like scope is detected. |

```ts
export type ToObjectMode = "first" | "all" | "combine";

export interface ToObjectOptions {
  mode?: ToObjectMode;
  delimiter?: string;
  skipEmpty?: boolean;
  allowUnsafePathSegments?: boolean;
  nodeCallback?: FormToObjectNodeCallback;
  useIdIfEmptyName?: boolean;
  getDisabled?: boolean;
}

export function installToObjectPlugin($: JQueryLike): void;
export function maybeAutoInstallPlugin(scope?: unknown): void;
```

### Options And Defaults

| Option | Default | Why this matters |
| --- | --- | --- |
| `mode` | `"first"` | Controls whether you parse one match, all matches, or merge all matches. |
| `delimiter` | `"."` | Same path splitting behavior as the other packages. |
| `skipEmpty` | `true` | Keeps default parser behavior for empty values. |
| `allowUnsafePathSegments` | `false` | Rejects unsafe path segments before object merging. |
| `useIdIfEmptyName` | `false` | Lets the plugin fall back to `id` where needed. |
| `getDisabled` | `false` | Disabled controls are skipped unless enabled. |
| `nodeCallback` | unset | Hook for custom extraction through the DOM package semantics. |

### `mode: "all"`

Use `all` when the selector can match multiple forms or repeated field groups and you want one parsed object per match.

```ts
const result = $(".profile-form").toObject({ mode: "all" });
```

### Behavior Notes

- `installToObjectPlugin` is idempotent; it does not overwrite an existing `$.fn.toObject`.
- `mode: "all"` returns an array of objects, one per matched element.
- `mode: "combine"` passes all matched root nodes together into the DOM parser.
