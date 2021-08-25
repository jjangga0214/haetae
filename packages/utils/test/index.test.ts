import path from 'path'
import { glob } from '@haetae/utils'

describe('index', () => {
  it('glob', async () => {
    expect.hasAssertions()
    const rootDir = path.join(__dirname, '..', '..', '..', 'test-project')
    const res = await glob(['**/*.test.ts'], {
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
