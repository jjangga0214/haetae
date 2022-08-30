import upath from 'upath'
import { dirname } from 'dirname-filename-esm'
import { glob, graph, dependsOn } from '../src/index'

describe('glob', () => {
  test('basic usage', async () => {
    expect.hasAssertions()
    const rootDir = upath.join(dirname(import.meta), '../../../test-project')
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
      rootDir: '/<rootDir>',
      edges: [
        {
          dependents: ['path/to/a.ts'],
          dependencies: ['path/to/b.ts', 'path/to/c.ts'],
        },
      ],
    })

    expect(result).toStrictEqual({
      '/<rootDir>/path/to/a.ts': new Set([
        '/<rootDir>/path/to/b.ts',
        '/<rootDir>/path/to/c.ts',
      ]),
    })
  })

  test('advanced usage', () => {
    const result = graph({
      rootDir: '/<rootDir>',
      edges: [
        {
          dependents: ['path/to/a.ts', 'path/to/b.ts'],
          dependencies: ['path/to/d.ts', 'path/to/e.ts', 'path/to/c.ts'],
        },
        {
          dependents: ['path/to/b.ts', 'path/to/c.ts'],
          dependencies: ['path/to/f.ts', 'path/to/g.ts'],
        },
      ],
    })
    expect(result).toStrictEqual({
      '/<rootDir>/path/to/a.ts': new Set([
        '/<rootDir>/path/to/d.ts',
        '/<rootDir>/path/to/e.ts',
        '/<rootDir>/path/to/c.ts',
      ]),
      '/<rootDir>/path/to/b.ts': new Set([
        '/<rootDir>/path/to/d.ts',
        '/<rootDir>/path/to/e.ts',
        '/<rootDir>/path/to/f.ts',
        '/<rootDir>/path/to/g.ts',
        '/<rootDir>/path/to/c.ts',
      ]),
      '/<rootDir>/path/to/c.ts': new Set([
        '/<rootDir>/path/to/f.ts',
        '/<rootDir>/path/to/g.ts',
      ]),
    })
  })
})

describe('dependsOn', () => {
  const depsGraph = graph({
    rootDir: '/<rootDir>',
    edges: [
      {
        dependents: ['a.ts'],
        dependencies: ['b.ts', 'c.ts'],
      },
      {
        dependents: ['c.ts'],
        dependencies: ['d.ts'],
      },
      {
        dependents: ['d.ts', 'e.ts'],
        dependencies: ['f.ts'],
      },
    ],
  })
  test('direct dependency', () => {
    expect(
      dependsOn({
        dependent: '/<rootDir>/a.ts',
        dependencies: ['/<rootDir>/c.ts'],
        graph: depsGraph,
        rootDir: '/<rootDir>',
      }),
    ).toBe(true)
  })
  test('transitive dependency', () => {
    expect(
      dependsOn({
        dependent: '/<rootDir>/a.ts',
        dependencies: ['/<rootDir>/x.ts', '/<rootDir>/f.ts'],
        graph: depsGraph,
        rootDir: '/<rootDir>',
      }),
    ).toBe(true)
  })
  test('non-existent dependency', () => {
    expect(
      dependsOn({
        dependent: '/<rootDir>/a.ts',
        dependencies: ['/<rootDir>/non-existent.ts'],
        graph: depsGraph,
        rootDir: '/<rootDir>',
      }),
    ).toBe(false)
  })
  test('non-existent dependent', () => {
    expect(
      dependsOn({
        dependent: '/<rootDir>/non-existent.ts',
        dependencies: ['/<rootDir>/c.ts'],
        graph: depsGraph,
        rootDir: '/<rootDir>',
      }),
    ).toBe(false)
  })
})
