```
'@haetae/git': patch
```

- **BREAKING CHANGE**: A new option `ChangedFileOptions.filterByExistence` is introduced. The default value from `changedFiles` is `true` and the previous behavior of `changedFiles` was like setting it as `false`.

- `haetae`'s `defaultRootRecordData` is removed. Instead, `@haetea/git`'s `changedFiles` calls `core.reserveRecordData` internally.