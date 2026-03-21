# @form2js/core

Core path parsing and object transformation logic for form-shaped data.

## Install

```bash
npm install @form2js/core
```

## Minimal usage

```ts
import { entriesToObject } from "@form2js/core";

const data = entriesToObject([
  { key: "person.name.first", value: "Vimes" },
  { key: "person.tags[]", value: "watch" },
]);
```

For guides, playground examples, and API details, see the docs site:
https://maxatwork.github.io/form2js/?variant=core

License: MIT
