---
'@haetae/git': patch
---

-
- **BREAKING CHANGE**: A new option `ChangedFileOptions.filterByExistence` is introduced. The default value from `changedFiles` is `true` and the previous behavior of `changedFiles` was like setting it as `false`.
- A new option `ChangedFileOptions.reserveRecordData` is introduced.
- `haetae`'s `defaultRootRecordData` is removed. Instead, `@haetae/git`'s `changedFiles` calls `core.reserveRecordData` internally.
