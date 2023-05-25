import upath from 'upath'
import * as utils from '@haetae/utils'
import { dirname } from 'dirname-filename-esm'
import { dependsOn } from '../src/index.js'

describe('dependsOn', () => {
  // TODO: add tests for other various environments
  const rootDir = upath.join(dirname(import.meta), '../../../test-project')

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
