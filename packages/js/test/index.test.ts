import upath from 'upath'
import { dirname } from 'dirname-filename-esm'
import * as utils from '@haetae/utils'
import { dependsOn, graph } from '../src/index.js'

// TODO: add tests for other various environments
const rootDir = upath.join(dirname(import.meta), '../../../test-project')

/*
 Actually, test for `graph()` is not so much necessary because the function `dependsOn()` rely on `graph()`,
 and test of `dependsOn()` does through test.
 */
describe('graph', () => {
  test('basic usage', async () => {
    const result = await graph({
      entrypoint: 'packages/foo/src/index.ts',
      rootDir,
    })
    expect(result).toStrictEqual({
      [`${rootDir}/packages/foo/src/index.ts`]: new Set([
        `${rootDir}/packages/foo/src/hello.ts`,
      ]),
      [`${rootDir}/packages/foo/src/hello.ts`]: new Set([]),
    })
  })
  test('circular dependencies', async () => {
    const result = await graph({
      entrypoint: 'packages/bar/src/a.ts',
      rootDir,
    })
    expect(result).toStrictEqual({
      [`${rootDir}/packages/bar/src/a.ts`]: new Set([
        `${rootDir}/packages/bar/src/b.ts`,
      ]),
      [`${rootDir}/packages/bar/src/b.ts`]: new Set([
        `${rootDir}/packages/bar/src/c.ts`,
      ]),
      [`${rootDir}/packages/bar/src/c.ts`]: new Set([
        `${rootDir}/packages/bar/src/a.ts`,
      ]),
    })
  })
  // TODO: uncomment this test once `path mapping` is resolved by PR: https://github.com/dependents/node-dependency-tree/pull/138
  // eslint-disable-next-line jest/no-commented-out-tests
  // test('against test file', async () => {
  //   const result = await graph({
  //     entrypoint: 'packages/bar/test/unit/index.test.ts',
  //     rootDir,
  //   })
  //   expect(result).toStrictEqual({
  //     [`${rootDir}/packages/bar/test/unit/index.test.ts`]: new Set([
  //       `${rootDir}/packages/bar/src/index.ts`,
  //     ]),
  //     [`${rootDir}/packages/bar/src/index.ts`]: new Set([
  //       `${rootDir}/packages/foo/src/index.ts`,
  //     ]),
  //     [`${rootDir}/packages/foo/src/index.ts`]: new Set([
  //       `${rootDir}/packages/foo/src/hello.ts`,
  //     ]),
  //     [`${rootDir}/packages/foo/src/hello.ts`]: new Set([]),
  //   })
  // })
  test('non-existent file', async () => {
    const result = await graph({
      entrypoint: 'packages/bar/src/non-existent.ts',
      rootDir,
    })
    expect(result).toStrictEqual({})
  })
})

describe('dependsOn', () => {
  // TODO: uncomment this test once `path mapping` is resolved by PR: https://github.com/dependents/node-dependency-tree/pull/138
  // eslint-disable-next-line jest/no-commented-out-tests
  // test('through typescript path mapping', async () => {
  //   await expect(
  //     dependsOn({
  //       rootDir,
  //       dependent: 'packages/bar/test/index.test.ts',
  //       dependencies: ['packages/bar/src/index.ts'],
  //     }),
  //   ).resolves.toBe(true)
  // })

  test('from a same package', async () => {
    await expect(
      dependsOn({
        rootDir,
        dependent: 'packages/foo/src/index.ts',
        dependencies: ['packages/foo/src/hello.ts'],
      }),
    ).resolves.toBe(true)

    await expect(
      /*
       * `foo/test/integration/index.test.ts` file does not use path mapping,
       * unlike `foo/test/unit/index.test.ts`.
       */
      dependsOn({
        rootDir,
        dependent: 'packages/foo/test/integration/index.test.ts',
        dependencies: ['packages/foo/src/hello.ts'],
      }),
    ).resolves.toBe(true)
  })

  test('from a different package', async () => {
    await expect(
      dependsOn({
        rootDir,
        dependent: 'packages/foo/src/index.ts',
        dependencies: ['packages/bar/src/index.ts'],
      }),
    ).resolves.toBe(false)

    // TODO: uncomment these expectation once `path mapping` is resolved by PR: https://github.com/dependents/node-dependency-tree/pull/138
    // await expect(
    //   dependsOn({
    //     rootDir,
    //     dependent: 'packages/bar/src/index.ts',
    //     dependencies: ['packages/foo/src/hello.ts'],
    //   }),
    // ).resolves.toBe(true)
    // await expect(
    //   dependsOn({
    //     rootDir,
    //     dependent: 'packages/bar/test/unit/index.test.ts',
    //     dependencies: ['packages/foo/src/hello.ts'],
    //   }),
    // ).resolves.toBe(true)
  })

  test('itself', async () => {
    await expect(
      dependsOn({
        rootDir,
        dependent: 'packages/bar/src/index.ts',
        dependencies: ['packages/bar/src/index.ts'],
      }),
    ).resolves.toBe(true)
  })

  test('from a non-existent path', async () => {
    await expect(
      dependsOn({
        rootDir,
        dependent: 'path/to/non-existent.ts',
        dependencies: ['packages/foo/src/hello.ts'],
      }),
    ).resolves.toBe(false)
  })

  test('circular dependencies', async () => {
    await expect(
      dependsOn({
        rootDir,
        dependent: 'packages/bar/src/a.ts',
        dependencies: ['packages/bar/src/c.ts'],
      }),
    ).resolves.toBe(true)
    await expect(
      dependsOn({
        rootDir,
        dependent: 'packages/bar/src/a.ts',
        dependencies: ['packages/bar/src/b.ts'],
      }),
    ).resolves.toBe(true)
  })

  test('with additional dependencies', async () => {
    const additionalGraph = await utils.graph({
      rootDir,
      edges: [
        {
          dependents: ['a'],
          dependencies: ['b'],
        },
        {
          dependents: ['c'],
          dependencies: ['a'],
        },
        {
          dependents: ['f'],
          dependencies: ['another', 'another2'],
        },
      ],
      glob: false,
    })

    const dependencies = ['f', 'b']

    await expect(
      dependsOn({
        dependent: 'a',
        dependencies,
        rootDir,
        additionalGraph,
      }),
    ).resolves.toBe(true)

    await expect(
      dependsOn({
        dependent: 'c',
        dependencies,
        rootDir,
        additionalGraph,
      }),
    ).resolves.toBe(true)

    await expect(
      dependsOn({
        dependent: 'e',
        dependencies,
        rootDir,
        additionalGraph,
      }),
    ).resolves.toBe(false)

    await expect(
      dependsOn({
        rootDir,
        dependent: 'f',
        dependencies,
        additionalGraph,
      }),
    ).resolves.toBe(true)
  })
})
