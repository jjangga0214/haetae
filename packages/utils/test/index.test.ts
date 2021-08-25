import path from 'path'
import { loadByGlob } from '@haetae/utils'

describe('index', () => {
  it('loadByGlob', async () => {
    expect.hasAssertions()
    const rootDir = path.join(__dirname, '..', '..', '..', 'test-project')
    const res = await loadByGlob(['**/*.test.ts'], {
      rootDir,
    })

    expect(res).toStrictEqual([
      path.join(rootDir, 'pacakges', 'bar', 'test', 'unit', 'index.test.ts'),
      path.join(
        rootDir,
        'pacakges',
        'foo',
        'test',
        'integration',
        'index.test.ts',
      ),
      path.join(rootDir, 'pacakges', 'foo', 'test', 'unit', 'index.test.ts'),
    ])
  })
})
