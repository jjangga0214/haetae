import upath from 'upath'
import { dirname } from 'dirname-filename-esm'
import {
  branch,
  commit,
  ignoredFiles,
  changedFiles,
  untrackedFiles,
  initialized,
  installed,
} from '../src/index.js'

const rootDir = upath.resolve(dirname(import.meta), '../../../')
const parentOfRootDir = upath.resolve(rootDir, '../')

// TODO: git submodule test

describe('installed', () => {
  test('basic usage', async () => {
    await expect(installed({ rootDir })).resolves.toBe(true)
  })
})

describe('initialized', () => {
  test('check this repo', async () => {
    await expect(
      initialized({
        rootDir,
      }),
    ).resolves.toBe(true)
  })
  test('check parent directory of the repo', async () => {
    await expect(
      initialized({
        rootDir: parentOfRootDir,
      }),
    ).resolves.toBe(false)
  })
})

describe('branch', () => {
  test('check this repo', async () => {
    await expect(
      branch({
        rootDir,
      }),
    ).resolves.toBe('main')
  })
  test('check parent directory of the repo', async () => {
    await expect(
      branch({
        rootDir: parentOfRootDir,
      }),
    ).rejects.toThrow('')
  })
})

describe('commit', () => {
  test('check this repo', async () => {
    await expect(
      commit({
        rootDir,
      }),
    ).resolves.toHaveLength(40)
  })
  test('check parent directory of the repo', async () => {
    await expect(
      commit({
        rootDir: parentOfRootDir,
      }),
    ).rejects.toThrow('')
  })
})

describe('ignoredFiles', () => {
  test('check this repo', async () => {
    const files = await ignoredFiles({
      rootDir,
    })
    expect(Array.isArray(files)).toBe(true)
  })
  test('check parent directory of the repo', async () => {
    await expect(
      ignoredFiles({
        rootDir: parentOfRootDir,
      }),
    ).rejects.toThrow('')
  })
})

describe('changedFiles', () => {
  test('check this repo', async () => {
    const files = await changedFiles({
      rootDir,
      from: 'c41b41d',
      to: '7416820',
      reserveRecordData: false,
    })
    expect(Array.isArray(files)).toBe(true)
    expect(files).toHaveLength(7)
  })
  test('check parent directory of the repo', async () => {
    await expect(
      changedFiles({
        rootDir: parentOfRootDir,
      }),
    ).rejects.toThrow('')
  })
})

describe('untrackedFiles', () => {
  test('check this repo', async () => {
    const files = await untrackedFiles({
      rootDir,
    })
    expect(Array.isArray(files)).toBe(true)
  })
  test('check parent directory of the repo', async () => {
    await expect(
      untrackedFiles({
        rootDir: parentOfRootDir,
      }),
    ).rejects.toThrow('')
  })
})
