---
'@haetae/javascript': patch
---

A new function `version` is added.
If you depend on a certain package, and you want to get its exact version, the new function would help you.
For example, you can specify version of a dep in `env`, like the below example.

**example:**

```js
{
  env: async () => ({
    // This would make sure when eslint version
    eslint: (await version('eslint')).major
  })
}
```
