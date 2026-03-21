# @form2js/js2form

`@form2js/js2form` moves data in the opposite direction: take a nested object and write it into matching form controls. Use it when you need to prefill a form, restore saved draft state, or sync object data back into existing DOM controls.

## Installation

```bash
npm install @form2js/js2form
```

Standalone/global build is not shipped for this package.

## General Example

```ts
import { objectToForm } from "@form2js/js2form";

objectToForm("profileForm", {
  person: {
    name: { first: "Tiffany", last: "Aching" },
    roles: ["witch"],
  },
});
```

## Types and Properties

### Exported Surface

| Export | Kind | What it does |
| --- | --- | --- |
| `RootNodeInput` | type | Root as element id, node, `null`, or `undefined`. |
| `ObjectToFormNodeCallback` | type | Write-time callback for per-node assignment control. |
| `ObjectToFormOptions` | interface | Options for name normalization, cleaning, and document resolution. |
| `SupportedField`, `SupportedFieldCollection`, `FieldMap` | types | Field typing used by mapping and assignment helpers. |
| `flattenDataForForm` | function | Flattens object data to an entry list. |
| `mapFieldsByName` | function | Builds a normalized name-to-field mapping. |
| `objectToForm` | function | Populates matching fields from object data. |
| `js2form` | function | Compatibility wrapper around `objectToForm`. |
| `normalizeName` | function | Normalizes field names and compacts indexed arrays. |

```ts
export interface ObjectToFormOptions {
  delimiter?: string;
  nodeCallback?: ObjectToFormNodeCallback;
  useIdIfEmptyName?: boolean;
  shouldClean?: boolean;
  document?: Document;
}

export function flattenDataForForm(data: unknown): Entry[];
export function mapFieldsByName(
  rootNode: RootNodeInput,
  options?: Pick<ObjectToFormOptions, "delimiter" | "useIdIfEmptyName" | "shouldClean" | "document">
): FieldMap;
export function objectToForm(rootNode: RootNodeInput, data: unknown, options?: ObjectToFormOptions): void;
```

### Options And Defaults

| Option | Default | Where | Why this matters |
| --- | --- | --- | --- |
| `delimiter` | `"."` | `objectToForm`, `mapFieldsByName`, `js2form` | Must match how your input keys are structured. |
| `useIdIfEmptyName` | `false` | `objectToForm`, `mapFieldsByName`, `js2form` | Useful when form controls are keyed by `id` instead of `name`. |
| `shouldClean` | `true` | `objectToForm`, `mapFieldsByName` | Clears form state before applying incoming values. |
| `document` | ambient/global document | all root-resolving APIs | Needed when running with a DOM shim. |
| `nodeCallback` | unset | `objectToForm`, `js2form` options | Called before default assignment; return `false` to skip default assignment for that node. |

### `shouldClean: false`

Disable cleaning when you want to layer partial data onto an existing form without clearing unrelated controls first.

```ts
import { objectToForm } from "@form2js/js2form";

objectToForm(
  "profileForm",
  {
    person: {
      name: { first: "Tiffany" }
    }
  },
  { shouldClean: false }
);
```

### `useIdIfEmptyName`

Match fields by `id` when the markup does not provide stable `name` attributes.

```ts
import { objectToForm } from "@form2js/js2form";

objectToForm(
  document.getElementById("profileForm"),
  {
    firstName: "Agnes"
  },
  { useIdIfEmptyName: true }
);
```

### Behavior Notes

- `objectToForm` is a no-op when the root cannot be resolved.
- Checkbox and radio groups are matched with `[]` and non-`[]` name fallbacks.
- Name normalization compacts sparse indexes to sequential indexes during matching.
- For multi-select names like `colors[]`, matching includes `[]` and bare-name fallbacks without creating one map key per option.
- Form updates set values, checked state, and selected state, but do not dispatch synthetic events.
