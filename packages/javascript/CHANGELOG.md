# @haetae/javascript

## 0.0.11

### Patch Changes

- [`815e80a`](https://github.com/jjangga0214/haetae/commit/815e80a563b2856895d0e1f44ce4ceacbb38b5dd) Thanks [@jjangga0214](https://github.com/jjangga0214)! - `VersionOptions` is renamed to `RootDirOption`. But this is not a breaking change, as it was not exported. From now on, `RootDirOption` is exported.

- Updated dependencies [[`559fa5a`](https://github.com/jjangga0214/haetae/commit/559fa5ac233a0bbea2b1e6ef58b91687a1b1a460), [`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492), [`930e0d5`](https://github.com/jjangga0214/haetae/commit/930e0d5f9516b4fdfa0ff76ee8a521ec0aabf492), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e), [`a862b02`](https://github.com/jjangga0214/haetae/commit/a862b02234f9743120439773c54a8cdfb42e3b2e)]:
  - @haetae/utils@0.0.12
  - @haetae/core@0.0.12

## 0.0.10

### Patch Changes

- Updated dependencies [[`c954f61`](https://github.com/jjangga0214/haetae/commit/c954f6193024a4c3f9a2a251ab67bc07aa7d2aa8)]:
  - @haetae/utils@0.0.11

## 0.0.9

### Patch Changes

- [`37e5302`](https://github.com/jjangga0214/haetae/commit/37e53028b10ae712e1ef0890f7f8dfdff94cff76) Thanks [@jjangga0214](https://github.com/jjangga0214)! - A new function `version` is added.
  If you depend on a certain package, and you want to get its exact version, the new function would help you.
  For example, you can specify version of a dep in `env`, like the below example.

  **example:**

  ```js
  {
    env: async () => ({
      // This would make sure when eslint version
      eslint: (await version('eslint')).major,
    })
  }
  ```

* [`37e5302`](https://github.com/jjangga0214/haetae/commit/37e53028b10ae712e1ef0890f7f8dfdff94cff76) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** `toIndexedDependencyRelationships` is moved from `@haetae/javascript` to `@haetae/utils` and renamed to `graph`. `@haetae/javascript`'s `dependsOn` now takes `additionalGraph`, not `relationships`.

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

* Updated dependencies [[`c60afa9`](https://github.com/jjangga0214/haetae/commit/c60afa9c0f9c7809afcd0ee8682d41e0a8623673), [`37e5302`](https://github.com/jjangga0214/haetae/commit/37e53028b10ae712e1ef0890f7f8dfdff94cff76)]:
  - @haetae/core@0.0.11
  - @haetae/utils@0.0.10

## 0.0.8

### Patch Changes

- Updated dependencies [[`add1591`](https://github.com/jjangga0214/haetae/commit/add15916fc532d644c6957d0c97d79feea406584), [`56a82ef`](https://github.com/jjangga0214/haetae/commit/56a82ef7f8398670c39176149212d07090109aa4)]:
  - @haetae/core@0.0.10

## 0.0.7

### Patch Changes

- [`20a0449`](https://github.com/jjangga0214/haetae/commit/20a04496ef23ded57fe2d68beea2536dabc4669d) Thanks [@jjangga0214](https://github.com/jjangga0214)! - **BREAKING CHANGE** `packageVersion` and `packageName` is removed in favor of new export `pkg`.

- Updated dependencies [[`301bfc3`](https://github.com/jjangga0214/haetae/commit/301bfc3dca164bcfdd9eca92105d6be3c9accdc4), [`20a0449`](https://github.com/jjangga0214/haetae/commit/20a04496ef23ded57fe2d68beea2536dabc4669d), [`bd6f33d`](https://github.com/jjangga0214/haetae/commit/bd6f33d7c066bc08912d3659c0607901acbb86ce)]:
  - @haetae/core@0.0.9

## 0.0.6

### Patch Changes

- [`cf4e360`](https://github.com/jjangga0214/haetae/commit/cf4e3608b91d95e8c0c8062ded80e2d208ca0ef3) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Now you can specify dependency relationships manually to `dependsOn`.

- Updated dependencies [[`f22727d`](https://github.com/jjangga0214/haetae/commit/f22727d146e9038246b546a33d350579eceee453)]:
  - @haetae/core@0.0.8

## 0.0.5

### Patch Changes

- Updated dependencies [[`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a), [`23eb1f3`](https://github.com/jjangga0214/haetae/commit/23eb1f3dad8e55e178c6375064b41b5a2e33fe6e), [`afa12ee`](https://github.com/jjangga0214/haetae/commit/afa12eee27560856fa40754f9d04aaa3bf920c1d), [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990), [`1b325c1`](https://github.com/jjangga0214/haetae/commit/1b325c1e5de124fbbd09cd3910cf77b30164f990), [`b1a4a86`](https://github.com/jjangga0214/haetae/commit/b1a4a86bc725fb3f3e5ba71cb7422455e272cf2a)]:
  - @haetae/core@0.0.7

## 0.0.4

### Patch Changes

- [`1066512`](https://github.com/jjangga0214/haetae/commit/1066512bd353a517d5f57d25b72b65d7be80720e) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Changed `dependsOn` to sync(non-async) function.

- [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Move `@haetae/*` from dependencies to peerDependencies.

- [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67) Thanks [@jjangga0214](https://github.com/jjangga0214)! - Export `packageName` and `packageVersion`.

- Updated dependencies [[`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b), [`2519c75`](https://github.com/jjangga0214/haetae/commit/2519c75646778e9f882755f7185bb737ae589b67), [`18cc10f`](https://github.com/jjangga0214/haetae/commit/18cc10fe6504e2ba7c13c40e78237bbe20abc07b)]:
  - @haetae/core@0.0.6

## 0.0.3

### Patch Changes

- Updated dependencies [[`f90049f`](https://github.com/jjangga0214/haetae/commit/f90049f79d288815f9ee4122ded81a3df9191b23)]:
  - @haetae/core@0.0.5
