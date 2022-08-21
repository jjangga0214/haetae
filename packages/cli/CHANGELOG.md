# @haetae/cli

## 0.0.13

### Patch Changes

- Updated dependencies [[`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492), [`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e)]:
  - @haetae/core@0.0.12

## 0.0.12

### Patch Changes

- Updated dependencies [[`c60afa9`](https://github.com/jjangga0214/haetae/commit/c60afa9c0f9c7809afcd0ee8682d41e0a8623673)]:
  - @haetae/core@0.0.11

## 0.0.11

### Patch Changes

- [`9a3f921`](https://github.com/jjangga0214/haetae/commit/9a3f921cbfa036e57169ecbb77b72872ab3a4b9f) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed an issue that versions of the packages `haetae` and `@haetae/*` are not printed when `-i` option is given.

- Updated dependencies [[`add1591`](https://github.com/jjangga0214/haetae/commit/add15916fc532d644c6957d0c97d79feea406584), [`56a82ef`](https://github.com/jjangga0214/haetae/commit/56a82ef7f8398670c39176149212d07090109aa4)]:
  - @haetae/core@0.0.10

## 0.0.10

### Patch Changes

- [`20a0449`](https://github.com/jjangga0214/haetae/commit/20a04496ef23ded57fe2d68beea2536dabc4669d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** `packageVersion` and `packageName` is removed in favor of new export `pkg`.

- Updated dependencies [[`301bfc3`](https://github.com/jjangga0214/haetae/commit/301bfc3dca164bcfdd9eca92105d6be3c9accdc4), [`20a0449`](https://github.com/jjangga0214/haetae/commit/20a04496ef23ded57fe2d68beea2536dabc4669d), [`bd6f33d`](https://github.com/jjangga0214/haetae/commit/bd6f33d7c066bc08912d3659c0607901acbb86ce)]:
  - @haetae/core@0.0.9

## 0.0.9

### Patch Changes

- [`25844d6`](https://github.com/jjangga0214/haetae/commit/25844d6aefe34c414b71aa34659d3351f6a4b8f4) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed rendering for single line value and some messages.

- Updated dependencies [[`f22727d`](https://github.com/jjangga0214/haetae/commit/f22727d146e9038246b546a33d350579eceee453)]:
  - @haetae/core@0.0.8

## 0.0.8

### Patch Changes

- [`9bcea20`](https://github.com/jjangga0214/haetae/commit/9bcea2009f933dface69a226909d2afa047d1a93) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Empty object(including array) and non-object literal are printed out properly when they are record data's env or data.

- [`22da759`](https://github.com/jjangga0214/haetae/commit/22da75948486b8ecb780b1d07f13426a82d91c87) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Timestamp in `time` field of record is now printed in human-friendly format.

- [`cce03e0`](https://github.com/jjangga0214/haetae/commit/cce03e03e1232b6bdcf49a8e424328c5a62158d9) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed `compareEnvs`, which compares two envs and determine if they are same env or not.

- [`b274857`](https://github.com/jjangga0214/haetae/commit/b27485728a5a6951623406cbb42fba0995e5ad3a) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Print store as human-friendly format.

## 0.0.7

### Patch Changes

- [`155eb39`](https://github.com/jjangga0214/haetae/commit/155eb390b4fb3181e9cc3fda8902e8c964cb48b4) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed pure esm deps issue. Now depending on commonjs deps.

## 0.0.6

### Patch Changes

- [`23eb1f3`](https://github.com/jjangga0214/haetae/commit/23eb1f3dad8e55e178c6375064b41b5a2e33fe6e) Thanks [@jjangga0214](https://github.com/jjangga0214)! - (BREAKING CHANGE) Moved `$HAETAE_CONFIG_FILE` handling from `@haetae/core` to `@haetae/cli`. From now on, `@haetae/core` does not detect `$HAETAE_CONFIG_FILE` automatically.

- [`e547e18`](https://github.com/jjangga0214/haetae/commit/e547e18f5c43da3df059b4467010a831656a32a7) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Added `-d` option for record data.

- [`08bdcea`](https://github.com/jjangga0214/haetae/commit/08bdceac128ac3d58fc281385bbbf12fe581084c) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Introduced `-i, --info` option.

- [`25f1137`](https://github.com/jjangga0214/haetae/commit/25f11379df752b0b1daee1c3d663665ffedcb59a) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Separate json and human-friendly output.

- [`30c11fd`](https://github.com/jjangga0214/haetae/commit/30c11fd0b542d656490317a5eaaf4c2330209944) Thanks [@jjangga0214](https://github.com/jjangga0214)! - When -c is not given and `$HAETAE_CONFIG_FILE` is also undefined, the cli finds 'haetae.config.json' file by walking up parent directories recursively.

- Updated dependencies [[`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a), [`23eb1f3`](https://github.com/jjangga0214/haetae/commit/23eb1f3dad8e55e178c6375064b41b5a2e33fe6e), [`afa12ee`](https://github.com/jjangga0214/haetae/commit/afa12eee27560856fa40754f9d04aaa3bf920c1d), [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990), [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990), [`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a)]:
  - @haetae/core@0.0.7

## 0.0.5

### Patch Changes

- [`3e7c141`](https://github.com/jjangga0214/haetae/commit/3e7c141e4fb2225d7ba7599210560ceb877c0216) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Now `-s` works.

- [`75a4eae`](https://github.com/jjangga0214/haetae/commit/75a4eae728877c48945c4fcf84936c2b81f2600d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed description of -c for default value resolution priority.

- [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Export `packageName` and `packageVersion`.

- Updated dependencies [[`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b), [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67), [`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b)]:
  - @haetae/core@0.0.6

## 0.0.4

### Patch Changes

- [`835e153`](https://github.com/jjangga0214/haetae/commit/835e153188c85f04a015b0cab619cfc4b4150b6d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Fixed assertion error thrown when option `-e` is not given without command.

- Updated dependencies [[`f90049f`](https://github.com/jjangga0214/haetae/commit/f90049f79d288815f9ee4122ded81a3df9191b23)]:
  - @haetae/core@0.0.5
