import path from 'path'
import { dependsOn } from '#utils'

describe('index', () => {
  it('dependsOn', async () => {
    expect.hasAssertions()
    const rootDir = path.join(__dirname, '..', '..', '..', 'test-project')
    const predicate = await dependsOn(
      [path.join(rootDir, 'packages', 'bar', 'src', 'index.ts')],
      {
        rootDir,
      },
    )

    const foo = predicate(
      path.join(rootDir, 'packages', 'foo', 'test', 'unit', 'index.test.ts'),
    )

    expect(foo).toStrictEqual(false)

    const bar = predicate(
      path.join(rootDir, 'packages', 'bar', 'test', 'unit', 'index.test.ts'),
    )
    expect(bar).toStrictEqual(true)
  })
})
