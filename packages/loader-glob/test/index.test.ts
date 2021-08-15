import path from 'path'
import { loadByGlob } from '#loader-glob'

describe('index', () => {
  it('loadByGlob', async () => {
    expect.hasAssertions()
    const rootDir = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'test-project',
      'packages',
    )
    const res = await loadByGlob(['**/*.test.ts'], {
      rootDir,
    })

    expect(res).toStrictEqual([
      path.join(rootDir, 'bar', 'test', 'unit', 'index.test.ts'),
      path.join(rootDir, 'foo', 'test', 'integration', 'index.test.ts'),
      path.join(rootDir, 'foo', 'test', 'unit', 'index.test.ts'),
    ])
  })
})
