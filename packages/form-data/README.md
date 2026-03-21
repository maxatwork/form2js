# @form2js/form-data

Convert `FormData` and entry lists into structured objects.

## Install

```bash
npm install @form2js/form-data
```

## Minimal usage

```ts
import { formDataToObject } from "@form2js/form-data";

const result = formDataToObject([
  ["person.name.first", "Sam"],
  ["person.roles[]", "captain"],
]);
```

For guides, playground examples, and API details, see the docs site:
https://maxatwork.github.io/form2js/?variant=form-data

License: MIT
