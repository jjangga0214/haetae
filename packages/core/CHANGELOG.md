# @haetae/core

## 0.0.12

### Patch Changes

- [`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `GetConfigOptions` is renamed to `FilenameOption`

* [`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `mapStore` and `MapStoreOptions` is renamed to `addRecord` and `AddRecordOptions`.

- [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `configure` returns `storeFile` as an absolute path.

* [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e) Thanks [@jjangga0214](https://github.com/jjangga0214)! - `storeFilename` becomes module state and can be set/get by `setStoreFilename` and `getStoreFilename`.

- [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: Default path of store file is `.haetae/store.json` instead of `haetae.store.json`.

## 0.0.11

### Patch Changes

- [`c60afa9`](https://github.com/jjangga0214/haetae/commit/c60afa9c0f9c7809afcd0ee8682d41e0a8623673) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: Every path is converted/returned with slash(`/`) as a delimiter, which means, on Windows, legacy Windows delimiter(`\`) is not returned. However, you can still put the legacy style path as a argument or config field.

## 0.0.10

### Patch Changes

- [`add1591`](https://github.com/jjangga0214/haetae/commit/add15916fc532d644c6957d0c97d79feea406584) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** `compareEnvs` does not receive Promise as arguments from now on. It's also now a synchronous function.

- [`56a82ef`](https://github.com/jjangga0214/haetae/commit/56a82ef7f8398670c39176149212d07090109aa4) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Introduced `recordRemoval` option in config. This is yo automatically remove unnecessary records. `age` and/or `count` can be configured.

## 0.0.9

### Patch Changes

- [`301bfc3`](https://github.com/jjangga0214/haetae/commit/301bfc3dca164bcfdd9eca92105d6be3c9accdc4) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** Renamed `mapRecord` to `formRecord`. Renamed `MapRecordOptions` to `FormRecordOptions`.

- [`20a0449`](https://github.com/jjangga0214/haetae/commit/20a04496ef23ded57fe2d68beea2536dabc4669d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** `packageVersion` and `packageName` is removed in favor of new export `pkg`.

- [`bd6f33d`](https://github.com/jjangga0214/haetae/commit/bd6f33d7c066bc08912d3659c0607901acbb86ce) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Introduced `deleteStore`.

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
