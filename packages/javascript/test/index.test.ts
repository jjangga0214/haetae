import upath from 'upath'
import { dependsOn, graph, version } from '@haetae/javascript'

describe('dependsOn', () => {
  // TODO: add tests for other various environments
  const rootDir = upath.join(__dirname, '../../../test-project')
  const dependOnBarIndex = dependsOn(
    [upath.join(rootDir, 'packages/bar/src/index.ts')],
    {
      rootDir,
    },
  )
  const dependOnFooHello = dependsOn(
    [upath.join(rootDir, 'packages/foo/src/hello.ts')],
    {
      rootDir,
    },
  )
  // TODO: uncomment this test once `path mapping` is resolved by PR: https://github.com/dependents/node-dependency-tree/pull/138
  // eslint-disable-next-line jest/no-commented-out-tests
  // test('through typescript path mapping', async () => {
  //   expect(
  //     dependOnBarIndex(
  //       upath.join(rootDir, 'packages/bar/test/index.test.ts'),
  //     ),
  //   ).toBe(true)
  // })

  test('from a same package', async () => {
    expect(
      dependOnFooHello(upath.join(rootDir, 'packages/foo/src/index.ts')),
    ).toBe(true)

    expect(
      dependOnFooHello(
        /**
         * `foo/test/integration/index.test.ts` file does not use path mapping,
         * unlike `foo/test/unit/index.test.ts`.
         */
        upath.join(rootDir, 'packages/foo/test/integration/index.test.ts'),
      ),
    ).toBe(true)
  })

  test('from a different package', async () => {
    expect(
      dependOnBarIndex(upath.join(rootDir, 'packages/foo/src/index.ts')),
    ).toBe(false)
    // TODO: uncomment these expectation once `path mapping` is resolved by PR: https://github.com/dependents/node-dependency-tree/pull/138
    // expect(
    //   dependOnFooHello(upath.join(rootDir, 'packages/bar/src/index.ts')),
    // ).toBe(true)
    // expect(
    //   dependOnFooHello(
    //     upath.join(rootDir, 'packages/bar/test/unit/index.test.ts'),
    //   ),
    // ).toBe(true)
  })

  test('itself', async () => {
    expect(
      dependOnBarIndex(upath.join(rootDir, 'packages/bar/src/index.ts')),
    ).toBe(true)
  })

  test('from a non-existent path', async () => {
    expect(
      dependOnFooHello(upath.join(rootDir, 'path/to/non-existent.ts')),
    ).toBe(false)
  })
})

describe('graph', () => {
  test('basic usage', () => {
    const result = graph({
      rootDir: '<rootDir>',
      edges: [
        {
          dependents: ['path/to/foo.ts'],
          dependencies: ['path/to/bar.ts', 'path/to/baz.ts'],
        },
      ],
    })

    expect(result).toStrictEqual({
      '<rootDir>/path/to/foo.ts': new Set([
        '<rootDir>/path/to/bar.ts',
        '<rootDir>/path/to/baz.ts',
      ]),
    })
  })

  test('advanced usage', () => {
    const result = graph({
      rootDir: '<rootDir>',
      edges: [
        {
          dependents: ['path/to/foo.ts', 'path/to/foo2.ts'],
          dependencies: ['path/to/bar.ts', 'path/to/baz.ts'],
        },
        {
          dependents: ['path/to/foo2.ts', 'path/to/foo3.ts'],
          dependencies: ['path/to/bar2.ts', 'path/to/baz2.ts'],
        },
      ],
    })
    expect(result).toStrictEqual({
      '<rootDir>/path/to/foo.ts': new Set([
        '<rootDir>/path/to/bar.ts',
        '<rootDir>/path/to/baz.ts',
      ]),
      '<rootDir>/path/to/foo2.ts': new Set([
        '<rootDir>/path/to/bar.ts',
        '<rootDir>/path/to/baz.ts',
        '<rootDir>/path/to/bar2.ts',
        '<rootDir>/path/to/baz2.ts',
      ]),
      '<rootDir>/path/to/foo3.ts': new Set([
        '<rootDir>/path/to/bar2.ts',
        '<rootDir>/path/to/baz2.ts',
      ]),
    })
  })
})

describe('version', () => {
  // TODO: add yarn berry test
  test('basic usage', async () => {
    const versionInfo = await version('semver', { rootDir: __dirname })
    expect(versionInfo.major).toBe(7)
  })
})
