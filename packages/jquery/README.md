# @form2js/jquery

Use form2js through a jQuery plugin adapter.

## Install

```bash
npm install @form2js/jquery jquery
```

## Minimal usage

```ts
import $ from "jquery";
import { installToObjectPlugin } from "@form2js/jquery";

installToObjectPlugin($);
const data = $("#profileForm").toObject({ mode: "first" });
```

For guides, playground examples, and API details, see the docs site:
https://maxatwork.github.io/form2js/?variant=jquery

License: MIT
