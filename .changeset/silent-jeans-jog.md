---
'@haetae/core': patch
---

**BREAKING CHANGE**: Every path is converted/returned with slash(`/`) as a delimiter, which means, on Windows, legacy Windows delimiter(`\`) is not returned. However, you can still put the legacy style path as a argument or config field.
