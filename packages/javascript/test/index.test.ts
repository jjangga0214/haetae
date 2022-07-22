import path from 'path'
import { toIndexedDependencyRelationships, dependsOn } from '@haetae/javascript'

function p(posixPath: string) {
  return path.join(...posixPath.split('/'))
}

describe('index', () => {
  describe('dependsOn', () => {
    test('basic usage', async () => {
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

      expect(fooResult).toBe(false)

      const barResult = predicate(
        path.join(rootDir, 'packages', 'bar', 'test', 'unit', 'index.test.ts'),
      )
      expect(barResult).toBe(true)
    })
  })

  describe('toIndexedDependencyRelationships', () => {
    test('basic usage', () => {
      const result = toIndexedDependencyRelationships({
        rootDir: '<rootDir>',
        relationships: [
          {
            dependents: [p('path/to/foo.ts')],
            dependencies: [p('path/to/bar.ts'), p('path/to/baz.ts')],
          },
        ],
      })
      // TODO: path.join(rootDir, '')
      expect(result).toStrictEqual({
        [p('<rootDir>/path/to/foo.ts')]: new Set([
          p('<rootDir>/path/to/bar.ts'),
          p('<rootDir>/path/to/baz.ts'),
        ]),
      })
    })
    test('advanced usage', () => {
      const result = toIndexedDependencyRelationships({
        rootDir: '<rootDir>',
        relationships: [
          {
            dependents: [p('path/to/foo.ts'), p('path/to/foo2.ts')],
            dependencies: [p('path/to/bar.ts'), p('path/to/baz.ts')],
          },
          {
            dependents: [p('path/to/foo2.ts'), p('path/to/foo3.ts')],
            dependencies: [p('path/to/bar2.ts'), p('path/to/baz2.ts')],
          },
        ],
      })
      expect(result).toStrictEqual({
        [p('<rootDir>/path/to/foo.ts')]: new Set([
          p('<rootDir>/path/to/bar.ts'),
          p('<rootDir>/path/to/baz.ts'),
        ]),
        [p('<rootDir>/path/to/foo2.ts')]: new Set([
          p('<rootDir>/path/to/bar.ts'),
          p('<rootDir>/path/to/baz.ts'),
          p('<rootDir>/path/to/bar2.ts'),
          p('<rootDir>/path/to/baz2.ts'),
        ]),
        [p('<rootDir>/path/to/foo3.ts')]: new Set([
          p('<rootDir>/path/to/bar2.ts'),
          p('<rootDir>/path/to/baz2.ts'),
        ]),
      })
    })
  })
})
