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
  test('basic usage', () => {
    const result = graph({
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
  test('circular dependencies', () => {
    const result = graph({
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
  // test('against test file', () => {
  //   const result = graph({
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
  test('non-existent file', () => {
    const result = graph({
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
  //   expect(
  //     dependsOn({
  //       rootDir,
  //       dependent: 'packages/bar/test/index.test.ts',
  //       dependencies: ['packages/bar/src/index.ts'],
  //     }),
  //   ).toBe(true)
  // })

  test('from a same package', async () => {
    expect(
      dependsOn({
        rootDir,
        dependent: 'packages/foo/src/index.ts',
        dependencies: ['packages/foo/src/hello.ts'],
      }),
    ).toBe(true)

    expect(
      /*
       * `foo/test/integration/index.test.ts` file does not use path mapping,
       * unlike `foo/test/unit/index.test.ts`.
       */
      dependsOn({
        rootDir,
        dependent: 'packages/foo/test/integration/index.test.ts',
        dependencies: ['packages/foo/src/hello.ts'],
      }),
    ).toBe(true)
  })

  test('from a different package', async () => {
    expect(
      dependsOn({
        rootDir,
        dependent: 'packages/foo/src/index.ts',
        dependencies: ['packages/bar/src/index.ts'],
      }),
    ).toBe(false)

    // TODO: uncomment these expectation once `path mapping` is resolved by PR: https://github.com/dependents/node-dependency-tree/pull/138
    // expect(
    //   dependsOn({
    //     rootDir,
    //     dependent: 'packages/bar/src/index.ts',
    //     dependencies: ['packages/foo/src/hello.ts'],
    //   }),
    // ).toBe(true)
    // expect(
    //   dependsOn({
    //     rootDir,
    //     dependent: 'packages/bar/test/unit/index.test.ts',
    //     dependencies: ['packages/foo/src/hello.ts'],
    //   }),
    // ).toBe(true)
  })

  test('itself', async () => {
    expect(
      dependsOn({
        rootDir,
        dependent: 'packages/bar/src/index.ts',
        dependencies: ['packages/bar/src/index.ts'],
      }),
    ).toBe(true)
  })

  test('from a non-existent path', async () => {
    expect(
      dependsOn({
        rootDir,
        dependent: 'path/to/non-existent.ts',
        dependencies: ['packages/foo/src/hello.ts'],
      }),
    ).toBe(false)
  })

  test('circular dependencies', () => {
    expect(
      dependsOn({
        rootDir,
        dependent: 'packages/bar/src/a.ts',
        dependencies: ['packages/bar/src/c.ts'],
      }),
    ).toBe(true)
    expect(
      dependsOn({
        rootDir,
        dependent: 'packages/bar/src/a.ts',
        dependencies: ['packages/bar/src/b.ts'],
      }),
    ).toBe(true)
  })

  test('with additional dependencies', async () => {
    const additionalGraph = utils.graph({
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
    })

    const dependencies = ['f', 'b']

    expect(
      dependsOn({
        rootDir,
        dependent: 'a',
        dependencies,
        additionalGraph,
      }),
    ).toBe(true)

    expect(
      dependsOn({
        rootDir,
        dependent: 'c',
        dependencies,
        additionalGraph,
      }),
    ).toBe(true)

    expect(
      dependsOn({
        rootDir,
        dependent: 'e',
        dependencies,
        additionalGraph,
      }),
    ).toBe(false)

    expect(
      dependsOn({
        rootDir,
        dependent: 'f',
        dependencies,
        additionalGraph,
      }),
    ).toBe(true)
  })
})
