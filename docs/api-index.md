# form2js API Reference

This section is for developers who want the exact API surface of the current `@form2js/*` packages, plus the defaults and edge cases that usually matter when you wire forms into real applications.

If you want the broader project overview first, start with [README.md](README.md).

## Who this is for

- Developers choosing between the `@form2js/*` packages
- Teams migrating from the legacy `form2js` flow to package-specific APIs
- Anyone who needs exact options, exported types, and behavior notes

## Package Guide

- [`@form2js/core`](api-core.md): parse path-like entries into nested objects and flatten them back out
- [`@form2js/dom`](api-dom.md): turn browser form controls into an object
- [`@form2js/form-data`](api-form-data.md): parse `FormData` or tuple entries with the same path rules
- [`@form2js/react`](api-react.md): handle React form submission with parsing, validation, and submit state
- [`@form2js/js2form`](api-js2form.md): push nested object data back into form controls
- [`@form2js/jquery`](api-jquery.md): install a jQuery plugin on top of the DOM parser

## Shared Naming Rules

These rules apply across parser-based packages such as `core`, `dom`, and `form-data`.

- Dot paths build nested objects: `person.name.first` becomes `{ person: { name: { first: ... } } }`
- Repeated `[]` pushes into arrays in encounter order: `roles[]`
- Indexed arrays are compacted in first-seen order: `items[8]`, `items[5]` becomes indexes `0`, `1`
- Rails-style brackets are supported: `rails[field][value]`
- By default, empty string and `null` are skipped (`skipEmpty: true`)
- Unsafe key path segments (`__proto__`, `prototype`, `constructor`) are rejected by default
