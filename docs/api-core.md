# @form2js/core

`@form2js/core` is the path parsing engine behind the rest of the package family. Use it when you already have key/value entries, need to turn them into nested objects, or want to flatten nested data back into entry form.

## Installation

```bash
npm install @form2js/core
```

Standalone/global build is not shipped for this package.

## General Example

```ts
import { entriesToObject, objectToEntries } from "@form2js/core";

const data = entriesToObject([
  { key: "person.name.first", value: "Esme" },
  { key: "person.roles[]", value: "witch" },
]);

const flat = objectToEntries(data);
```

## Types and Properties

### Exported Surface

| Export | Kind | What it does |
| --- | --- | --- |
| `createMergeContext` | function | Creates merge state used while parsing indexed arrays. |
| `setPathValue` | function | Applies one path/value into an object tree. |
| `entriesToObject` | function | Main parser for iterable entries. |
| `objectToEntries` | function | Flattens nested object/array data into `{ key, value }` entries. |
| `processNameValues` | function | Compatibility helper for `{ name, value }` input. |
| `Entry`, `EntryInput`, `EntryValue`, `NameValuePair`, `ObjectTree`, `ParseOptions`, `MergeContext`, `MergeOptions`, `SchemaValidator`, `ValidationOptions`, `InferSchemaOutput` | types | Public type surface for parser inputs, options, and results. |

```ts
export function createMergeContext(): MergeContext;

export function setPathValue(
  target: ObjectTree,
  path: string,
  value: EntryValue,
  options?: MergeOptions
): ObjectTree;

export function entriesToObject(entries: Iterable<EntryInput>, options?: ParseOptions): ObjectTree;
export function entriesToObject<TSchema extends SchemaValidator>(
  entries: Iterable<EntryInput>,
  options: ParseOptions & { schema: TSchema }
): InferSchemaOutput<TSchema>;

export function objectToEntries(value: unknown): Entry[];

export function processNameValues(
  nameValues: Iterable<NameValuePair>,
  skipEmpty?: boolean,
  delimiter?: string
): ObjectTree;
```

### Options And Defaults

| Option | Default | Where | Why this matters |
| --- | --- | --- | --- |
| `delimiter` | `"."` | `entriesToObject`, `setPathValue`, `processNameValues` | Controls how dot-like path chunks are split. |
| `skipEmpty` | `true` | `entriesToObject`, `processNameValues` | Drops `""` and `null` values unless you opt out. |
| `allowUnsafePathSegments` | `false` | `entriesToObject`, `setPathValue` | Blocks prototype-pollution path segments unless you explicitly trust the source. |
| `schema` | unset | `entriesToObject` | Runs `schema.parse(parsedObject)` and returns schema output type. |
| `context` | fresh merge context | `setPathValue` | Keeps indexed array compaction stable across multiple writes. |

### Schema validation

Use `schema` when you want parsing and validation in the same step. The parser only requires a structural `{ parse(unknown) }` contract, so this works with Zod and similar validators.

```ts
import { z } from "zod";
import { entriesToObject } from "@form2js/core";

const PersonSchema = z.object({
  person: z.object({
    age: z.coerce.number().int().min(0),
    email: z.string().email()
  })
});

const rawEntries = [
  { key: "person.age", value: "17" },
  { key: "person.email", value: "esk@example.com" }
];

const result = entriesToObject(rawEntries, { schema: PersonSchema });
```

### `skipEmpty: false`

Opt out of the default empty-value filtering when blank strings are meaningful in your payload.

```ts
import { entriesToObject } from "@form2js/core";

const result = entriesToObject(
  [{ key: "person.nickname", value: "" }],
  { skipEmpty: false }
);
```

### Behavior Notes

- Indexed array keys are compacted by encounter order, not preserved by numeric index.
- `EntryInput` accepts `[key, value]`, `{ key, value }`, and `{ name, value }`.
- If `schema` is provided, parser output is passed to `schema.parse()` and schema errors are rethrown.
- `objectToEntries` emits bracket indexes for arrays such as `emails[0]` and only serializes own enumerable properties.
