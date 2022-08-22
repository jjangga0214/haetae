---
'@haetae/common': patch
---

Fixed an issue that `toAbsolutePath` joins `options.rootDir` to `options.file` even when the `options.file` is already an absolute path. From now on, `options.file` is returned as-is if it's an absolute path already.
