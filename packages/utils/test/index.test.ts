import upath from 'upath'
import { glob, graph } from '@haetae/utils'

describe('index', () => {
  test('glob', async () => {
    expect.hasAssertions()
    const rootDir = upath.join(__dirname, '../../../test-project')
    const res = await glob(['**/*.test.ts'], {
      rootDir,
    })

    expect(res).toStrictEqual(
      expect.arrayContaining([
        upath.join(rootDir, 'packages/bar/test/unit/index.test.ts'),
        upath.join(rootDir, 'packages/foo/test/integration/index.test.ts'),
        upath.join(rootDir, 'packages/foo/test/unit/index.test.ts'),
      ]),
    )
    expect(res).toHaveLength(3)
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
