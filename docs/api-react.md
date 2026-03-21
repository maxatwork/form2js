# @form2js/react

`@form2js/react` wraps the form-data parser in a React submit hook. Use it when you want a single `onSubmit` handler that parses form input, optionally validates it with a schema, and tracks submit state without wiring your own state machine.

## Installation

```bash
npm install @form2js/react react
```

Standalone/global build is not shipped for this package.

## General Example

```tsx
import { z } from "zod";
import { useForm2js } from "@form2js/react";

const schema = z.object({
  person: z.object({
    email: z.string().email()
  })
});

export function SignupForm(): React.JSX.Element {
  const { onSubmit, isSubmitting, isError, error, isSuccess, reset } = useForm2js(
    async (data) => {
      await sendFormData(data);
    },
    { schema }
  );

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <input name="person.email" type="email" defaultValue="sam.vimes@ankh.city" />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
      {isError ? <p>{String(error)}</p> : null}
      {isSuccess ? <p>Saved</p> : null}
      <button type="button" onClick={reset}>
        Reset state
      </button>
    </form>
  );
}
```

## Types and Properties

### Exported Surface

| Export | Kind | What it does |
| --- | --- | --- |
| `UseForm2jsData` | type | Infers submit payload from the optional schema. |
| `UseForm2jsSubmit` | type | Submit callback signature. |
| `UseForm2jsOptions` | interface | Parser options plus optional schema. |
| `UseForm2jsResult` | interface | Hook return state and handlers. |
| `useForm2js` | function | Creates submit handler and submit state machine for forms. |

```ts
export type UseForm2jsSubmit<TSchema extends SchemaValidator | undefined = undefined> = (
  data: UseForm2jsData<TSchema>
) => Promise<void> | void;

export interface UseForm2jsOptions<TSchema extends SchemaValidator | undefined = undefined>
  extends ParseOptions {
  schema?: TSchema;
}

export interface UseForm2jsResult {
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => Promise<void>;
  isSubmitting: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
  reset: () => void;
}
```

### Options And Defaults

| Option | Default | Why this matters |
| --- | --- | --- |
| `delimiter` | `"."` | Keeps parser path splitting aligned with the other packages. |
| `skipEmpty` | `true` | Drops empty string and `null` values unless disabled. |
| `allowUnsafePathSegments` | `false` | Keeps parser hardened by default. |
| `schema` | unset | If set, the parsed payload is run through `schema.parse(...)` before the submit callback. |

### Behavior Notes

- `onSubmit` always calls `event.preventDefault()`.
- Re-submit attempts are ignored while a submit promise is still pending.
- Validation and submit errors are both surfaced through `error` and `isError`.
- `reset()` clears `isError`, `error`, and `isSuccess`.
