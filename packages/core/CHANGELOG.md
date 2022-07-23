# @haetae/core

## 0.0.8

### Patch Changes

- [`f22727d`](https://github.com/jjangga0214/haetae/commit/f22727d146e9038246b546a33d350579eceee453) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** root `env` and `recordData` are to be mapper function that takes env/recordData as an argument from command's `env` and `run` and then returns the final result to be stored.

## 0.0.7

### Patch Changes

- [`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Let `env` be object or function.

- [`23eb1f3`](https://github.com/jjangga0214/haetae/commit/23eb1f3dad8e55e178c6375064b41b5a2e33fe6e) Thanks [@jjangga0214](https://github.com/jjangga0214)! - (BREAKING CHANGE) Moved `$HAETAE_CONFIG_FILE` handling from `@haetae/core` to `@haetae/cli`. From now on, `@haetae/core` does not detect `$HAETAE_CONFIG_FILE` automatically.

- [`afa12ee`](https://github.com/jjangga0214/haetae/commit/afa12eee27560856fa40754f9d04aaa3bf920c1d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - (BREAKING CHANGE) Introduced `HaetaeRecordData`.

- [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Provide generics for `env` and `recordData`.

- [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Now global default env and recordData can be configured.

- [`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Record's `time` is now unix timestamp by miliseconds.

## 0.0.6

### Patch Changes

- [`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Exported new function `compareEnvs`.

- [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Export `packageName` and `packageVersion`.

- [`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed env comparison issue. Now record is not duplicated for the same env.

## 0.0.5

### Patch Changes

- [`f90049f`](https://github.com/jjangga0214/haetae/commit/f90049f79d288815f9ee4122ded81a3df9191b23) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed default store file path resolution.
