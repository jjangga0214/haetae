---
'haetae': patch
---

**BREAKING CHANGE**: `defaultRootRecordData` is removed. `@haetae/git`'s `changedFiles` calls `core.reserveRecordData` internally, so now `defaultRootRecordData` is not needed for writing `@haetae/git`s default Record Data.
