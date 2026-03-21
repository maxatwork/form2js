# @form2js/form-data

`@form2js/form-data` is the server-friendly adapter for the same parsing rules used by the DOM package. Use it when your input is a `FormData` instance or a plain iterable of form-like key/value tuples.

## Installation

```bash
npm install @form2js/form-data
```

Standalone/global build is not shipped for this package.

## General Example

```ts
import { formDataToObject } from "@form2js/form-data";

const result = formDataToObject([
  ["person.name.first", "Sam"],
  ["person.roles[]", "captain"],
]);
```

## Types and Properties

### Exported Surface

| Export | Kind | What it does |
| --- | --- | --- |
| `KeyValueEntryInput` | type alias | Alias of core `EntryInput`. |
| `FormDataToObjectOptions` | interface | Parser options for form-data conversion. |
| `entriesToObject` | function | Adapter to the core parser. |
| `formDataToObject` | function | Parses `FormData` or iterable form-data entries. |
| `EntryInput`, `ObjectTree`, `ParseOptions`, `SchemaValidator`, `ValidationOptions`, `InferSchemaOutput` | type re-export | Core types re-exported for convenience. |

```ts
export type KeyValueEntryInput = EntryInput;

export interface FormDataToObjectOptions extends ParseOptions {}

export function entriesToObject(entries: Iterable<KeyValueEntryInput>, options?: ParseOptions): ObjectTree;
export function formDataToObject(
  formData: FormData | Iterable<readonly [string, FormDataEntryValue]>,
  options?: FormDataToObjectOptions
): ObjectTree;
```

### Options And Defaults

| Option | Default | Why this matters |
| --- | --- | --- |
| `delimiter` | `"."` | Keeps path splitting aligned with core and DOM behavior. |
| `skipEmpty` | `true` | Drops empty string and `null` values unless disabled. |
| `allowUnsafePathSegments` | `false` | Rejects unsafe path segments before object merging. |
| `schema` | unset | Runs `schema.parse(parsedObject)` after parsing and returns schema output type. |

### Schema validation

Use the same schema pattern on `FormData` input when you want validated server-side parsing without importing `@form2js/core` separately.

```ts
import { z } from "zod";
import { formDataToObject } from "@form2js/form-data";

const PersonSchema = z.object({
  person: z.object({
    age: z.coerce.number().int().min(0)
  })
});

const formData = new FormData();
formData.set("person.age", "12");

const result = formDataToObject(formData, { schema: PersonSchema });
```

### Behavior Notes

- Parsing rules are the same as `@form2js/core`.
- Accepts either a real `FormData` object or any iterable of readonly key/value tuples.
- Schema validation is optional and uses only a structural `{ parse(unknown) }` contract.
