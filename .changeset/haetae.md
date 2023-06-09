```
'haetae': patch
```

**BREAKING CHANGE**: `defaultRootRecordData` is removed. `@haetea/git`'s `changedFiles` calls `core.reserveRecordData` internally, so now `defaultRootRecordData` is not needed for writing `@haetea/git`s default Record Data.
