# form2js API Reference

## Who this is for

This page is for developers who want the exact API surface of the current `@form2js/*` packages, with practical notes about defaults and edge cases.

If you want a quick tour first, start with `README.md`.

## Package Index

| Package | Use it when you need to... | Main exports |
| --- | --- | --- |
| `@form2js/core` | Turn path-like key/value pairs into nested objects (and back). | `entriesToObject`, `objectToEntries`, `setPathValue` |
| `@form2js/dom` | Read browser form fields into an object. | `formToObject`, `extractPairs`, `form2js` |
| `@form2js/form-data` | Parse `FormData` or entry tuples with the same path rules. | `formDataToObject`, `entriesToObject` |
| `@form2js/js2form` | Push object values back into form controls. | `objectToForm`, `mapFieldsByName`, `js2form` |
| `@form2js/jquery` | Add `$.fn.toObject()` on top of `@form2js/dom`. | `installToObjectPlugin`, `maybeAutoInstallPlugin` |

## Shared Naming Rules

These rules apply across parser-based packages (`core`, `dom`, `form-data`):

- Dot paths build nested objects: `person.name.first` -> `{ person: { name: { first: ... } } }`
- Repeated `[]` pushes into arrays in encounter order: `roles[]`
- Indexed arrays are compacted in first-seen order: `items[8]`, `items[5]` becomes indexes `0`, `1`
- Rails-style brackets are supported: `rails[field][value]`
- By default, empty string and `null` are skipped (`skipEmpty: true`)
- Unsafe key path segments (`__proto__`, `prototype`, `constructor`) are rejected by default

## `@form2js/core`

### Common tasks

- Convert key/value entries into nested data (`entriesToObject`)
- Flatten nested data into path entries (`objectToEntries`)
- Apply one path/value into an existing object (`setPathValue`)
- Keep legacy `name/value` pair input (`processNameValues`)

### API

| Export | Kind | What it does |
| --- | --- | --- |
| `createMergeContext` | function | Creates merge state used while parsing indexed arrays. |
| `setPathValue` | function | Applies one path/value into an object tree. |
| `entriesToObject` | function | Main parser for iterable entries. |
| `objectToEntries` | function | Flattens nested object/array data into `{ key, value }` entries. |
| `processNameValues` | function | Compatibility helper for `{ name, value }` input. |
| `Entry`, `EntryInput`, `EntryValue`, `NameValuePair`, `ObjectTree`, `ParseOptions`, `MergeContext`, `MergeOptions` | types | Public type surface for parser inputs/options/results. |

```ts
export function createMergeContext(): MergeContext;

export function setPathValue(
  target: ObjectTree,
  path: string,
  value: EntryValue,
  options?: MergeOptions
): ObjectTree;

export function entriesToObject(entries: Iterable<EntryInput>, options?: ParseOptions): ObjectTree;

export function objectToEntries(value: unknown): Entry[];

export function processNameValues(
  nameValues: Iterable<NameValuePair>,
  skipEmpty?: boolean,
  delimiter?: string
): ObjectTree;

export type {
  Entry,
  EntryInput,
  EntryValue,
  MergeContext,
  MergeOptions,
  NameValuePair,
  ObjectTree,
  ParseOptions
} from "./types";
```

### Options and defaults

| Option | Default | Where | Why this matters |
| --- | --- | --- | --- |
| `delimiter` | `"."` | `entriesToObject`, `setPathValue`, `processNameValues` | Controls how dot-like path chunks are split. |
| `skipEmpty` | `true` | `entriesToObject`, `processNameValues` | Drops `""` and `null` values unless you opt out. |
| `allowUnsafePathSegments` | `false` | `entriesToObject`, `setPathValue` | Blocks prototype-pollution path segments unless you explicitly trust the source. |
| `context` | fresh merge context | `setPathValue` | Keeps indexed array compaction stable across multiple writes. |

### Behavior notes

