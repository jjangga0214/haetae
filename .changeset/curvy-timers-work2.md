---
'@haetae/git': patch
---

**BREAKING CHANGE**: From now on, for `changedFiles`, when `option.from` is awaited (`Promise`) to be `undefined`, and `options.to` is string or awaited to be string, the result would include all of the tracked files that have been committed until `options.to`. Previosly, `options.fallback` was called, but it's not invoked anymore for that case. From now on, `options.fallback` is called when `options.to` is resolved to be `undefined`.
