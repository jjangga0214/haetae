# @haetae/git

## 0.0.13

### Patch Changes

- [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: The packages become [Pure ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

- [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `GitHaetaeRecordData` is renamed to `RecordData`.

- [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `fallback` is removed from `changedFilesOption`, and behavior of `changedFiles` has changed.

- [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `GetRecordsOptions`, `CommandFromConfig`, `FormRecordOptions`, `AddRecordOptions`, and `SaveStoreOptions` do not receive `PromiseOr` anymore.

- Updated dependencies [[`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d), [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d), [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d), [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d), [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d), [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d), [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d), [`361bc96`](https://github.com/jjangga0214/haetae/commit/361bc964cafe6360322f148b50bc844ed302963d)]:
  - @haetae/common@0.0.3
  - @haetae/core@0.0.14
  - @haetae/utils@0.0.14

## 0.0.12

### Patch Changes

- [`fd28e06`](https://github.com/jjangga0214/haetae/commit/fd28e06cad4cfe92cd8986495431ddac6cab2d20) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `RootDirOption` is removed in favor of `InstalledOptions`, `InitializedOptions`, `BranchOptions`, `CommitOptions`, `UntrackedFilesOptions` and `IgnoredFilesOptions`.

* [`a7d451b`](https://github.com/jjangga0214/haetae/commit/a7d451b4cebf9320ae436f5ed86048253594cce4) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `changedFiles` is memoized from now on.

- [`a7d451b`](https://github.com/jjangga0214/haetae/commit/a7d451b4cebf9320ae436f5ed86048253594cce4) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: For every functions, when the argument or an option `rootDir` is given as relative path, `getConfigDirname()` of `@haetae/core` is joined with the `rootDir`.

- Updated dependencies [[`b84cebe`](https://github.com/jjangga0214/haetae/commit/b84cebe811e93bdc7c8f626f3f54168dd402cbf7), [`b84cebe`](https://github.com/jjangga0214/haetae/commit/b84cebe811e93bdc7c8f626f3f54168dd402cbf7), [`32687c8`](https://github.com/jjangga0214/haetae/commit/32687c8712554934846422f6422b7409670e024c), [`b026892`](https://github.com/jjangga0214/haetae/commit/b026892d1400203f62698868a505237ef3b36a0d), [`a9a3308`](https://github.com/jjangga0214/haetae/commit/a9a3308a5ac6f75c8c1d2ccda6546cc6fcd8166a), [`cd79307`](https://github.com/jjangga0214/haetae/commit/cd7930752fa9dea342cb4d55e3651feb5eb6b9e2), [`cd79307`](https://github.com/jjangga0214/haetae/commit/cd7930752fa9dea342cb4d55e3651feb5eb6b9e2)]:
  - @haetae/common@0.0.2
  - @haetae/core@0.0.13
  - @haetae/utils@0.0.13

## 0.0.11

### Patch Changes

- [`ba750e8`](https://github.com/jjangga0214/haetae/commit/ba750e8925da34627567a8ce16fce08ee8bf66e1) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Export a new function `commit`.

* [`ba750e8`](https://github.com/jjangga0214/haetae/commit/ba750e8925da34627567a8ce16fce08ee8bf66e1) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** : rename `BranchOptions` to `RootDirOption`

- [`8f5a8fe`](https://github.com/jjangga0214/haetae/commit/8f5a8fe85258feca9ccc9a07b5dc1ac54935dc7b) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed `RecordOptions` to `RecordDataOptions`. This rename has to be done before, but missed.

* [`8f5a8fe`](https://github.com/jjangga0214/haetae/commit/8f5a8fe85258feca9ccc9a07b5dc1ac54935dc7b) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: From now on, for `changedFiles`, when `option.from` is awaited (`Promise`) to be `undefined`, and `options.to` is string or awaited to be string, the result would include all of the tracked files that have been committed until `options.to`. Previosly, `options.fallback` was called, but it's not invoked anymore for that case. From now on, `options.fallback` is called when `options.to` is resolved to be `undefined`.

- [`6b34192`](https://github.com/jjangga0214/haetae/commit/6b34192cb24a5070052ea687d4503561c19438f2) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `isInstalled` and `isInitialized` are renamed to `installed` and `initialized`.

* [`db0df01`](https://github.com/jjangga0214/haetae/commit/db0df015ba943771da7bb0cb0c8281d5b5e319ca) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Introduced new functions `untrackedFiles` and `ignoredFiles`.

- [`db0df01`](https://github.com/jjangga0214/haetae/commit/db0df015ba943771da7bb0cb0c8281d5b5e319ca) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed an issue that, for `changedFiles`, `options.includeIgnored` is ignored when `options.includeUntracked` is `false`. From now on, `options.includeIgnored` and `options.includeUntracked` are independent.

- Updated dependencies [[`559fa5a`](https://github.com/jjangga0214/haetae/commit/559fa5ac233a0bbea2b1e6ef58b91687a1b1a460), [`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492), [`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e)]:
  - @haetae/utils@0.0.12
  - @haetae/core@0.0.12

## 0.0.10

### Patch Changes

- Updated dependencies [[`c954f61`](https://github.com/jjangga0214/haetae/commit/c954f6193024a4c3f9a2a251ab67bc07aa7d2aa8)]:
  - @haetae/utils@0.0.11

## 0.0.9

### Patch Changes

- [`cba20c9`](https://github.com/jjangga0214/haetae/commit/cba20c9a859fe6ba1413f30ed236efe0d9fcc7d0) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `changedFiles` returns file paths with slash(`/`) as a delimiter, which means, on Windows, legacy Windows delimiter(`\`) is not returned.

- Updated dependencies [[`c60afa9`](https://github.com/jjangga0214/haetae/commit/c60afa9c0f9c7809afcd0ee8682d41e0a8623673), [`37e5302`](https://github.com/jjangga0214/haetae/commit/37e53028b10ae712e1ef0890f7f8dfdff94cff76)]:
  - @haetae/core@0.0.11
  - @haetae/utils@0.0.10

## 0.0.8

### Patch Changes

- Updated dependencies [[`add1591`](https://github.com/jjangga0214/haetae/commit/add15916fc532d644c6957d0c97d79feea406584), [`56a82ef`](https://github.com/jjangga0214/haetae/commit/56a82ef7f8398670c39176149212d07090109aa4)]:
  - @haetae/core@0.0.10
  - @haetae/utils@0.0.9

## 0.0.7

### Patch Changes

- [`20a0449`](https://github.com/jjangga0214/haetae/commit/20a04496ef23ded57fe2d68beea2536dabc4669d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** `packageVersion` and `packageName` is removed in favor of new export `pkg`.

- Updated dependencies [[`301bfc3`](https://github.com/jjangga0214/haetae/commit/301bfc3dca164bcfdd9eca92105d6be3c9accdc4), [`20a0449`](https://github.com/jjangga0214/haetae/commit/20a04496ef23ded57fe2d68beea2536dabc4669d), [`bd6f33d`](https://github.com/jjangga0214/haetae/commit/bd6f33d7c066bc08912d3659c0607901acbb86ce)]:
  - @haetae/core@0.0.9
  - @haetae/utils@0.0.8

## 0.0.6

### Patch Changes

- [`55331d9`](https://github.com/jjangga0214/haetae/commit/55331d96b263482f044e4679270953c318dfb088) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Include branch name in record data.

- Updated dependencies [[`f22727d`](https://github.com/jjangga0214/haetae/commit/f22727d146e9038246b546a33d350579eceee453)]:
  - @haetae/core@0.0.8
  - @haetae/utils@0.0.7

## 0.0.5

### Patch Changes

- [`15f0098`](https://github.com/jjangga0214/haetae/commit/15f0098f983a9fbfc5805153e32b97407367741e) Thanks [@jjangga0214](https://github.com/jjangga0214)! - (BREAKING CHANGE) Removed `$HAETAE_GIT_COMMIT` and `HAETAE_GIT_GITSHA`.

- Updated dependencies [[`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a), [`23eb1f3`](https://github.com/jjangga0214/haetae/commit/23eb1f3dad8e55e178c6375064b41b5a2e33fe6e), [`afa12ee`](https://github.com/jjangga0214/haetae/commit/afa12eee27560856fa40754f9d04aaa3bf920c1d), [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990), [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990), [`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a)]:
  - @haetae/core@0.0.7
  - @haetae/utils@0.0.6

## 0.0.4

### Patch Changes

- [`28b7e9a`](https://github.com/jjangga0214/haetae/commit/28b7e9acee17f478c83b425fcffd70f3d6e49f96) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Featured new functions `isInstalled` and `isInitialized`.
  And `changedFiles` handles situations for when git is not installed or initialized.

- [`1066512`](https://github.com/jjangga0214/haetae/commit/1066512bd353a517d5f57d25b72b65d7be80720e) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Refactored options.

- [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Move `@haetae/*` from dependencies to peerDependencies.

- [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Export `packageName` and `packageVersion`.

- [`28b7e9a`](https://github.com/jjangga0214/haetae/commit/28b7e9acee17f478c83b425fcffd70f3d6e49f96) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Changed options of `changedFiles` and `record`.

- Updated dependencies [[`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b), [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67), [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67), [`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b)]:
  - @haetae/core@0.0.6
  - @haetae/utils@0.0.5

## 0.0.3

### Patch Changes

- Updated dependencies [[`f90049f`](https://github.com/jjangga0214/haetae/commit/f90049f79d288815f9ee4122ded81a3df9191b23), [`3cb398b`](https://github.com/jjangga0214/haetae/commit/3cb398b2a20103106240677fd77da30fbc0bd290)]:
  - @haetae/core@0.0.5
  - @haetae/utils@0.0.4
