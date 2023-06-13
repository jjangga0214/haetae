import upath from 'upath'
import { dirname } from 'dirname-filename-esm'
import { glob, $, graph, dependsOn, mergeGraphs, deps } from '../src/index.js'

describe('glob', () => {
  test('basic usage', async () => {
    const rootDir = upath.resolve(dirname(import.meta), '../../../test-project')
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

  test('walk up over the rootDir', async () => {
    const rootDir = dirname(import.meta)
    await expect(
      glob(['../package.json'], {
        rootDir,
      }),
    ).resolves.toStrictEqual([upath.resolve(rootDir, '../package.json')])

    const res = await glob(['../*.json'], {
      rootDir,
    })

    expect(res).toStrictEqual(
      expect.arrayContaining([
        upath.resolve(rootDir, '../package.json'),
        upath.resolve(rootDir, '../tsconfig.json'),
        upath.resolve(rootDir, '../tsconfig.build.json'),
      ]),
    )
    expect(res).toHaveLength(3)
  })

  test('non-existent file is not included in the result', async () => {
    const rootDir = dirname(import.meta)

    await expect(
      // non-existent
      glob(['../non-existent', 'non-existent'], {
        rootDir,
      }),
    ).resolves.toStrictEqual([])
  })
})

describe('$', () => {
  $.cwd = process.cwd()
  test('basic usage', async () => {
    const stdout = await $`echo hello`
    expect(stdout).toBe('hello')
  })

  test('args usage', async () => {
    const stdout = await $`echo ${1} ${2}`
    expect(stdout).toBe('1 2')
    const stdout1 = await $`echo ${1} ${2} ${3}`
    expect(stdout1).toBe('1 2 3')
  })

  test('promise usage', async () => {
    const stdout = await $`echo ${Promise.resolve('hello')}`
    expect(stdout).toBe('hello')
  })

  test('array usage', async () => {
    const stdout = await $`echo ${['hello']}`
    expect(stdout).toBe('hello')
    const stdout1 = await $`echo ${['hello', 'world']}`
    expect(stdout1).toBe('hello world')
  })

  test('empty array', async () => {
    const stdout = await $`echo ${[]}`
    expect(stdout).toBe('')
    const stdout1 = await $`echo ${'hello'} ${[]} ${'world'}`
    expect(stdout1).toBe('hello world')
  })

  test('array of Promise usage', async () => {
    const stdout = await $`echo ${[
      Promise.resolve('hello'),
      'world',
      Promise.resolve('!'),
    ]}`
    expect(stdout).toBe('hello world !')
  })

  test('promise array of promise usage', async () => {
    const stdout = await $`echo ${Promise.resolve([
      Promise.resolve('hello'),
      'world',
      Promise.resolve('!'),
    ])}`
    expect(stdout).toBe('hello world !')
  })
})

describe('graph', () => {
  test('basic usage', async () => {
    const result = await graph({
      rootDir: '/<rootDir>',
      edges: [
        {
          dependents: ['path/to/a.ts'],
          dependencies: ['path/to/b.ts', 'path/to/c.ts'],
        },
      ],
      glob: false,
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
  test('circular dependency', async () => {
    const result = await graph({
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
      glob: false,
    })

    expect(result).toStrictEqual({
      '/a': new Set(['/b']),
      '/b': new Set(['/c']),
      '/c': new Set(['/a']),
    })
  })

  test('advanced usage', async () => {
    const result = await graph({
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
      glob: false,
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
  test('basic usage', async () => {
    const result1 = await graph({
      rootDir: '/',
      edges: [
        {
          dependents: ['a', 'b'],
          dependencies: ['c', 'd', 'e'],
        },
      ],
      glob: false,
    })
    const result2 = await graph({
      rootDir: '/',
      edges: [
        {
          dependents: ['a'],
          dependencies: ['e', 'f'],
        },
      ],
      glob: false,
    })
    const result3 = await graph({
      rootDir: '/',
      edges: [
        {
          dependents: ['b'],
          dependencies: ['a', 'f'],
        },
      ],
      glob: false,
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

describe('deps', () => {
  // Promise
  const depsGraph = graph({
    rootDir: '/',
    edges: [
      {
        dependents: ['x', 'y'],
        dependencies: ['a', 'e'],
      },
      {
        dependents: ['a'],
        dependencies: ['b', 'c'],
      },
      {
        dependents: ['b'],
        dependencies: ['d'],
      },
      {
        dependents: ['d', 'e'],
        dependencies: ['f'],
      },
      {
        dependents: ['c', 'g'],
        dependencies: ['e', 'f'],
      },
      {
        dependents: ['h'],
        dependencies: ['i'],
      },
    ],
    glob: false,
  })
  test('basic usage', async () => {
    expect(
      deps({
        entrypoint: 'a',
        graph: await depsGraph,
        rootDir: '/',
      }),
    ).toStrictEqual(['/a', '/b', '/c', '/d', '/e', '/f'])
  })
})

describe('dependsOn', () => {
  // Promise
  const depsGraph = graph({
    rootDir: '/<rootDir>',
    edges: [
      {
        dependents: ['a'],
        dependencies: ['b', 'c'],
      },
      {
        dependents: ['c'],
        dependencies: ['d'],
      },
      {
        dependents: ['d', 'e'],
        dependencies: ['f'],
      },
      {
        dependents: ['g', 'h'],
        dependencies: ['h', 'g'],
      },
      {
        dependents: ['i'],
        dependencies: ['j'],
      },
      {
        dependents: ['j'],
        dependencies: ['k'],
      },
      {
        dependents: ['k'],
        dependencies: ['i'],
      },
    ],
    glob: false,
  })
  test('direct dependency', async () => {
    await expect(
      dependsOn({
        dependent: 'a',
        dependencies: ['c'],
        graph: await depsGraph,
        rootDir: '/<rootDir>',
        glob: false,
      }),
    ).resolves.toBe(true)
  })
  test('transitive dependency', async () => {
    await expect(
      dependsOn({
        dependent: 'a',
        dependencies: ['x', 'f'],
        graph: await depsGraph,
        rootDir: '/<rootDir>',
        glob: false,
      }),
    ).resolves.toBe(true)
  })
  test('non-existent dependency', async () => {
    await expect(
      dependsOn({
        dependent: 'a',
        dependencies: ['non-existent'],
        graph: await depsGraph,
        rootDir: '/<rootDir>',
      }),
    ).resolves.toBe(false)
  })
  test('non-existent dependent', async () => {
    await expect(
      dependsOn({
        dependent: 'non-existent',
        dependencies: ['c'],
        graph: await depsGraph,
        rootDir: '/<rootDir>',
        glob: false,
      }),
    ).resolves.toBe(false)
  })
  test('circular dependency', async () => {
    await expect(
      dependsOn({
        dependent: 'g',
        dependencies: ['h'],
        graph: await depsGraph,
        rootDir: '/<rootDir>',
        glob: false,
      }),
    ).resolves.toBe(true)
    await expect(
      dependsOn({
        dependent: 'i',
        dependencies: ['k'],
        graph: await depsGraph,
        rootDir: '/<rootDir>',
        glob: false,
      }),
    ).resolves.toBe(true)
    await expect(
      dependsOn({
        dependent: 'k',
        dependencies: ['j'],
        graph: await depsGraph,
        rootDir: '/<rootDir>',
        glob: false,
      }),
    ).resolves.toBe(true)
  })
})
