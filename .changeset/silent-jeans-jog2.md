---
'@haetae/git': patch
---

**BREAKING CHANGE**: `changedFiles` returns file paths with slash(`/`) as a delimiter, which means, on Windows, legacy Windows delimiter(`\`) is not returned.
