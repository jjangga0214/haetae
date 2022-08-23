---
'@haetae/utils': patch
---

**BREAKING CHANGE**: For every functions, when the argument or an option `rootDir` is given as relative path, `getConfigDirname()` of `@haetae/core` is joined with the `rootDir`.
