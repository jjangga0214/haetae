import upath from 'upath'
import { dirname } from 'dirname-filename-esm'
import { glob, graph, dependsOn, mergeGraphs } from '../src/index.js'

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
      '/<rootDir>/path/to/b.ts': new Set([]),
      '/<rootDir>/path/to/c.ts': new Set([]),
    })
  })

  // Testing this is to check if infinite loop is prevented
  test('circular dependency', () => {
    const result = graph({
      rootDir: '/',
      edges: [
        {
          dependents: ['a'],
          dependencies: ['b'],
        },
        {
          dependents: ['b'],
          dependencies: ['c'],
        },
        {
          dependents: ['c'],
          dependencies: ['a'],
        },
      ],
    })

    expect(result).toStrictEqual({
      '/a': new Set(['/b']),
      '/b': new Set(['/c']),
      '/c': new Set(['/a']),
    })
  })

  test('advanced usage', () => {
    const result = graph({
      rootDir: '/<rootDir>',
      edges: [
        {
          dependents: ['path/to/a.ts', 'path/to/b.ts'],
          dependencies: ['path/to/c.ts', 'path/to/d.ts', 'path/to/e.ts'],
        },
        {
          dependents: ['path/to/b.ts', 'path/to/c.ts'],
          dependencies: ['path/to/f.ts', 'path/to/g.ts'],
        },
      ],
    })
    expect(result).toStrictEqual({
      '/<rootDir>/path/to/a.ts': new Set([
        '/<rootDir>/path/to/c.ts',
        '/<rootDir>/path/to/d.ts',
        '/<rootDir>/path/to/e.ts',
      ]),
      '/<rootDir>/path/to/b.ts': new Set([
        '/<rootDir>/path/to/c.ts',
        '/<rootDir>/path/to/d.ts',
        '/<rootDir>/path/to/e.ts',
        '/<rootDir>/path/to/f.ts',
        '/<rootDir>/path/to/g.ts',
      ]),
      '/<rootDir>/path/to/c.ts': new Set([
        '/<rootDir>/path/to/f.ts',
        '/<rootDir>/path/to/g.ts',
      ]),
      '/<rootDir>/path/to/d.ts': new Set([]),
      '/<rootDir>/path/to/e.ts': new Set([]),
      '/<rootDir>/path/to/f.ts': new Set([]),
      '/<rootDir>/path/to/g.ts': new Set([]),
    })
  })
})

describe('mergeGraphs', () => {
  test('basic usage', () => {
    const result1 = graph({
      rootDir: '/',
      edges: [
        {
          dependents: ['a', 'b'],
          dependencies: ['c', 'd', 'e'],
        },
      ],
    })
    const result2 = graph({
      rootDir: '/',
      edges: [
        {
          dependents: ['a'],
          dependencies: ['e', 'f'],
        },
      ],
    })
    const result3 = graph({
      rootDir: '/',
      edges: [
        {
          dependents: ['b'],
          dependencies: ['a', 'f'],
        },
      ],
    })
    expect(mergeGraphs([result1, result2, result3])).toStrictEqual({
      '/a': new Set(['/c', '/d', '/e', '/f']),
      '/b': new Set(['/c', '/d', '/e', '/a', '/f']),
      '/c': new Set([]),
      '/d': new Set([]),
      '/f': new Set([]),
      '/e': new Set([]),
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
