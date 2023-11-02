import upath from 'upath'
import { dirname } from 'dirname-filename-esm'
import { glob } from '../src/utils.js'

describe('glob', () => {
  test('basic usage', async () => {
    const rootDir = upath.resolve(dirname(import.meta), '../../../test-project')
    const res = await glob(['**/*.test.ts'], {
      rootDir,
    })

    expect(res).toStrictEqual(
      expect.arrayContaining([
        upath.resolve(rootDir, 'packages/bar/test/unit/index.test.ts'),
        upath.resolve(rootDir, 'packages/foo/test/integration/index.test.ts'),
        upath.resolve(rootDir, 'packages/foo/test/unit/index.test.ts'),
      ]),
    )
    expect(res).toHaveLength(3)
  })

  test('walk up over the rootDir', async () => {
    const rootDir = dirname(import.meta)
    await expect(
      glob(['../package.json'], {
        rootDir,
      }),
    ).resolves.toStrictEqual([upath.resolve(rootDir, '../package.json')])

    const res = await glob(['../*.json'], {
      rootDir,
    })

    expect(res).toStrictEqual(
      expect.arrayContaining([
        upath.resolve(rootDir, '../package.json'),
        upath.resolve(rootDir, '../tsconfig.json'),
        upath.resolve(rootDir, '../tsconfig.build.json'),
      ]),
    )
    expect(res).toHaveLength(3)
  })

  test('non-existent file is not included in the result', async () => {
    const rootDir = dirname(import.meta)

    await expect(
      // non-existent
      glob(['../non-existent', 'non-existent'], {
        rootDir,
      }),
    ).resolves.toStrictEqual([])
  })
})
