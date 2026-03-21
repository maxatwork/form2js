# @form2js/react

Handle form submission with a small React hook built on form2js parsing.

## Install

```bash
npm install @form2js/react react
```

## Minimal usage

```tsx
import { useForm2js } from "@form2js/react";

export function ProfileForm(): React.JSX.Element {
  const { onSubmit, isSubmitting } = useForm2js(async (data) => {
    await saveProfile(data);
  });

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <input name="person.name.first" defaultValue="Sam" />
      <button disabled={isSubmitting}>Save</button>
    </form>
  );
}
```

For guides, playground examples, and API details, see the docs site:
https://maxatwork.github.io/form2js/?variant=react

License: MIT