- Indexed array keys are compacted by encounter order, not preserved by numeric index.
- `EntryInput` accepts `[key, value]`, `{ key, value }`, and `{ name, value }`.
- `objectToEntries` emits bracket indexes for arrays (for example `emails[0]`) and only serializes own enumerable properties.

### Quick example

```ts
import { entriesToObject, objectToEntries } from "@form2js/core";

const data = entriesToObject([
  { key: "person.name.first", value: "Esme" },
  { key: "person.roles[]", value: "witch" },
]);

const flat = objectToEntries(data);
```

## `@form2js/dom`

### Common tasks

- Convert a form (or a subtree) into an object (`formToObject`)
- Extract raw `{ key, value }` pairs before parsing (`extractPairs`)
- Keep the legacy function signature (`form2js`)

### API

| Export | Kind | What it does |
| --- | --- | --- |
| `NodeCallbackResult` | interface | Custom extraction payload (`name`/`key` + `value`). |
| `FormToObjectNodeCallback` | type | Callback type used during node walk. |
| `ExtractOptions` | interface | Options for pair extraction only. |
| `FormToObjectOptions` | interface | Extraction options plus parser options. |
| `RootNodeInput` | type | Supported root inputs (`id`, `Node`, collections, etc.). |
| `extractPairs` | function | Traverses DOM and returns path/value entries. |
| `formToObject` | function | High-level parser from DOM to object tree. |
| `form2js` | function | Compatibility wrapper around `formToObject`. |

```ts
export interface NodeCallbackResult {
  name?: string;
  key?: string;
  value: unknown;
}

export type FormToObjectNodeCallback = (node: Node) => NodeCallbackResult | false | null | undefined;

export interface ExtractOptions {
  nodeCallback?: FormToObjectNodeCallback;
  useIdIfEmptyName?: boolean;
  getDisabled?: boolean;
  document?: Document;
}

export interface FormToObjectOptions extends ExtractOptions, ParseOptions {}

export type RootNodeInput =
  | string
  | Node
  | NodeListOf<Node>
  | Node[]
  | HTMLCollection
  | null
  | undefined;

export function extractPairs(rootNode: RootNodeInput, options?: ExtractOptions): Entry[];

export function formToObject(rootNode: RootNodeInput, options?: FormToObjectOptions): ObjectTree;

export function form2js(
  rootNode: RootNodeInput,
  delimiter?: string,
  skipEmpty?: boolean,
  nodeCallback?: FormToObjectNodeCallback,
  useIdIfEmptyName?: boolean,
  getDisabled?: boolean,
  allowUnsafePathSegments?: boolean
): ObjectTree;
```

### Options and defaults

| Option | Default | Where | Why this matters |
| --- | --- | --- | --- |
| `delimiter` | `"."` | `formToObject`, `form2js` | Matches parser path semantics. |
| `skipEmpty` | `true` | `formToObject`, `form2js` | Skips `""` and `null` values by default. |
| `allowUnsafePathSegments` | `false` | `formToObject`, `form2js` | Rejects unsafe path segments before object merging. |
| `useIdIfEmptyName` | `false` | extraction + wrappers | Lets `id` act as field key when `name` is empty. |
| `getDisabled` | `false` | extraction + wrappers | Disabled controls, including disabled fieldset descendants, are ignored unless enabled explicitly. |
| `nodeCallback` | unset | extraction + wrappers | Use for custom field extraction from specific nodes. |
| `document` | ambient/global document | extraction + wrappers | Required outside browser globals. |

### Behavior notes

- `select name="colors[]"` is emitted as key `colors` (the trailing `[]` is removed for selects).
- Legacy checkbox/radio quirks are preserved:
  - checked `"true"` -> `true`
  - unchecked `"true"` -> `false`
  - checked `"false"` (radio/checkbox) -> `false`
- Button-like inputs (`button`, `reset`, `submit`, `image`) are excluded from extraction.
- Can merge multiple roots (`NodeList`, arrays, `HTMLCollection`) into one object.
- If callback returns `{ key|name, value }`, that value is used directly for that node.

### Quick example

