---
'@haetae/git': patch
---

Fixed an issue that, for `changedFiles`, `options.includeIgnored` is ignored when `options.includeUntracked` is `false`. From now on, `options.includeIgnored` and `options.includeUntracked` are independent.
