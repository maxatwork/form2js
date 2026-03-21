# @form2js/dom

`@form2js/dom` solves the browser side of the problem: walk a form or DOM subtree, extract the submitted values, and return the parsed object. Use it when you want native form semantics without writing the extraction logic yourself.

## Installation

```bash
npm install @form2js/dom
```

Standalone via `unpkg`:

```html
<script src="https://unpkg.com/@form2js/dom/dist/standalone.global.js"></script>
<script>
  const data = formToObject(formElement);
  // or form2js(formElement)
</script>
```

## General Example

```ts
import { formToObject } from "@form2js/dom";

const result = formToObject(document.getElementById("profileForm"), {
  useIdIfEmptyName: true,
  getDisabled: false,
});
```

## Types and Properties

### Exported Surface

| Export | Kind | What it does |
| --- | --- | --- |
| `NodeCallbackResult` | interface | Custom extraction payload (`name` or `key` plus `value`). |
| `FormToObjectNodeCallback` | type | Callback type used during node walk. |
| `ExtractOptions` | interface | Options for pair extraction only. |
| `FormToObjectOptions` | interface | Extraction options plus parser options. |
| `RootNodeInput` | type | Supported root inputs such as `id`, `Node`, `NodeList`, arrays, and collections. |
| `extractPairs` | function | Traverses DOM and returns path/value entries. |
| `formToObject` | function | High-level parser from DOM to object tree. |
| `form2js` | function | Compatibility wrapper around `formToObject`. |

```ts
export interface NodeCallbackResult {
  name?: string;
  key?: string;
  value: unknown;
}

export const SKIP_NODE: unique symbol;

export type FormToObjectNodeCallback = (
  node: Node
) => NodeCallbackResult | typeof SKIP_NODE | false | null | undefined;

export interface ExtractOptions {
  nodeCallback?: FormToObjectNodeCallback;
  useIdIfEmptyName?: boolean;
  getDisabled?: boolean;
  document?: Document;
}

export interface FormToObjectOptions extends ExtractOptions, ParseOptions {}

export function extractPairs(rootNode: RootNodeInput, options?: ExtractOptions): Entry[];
export function formToObject(rootNode: RootNodeInput, options?: FormToObjectOptions): ObjectTree;
```

### Options And Defaults

| Option | Default | Where | Why this matters |
| --- | --- | --- | --- |
| `delimiter` | `"."` | `formToObject`, `form2js` | Matches parser path semantics. |
| `skipEmpty` | `true` | `formToObject`, `form2js` | Skips `""` and `null` values by default. |
| `allowUnsafePathSegments` | `false` | `formToObject`, `form2js` | Rejects unsafe path segments before object merging. |
| `useIdIfEmptyName` | `false` | extraction and wrappers | Lets `id` act as field key when `name` is empty. |
| `getDisabled` | `false` | extraction and wrappers | Disabled controls, including disabled fieldset descendants, are ignored unless enabled explicitly. |
| `nodeCallback` | unset | extraction and wrappers | Use it for custom field extraction from specific nodes. |
| `document` | ambient/global document | extraction and wrappers | Required outside browser globals. |

### `useIdIfEmptyName`

Enable this when a form control is keyed by `id` rather than `name`, which is common in older markup or UI builders.

```ts
import { formToObject } from "@form2js/dom";

const result = formToObject(document.getElementById("profileForm"), {
  useIdIfEmptyName: true
});
```

### `nodeCallback`

Use `nodeCallback` to rewrite or skip specific nodes before the default extraction logic runs.

```ts
import { formToObject, SKIP_NODE } from "@form2js/dom";

const result = formToObject(document.getElementById("profileForm"), {
  nodeCallback(node) {
    if (!(node instanceof HTMLInputElement)) {
      return;
    }

    if (node.type === "hidden" && node.name === "csrfToken") {
      return SKIP_NODE;
    }

    if (node.name === "person.age") {
      return { key: node.name, value: Number(node.value) };
    }
  }
});
```

### Behavior Notes

- `select name="colors[]"` is emitted as key `colors`; the trailing `[]` is removed for selects.
- Checkbox and radio values follow native browser submission semantics:
  - checked controls emit their string `value`
  - unchecked controls are omitted
  - omitted indexed controls do not reserve compacted array slots, so preserve row identity with another submitted field when it matters
- Button-like inputs (`button`, `reset`, `submit`, `image`) are excluded from extraction.
- You can merge multiple roots (`NodeList`, arrays, `HTMLCollection`) into one object.
- If the callback returns `SKIP_NODE`, that node is excluded from extraction entirely.
- If the callback returns `{ key | name, value }`, that value is used directly for that node.
