import upath from 'upath'
import { glob } from '@haetae/utils'

describe('index', () => {
  test('glob', async () => {
    expect.hasAssertions()
    const rootDir = upath.resolve(__dirname, '../../../test-project')
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
})
