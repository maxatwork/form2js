# @form2js/js2form

Populate form controls from plain object data.

## Install

```bash
npm install @form2js/js2form
```

## Minimal usage

```ts
import { objectToForm } from "@form2js/js2form";

objectToForm(document.getElementById("profileForm"), {
  person: { name: { first: "Tiffany", last: "Aching" } },
});
```

For guides, playground examples, and API details, see the docs site:
https://maxatwork.github.io/form2js/?variant=js2form

License: MIT
