# @haetae/utils

## 0.0.12

### Patch Changes

- [`559fa5a`](https://github.com/jjangga0214/haetae/commit/559fa5ac233a0bbea2b1e6ef58b91687a1b1a460) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: `hashFiles` and `HashFilesOptions` are renamed to `hash` and `HashOptions`.

- Updated dependencies [[`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492), [`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e)]:
  - @haetae/core@0.0.12

## 0.0.11

### Patch Changes

- [`c954f61`](https://github.com/jjangga0214/haetae/commit/c954f6193024a4c3f9a2a251ab67bc07aa7d2aa8) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE**: Rename to `Edge` to `DepsEdge` and `Graph` to `DepsGraph`.

## 0.0.10

### Patch Changes

- [`37e5302`](https://github.com/jjangga0214/haetae/commit/37e53028b10ae712e1ef0890f7f8dfdff94cff76) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** `toIndexedDependencyRelationships` is moved from `@haetae/javascript` to `@haetae/utils` and renamed to `graph`. `@haetae/javascript`'s `dependsOn` now takes `additionalGraph`, not `relationships`.

  **example:**

  ```js
  js.dependsOn(['foo.ts', 'bar.ts'], {
    additionalGraph: utils.graph({
      edges: [
        // specify your additional dependency graph
      ],
    }),
  })
  ```

- Updated dependencies [[`c60afa9`](https://github.com/jjangga0214/haetae/commit/c60afa9c0f9c7809afcd0ee8682d41e0a8623673)]:
  - @haetae/core@0.0.11

## 0.0.9

### Patch Changes

- Updated dependencies [[`add1591`](https://github.com/jjangga0214/haetae/commit/add15916fc532d644c6957d0c97d79feea406584), [`56a82ef`](https://github.com/jjangga0214/haetae/commit/56a82ef7f8398670c39176149212d07090109aa4)]:
  - @haetae/core@0.0.10

## 0.0.8

### Patch Changes

- [`20a0449`](https://github.com/jjangga0214/haetae/commit/20a04496ef23ded57fe2d68beea2536dabc4669d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** `packageVersion` and `packageName` is removed in favor of new export `pkg`.

- Updated dependencies [[`301bfc3`](https://github.com/jjangga0214/haetae/commit/301bfc3dca164bcfdd9eca92105d6be3c9accdc4), [`20a0449`](https://github.com/jjangga0214/haetae/commit/20a04496ef23ded57fe2d68beea2536dabc4669d), [`bd6f33d`](https://github.com/jjangga0214/haetae/commit/bd6f33d7c066bc08912d3659c0607901acbb86ce)]:
  - @haetae/core@0.0.9

## 0.0.7

### Patch Changes

- Updated dependencies [[`f22727d`](https://github.com/jjangga0214/haetae/commit/f22727d146e9038246b546a33d350579eceee453)]:
  - @haetae/core@0.0.8

## 0.0.6

### Patch Changes

- Updated dependencies [[`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a), [`23eb1f3`](https://github.com/jjangga0214/haetae/commit/23eb1f3dad8e55e178c6375064b41b5a2e33fe6e), [`afa12ee`](https://github.com/jjangga0214/haetae/commit/afa12eee27560856fa40754f9d04aaa3bf920c1d), [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990), [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990), [`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a)]:
  - @haetae/core@0.0.7

## 0.0.5

### Patch Changes

- [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Move `@haetae/*` from dependencies to peerDependencies.

- [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Export `packageName` and `packageVersion`.

- Updated dependencies [[`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b), [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67), [`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b)]:
  - @haetae/core@0.0.6

## 0.0.4

### Patch Changes

- [`3cb398b`](https://github.com/jjangga0214/haetae/commit/3cb398b2a20103106240677fd77da30fbc0bd290) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Removed `preConfiguredPatterns` option from `GlobOptions`.

- Updated dependencies [[`f90049f`](https://github.com/jjangga0214/haetae/commit/f90049f79d288815f9ee4122ded81a3df9191b23)]:
  - @haetae/core@0.0.5
