---
'@haetae/javascript': patch
'@haetae/utils': patch
---

**BREAKING CHANGE** `toIndexedDependencyRelationships` is moved from `@haetae/javascript` to `@haetae/utils` and renamed to `graph`. `@haetae/javascript`'s `dependsOn` now takes `additionalGraph`, not `relationships`.

**example:**

```js
js.dependsOn(['foo.ts', 'bar.ts'],
  {
    additionalGraph: utils.graph({
      edges: [
        // specify your additional dependency graph
      ]
    })
  }
)
```
