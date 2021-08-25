import path from 'path'
import { dependsOn } from '#javascript'

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

    const fooResult = predicate(
      path.join(rootDir, 'packages', 'foo', 'test', 'unit', 'index.test.ts'),
    )

    expect(fooResult).toStrictEqual(false)

    const barResult = predicate(
      path.join(rootDir, 'packages', 'bar', 'test', 'unit', 'index.test.ts'),
    )
    expect(barResult).toStrictEqual(true)
  })
})
