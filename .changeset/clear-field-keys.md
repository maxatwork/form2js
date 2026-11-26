---
"@form2js/core": patch
"@form2js/js2form": patch
---

Preserve nested numeric, Unicode, and punctuation-prefixed object keys when parsing and populating forms, including keys on objects inside arrays. Numeric object keys map to literal fields such as `tags.0`. Use an array for checkbox groups or multi-selects named `tags` or `tags[]`.
