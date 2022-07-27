import upath from 'upath'
import { dependsOn } from '@haetae/javascript'

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