```ts
import { formToObject } from "@form2js/dom";

const result = formToObject(document.getElementById("profileForm"), {
  useIdIfEmptyName: true,
  getDisabled: false,
});
```

## `@form2js/form-data`

### Common tasks

- Parse a `FormData` instance with the same semantics as DOM parsing
- Parse tuple entries in server pipelines (`Iterable<[string, value]>`)
- Reuse core parser options without importing `@form2js/core` directly

### API

| Export | Kind | What it does |
| --- | --- | --- |
| `KeyValueEntryInput` | type alias | Alias of core `EntryInput`. |
| `FormDataToObjectOptions` | interface | Parser options for form-data conversion. |
| `entriesToObject` | function | Adapter to core parser. |
| `formDataToObject` | function | Parses `FormData` or iterable form-data entries. |
| `EntryInput`, `ObjectTree`, `ParseOptions` | type re-export | Core types re-exported for convenience. |

```ts
export type KeyValueEntryInput = EntryInput;

export interface FormDataToObjectOptions extends ParseOptions {}

export function entriesToObject(entries: Iterable<KeyValueEntryInput>, options?: ParseOptions): ObjectTree;

export function formDataToObject(
  formData: FormData | Iterable<readonly [string, FormDataEntryValue]>,
  options?: FormDataToObjectOptions
): ObjectTree;

export type { EntryInput, ObjectTree, ParseOptions } from "@form2js/core";
```

### Options and defaults

| Option | Default | Why this matters |
| --- | --- | --- |
| `delimiter` | `"."` | Keeps path splitting aligned with core/dom behavior. |
| `skipEmpty` | `true` | Drops empty string and `null` values unless disabled. |
| `allowUnsafePathSegments` | `false` | Rejects unsafe path segments before object merging. |

### Behavior notes

- Parsing rules are the same as `@form2js/core`.
- Accepts either a real `FormData` object or any iterable of readonly key/value tuples.

### Quick example

```ts
import { formDataToObject } from "@form2js/form-data";

const result = formDataToObject([
  ["person.name.first", "Sam"],
  ["person.roles[]", "captain"],
]);
```

## `@form2js/js2form`

### Common tasks

- Populate a form from nested object data (`objectToForm`)
- Precompute form field mapping (`mapFieldsByName`)
- Flatten object data to path entries (`flattenDataForForm`)
- Keep legacy wrapper call style (`js2form`)

### API

| Export | Kind | What it does |
| --- | --- | --- |
| `RootNodeInput` | type | Root as element id, node, `null`, or `undefined`. |
| `ObjectToFormNodeCallback` | type | Write-time callback for per-node assignment control. |
| `ObjectToFormOptions` | interface | Options for name normalization, cleaning, and document resolution. |
| `SupportedField`, `SupportedFieldCollection`, `FieldMap` | types | Field typing used by mapping and assignment helpers. |
| `flattenDataForForm` | function | Flattens object data to entry list. |
| `mapFieldsByName` | function | Builds normalized name -> field mapping. |
| `objectToForm` | function | Populates matching fields from object data. |
| `js2form` | function | Compatibility wrapper around `objectToForm`. |
| `normalizeName` | function | Normalizes field names and compacts indexed arrays. |
| `Entry` | type re-export | Core entry type re-export. |

```ts
export type RootNodeInput = string | Node | null | undefined;

export type ObjectToFormNodeCallback = ((node: Node) => unknown) | null | undefined;

export interface ObjectToFormOptions {
  delimiter?: string;
  nodeCallback?: ObjectToFormNodeCallback;
  useIdIfEmptyName?: boolean;
  shouldClean?: boolean;
  document?: Document;
}

export type SupportedField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export type SupportedFieldCollection = SupportedField | SupportedField[];
export type FieldMap = Record<string, SupportedFieldCollection>;

export function flattenDataForForm(data: unknown): Entry[];

export function mapFieldsByName(
  rootNode: RootNodeInput,
  options?: Pick<ObjectToFormOptions, "delimiter" | "useIdIfEmptyName" | "shouldClean" | "document">
): FieldMap;

export function objectToForm(rootNode: RootNodeInput, data: unknown, options?: ObjectToFormOptions): void;

export function js2form(
  rootNode: RootNodeInput,
  data: unknown,
  delimiter?: string,
  nodeCallback?: ObjectToFormNodeCallback,
  useIdIfEmptyName?: boolean
): void;

export { normalizeName };
export type { Entry } from "@form2js/core";
```

