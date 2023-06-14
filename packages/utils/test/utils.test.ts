import upath from 'upath'
import { dirname } from 'dirname-filename-esm'
import { glob, $ } from '../src/utils.js'

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
