---
'@haetae/utils': patch
---

-
- **BREAKING CHANGE**: `graph` became an async function.
- Fixed `glob` throwing error when `gitignore: true` and `patterns` are out of `roodDir`. Related to: [globby#168](https://github.com/sindresorhus/globby/issues/168)
- `dependOn` and `DependOnOptions` are newly introduced. (Note: Different from `dependsOn` and `DependsOnOptions`)
- `hash`, `graph`, `depend`, and `changedFiles` support glob pattern.