### Options and defaults

| Option | Default | Where | Why this matters |
| --- | --- | --- | --- |
| `delimiter` | `"."` | `objectToForm`, `mapFieldsByName`, `js2form` | Must match how your input keys are structured. |
| `useIdIfEmptyName` | `false` | `objectToForm`, `mapFieldsByName`, `js2form` | Useful when form controls are keyed by `id` instead of `name`. |
| `shouldClean` | `true` | `objectToForm`, `mapFieldsByName` | Clears form state before applying incoming values. |
| `document` | ambient/global document | all root-resolving APIs | Needed when running with a DOM shim. |
| `nodeCallback` | unset | `objectToForm`, `js2form` options | Called before default assignment; return `false` to skip default assignment for that node. |

### Behavior notes

- `objectToForm` is a no-op when root cannot be resolved.
- Checkbox/radio groups are matched with `[]` and non-`[]` name fallbacks.
- Name normalization compacts sparse indexes to sequential indexes during matching.
- For multi-select names like `colors[]`, matching includes `[]` and bare-name fallbacks without creating one map key per option.
- Form updates set values/checked/selected state, but do not dispatch synthetic events.

### Quick example

```ts
import { objectToForm } from "@form2js/js2form";

objectToForm("profileForm", {
  person: {
    name: { first: "Tiffany", last: "Aching" },
    roles: ["witch"],
  },
});
```

## `@form2js/jquery`

### Common tasks

- Install `toObject()` plugin on a jQuery instance
- Read first match, all matches, or a combined result from matched roots
- Auto-install the plugin from global `jQuery` in browser standalone usage

### API

| Export | Kind | What it does |
| --- | --- | --- |
| `ToObjectMode` | type | `"first" | "all" | "combine"` |
| `ToObjectOptions` | interface | Plugin options mapped to `@form2js/dom` behavior. |
| `installToObjectPlugin` | function | Adds `toObject()` to `$.fn` if missing. |
| `maybeAutoInstallPlugin` | function | Installs plugin only when a jQuery-like scope is detected. |

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

### Options and defaults

| Option | Default | Why this matters |
| --- | --- | --- |
| `mode` | `"first"` | Controls whether you parse one match, all matches, or merge all matches. |
| `delimiter` | `"."` | Same path splitting behavior as other packages. |
| `skipEmpty` | `true` | Keeps default parser behavior for empty values. |
| `allowUnsafePathSegments` | `false` | Rejects unsafe path segments before object merging. |
| `useIdIfEmptyName` | `false` | Lets plugin fall back to `id` where needed. |
| `getDisabled` | `false` | Disabled controls are skipped unless enabled. |
| `nodeCallback` | unset | Hook for custom extraction via DOM package semantics. |

### Behavior notes

- `installToObjectPlugin` is idempotent; it does not overwrite existing `$.fn.toObject`.
- `mode: "all"` returns an array of objects, one per matched element.
- `mode: "combine"` passes all matched root nodes together into DOM parser.

### Quick example

```ts
import $ from "jquery";
import { installToObjectPlugin } from "@form2js/jquery";

installToObjectPlugin($);

const data = $("#profileForm").toObject({ mode: "first" });
```

## Standalone and Browser Globals

- `@form2js/dom/standalone` exposes globals:
  - `formToObject`
  - `form2js`
- `@form2js/jquery/standalone` checks global `jQuery` and installs `$.fn.toObject()` when available.
- `@form2js/core`, `@form2js/form-data`, and `@form2js/js2form` are module-only (no standalone global bundle in this repo).
