import upath from 'upath'
import { dirname } from 'dirname-filename-esm'
import { changedFiles, ChangedFilesOptions } from '../src/changed-files.js'

describe('changedFiles', () => {
  const rootDir = upath.resolve(dirname(import.meta), 'changed-files')
  const options = async (): Promise<ChangedFilesOptions> => ({
    renew: ['c', 'd', 'f', 'g'],
    previousFiles: {
      b: 'b',
      'b.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c', // hash of 'Hello World
      c: 'c',
      'c.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      e: 'e',
      f: 'f',
    },
    rootDir,
  })

  test('basic usage', async () => {
    const result = await changedFiles(['*'], {
      ...(await options()),
    })
    expect(new Set(result)).toStrictEqual(
      new Set([
        upath.resolve(rootDir, 'a'),
        upath.resolve(rootDir, 'b'),
        upath.resolve(rootDir, 'c'),
        upath.resolve(rootDir, 'd'),
        upath.resolve(rootDir, 'e'),
        upath.resolve(rootDir, 'f'),
      ]),
    )
  })

  test('glob: false', async () => {
    const result = await changedFiles(['*'], {
      ...(await options()),
      glob: false,
    })
    expect(new Set(result)).toStrictEqual(new Set())
    const result2 = await changedFiles(
      ['a', 'b', 'b.not-changed', 'c', 'c.not-changed', 'd', 'e', 'f', 'h'],
      {
        ...(await options()),
        glob: false,
      },
    )
    expect(new Set(result2)).toStrictEqual(
      new Set([
        upath.resolve(rootDir, 'a'),
        upath.resolve(rootDir, 'b'),
        upath.resolve(rootDir, 'c'),
        upath.resolve(rootDir, 'd'),
        upath.resolve(rootDir, 'e'),
        upath.resolve(rootDir, 'f'),
      ]),
    )
  })
  test('filterByExistence: true', async () => {
    const result = await changedFiles(['*'], {
      ...(await options()),
      filterByExistence: true,
    })
    expect(new Set(result)).toStrictEqual(
      new Set([
        upath.resolve(rootDir, 'a'),
        upath.resolve(rootDir, 'b'),
        upath.resolve(rootDir, 'c'),
        upath.resolve(rootDir, 'd'),
      ]),
    )
  })
})
