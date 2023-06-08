# @haetae/common

## 0.0.2

### Patch Changes

- [`b84cebe`](https://github.com/jjangga0214/haetae/commit/b84cebe811e93bdc7c8f626f3f54168dd402cbf7) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed an issue that `toAbsolutePath` joins `options.rootDir` to `options.file` even when the `options.file` is already an absolute path. From now on, `options.file` is returned as-is if it's an absolute path already.

* [`b84cebe`](https://github.com/jjangga0214/haetae/commit/b84cebe811e93bdc7c8f626f3f54168dd402cbf7) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Added a new function `parsePkg` and interfaces `ParsePkgOptions` and `Pkg`.

- [`32687c8`](https://github.com/jjangga0214/haetae/commit/32687c8712554934846422f6422b7409670e024c) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `ToAbsolutePathOptions`'s `file` is renamed to `path`.
