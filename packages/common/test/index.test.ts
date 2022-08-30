import upath from 'upath'
import { toAbsolutePath, parseVersion, parsePkg } from '../src/index.js'

describe('toAbsolutePath', () => {
  test('when `rootDir` is absolute', async () => {
    expect(
      toAbsolutePath({
        path: 'path/to/foo.ts',
        rootDir: '/root/dir',
      }),
    ).toBe('/root/dir/path/to/foo.ts')
  })
  test('when `rootDir` is relative', async () => {
    expect(
      toAbsolutePath({
        path: 'path/to/foo.ts',
        rootDir: '../../dir',
      }),
    ).toBe(upath.join(process.cwd(), '../../dir', 'path/to/foo.ts'))
  })
  test('when `path` is absolute', async () => {
    expect(
      toAbsolutePath({
        path: '/path/to/foo.ts',
        rootDir: '/root/dir',
      }),
    ).toBe('/path/to/foo.ts')
  })
  test('when `path` is directory', async () => {
    expect(
      toAbsolutePath({
        path: 'path/to/',
        rootDir: '/root/dir',
      }),
    ).toBe('/root/dir/path/to/')
  })
  test('when `path` and `rootDir` are same', async () => {
    expect(
      toAbsolutePath({
        path: '../',
        rootDir: '../',
      }),
    ).toBe(upath.join(process.cwd(), '..'))
    expect(
      toAbsolutePath({
        path: '..',
        rootDir: '../',
      }),
    ).toBe(upath.join(process.cwd(), '..'))
    expect(
      toAbsolutePath({
        path: '../',
        rootDir: '..',
      }),
    ).toBe(upath.join(process.cwd(), '..'))
    expect(
      toAbsolutePath({
        path: '..',
        rootDir: '..',
      }),
    ).toBe(upath.join(process.cwd(), '..'))
  })
})

describe('parseVersion', () => {
  test('when prerelease does not exist', async () => {
    expect(parseVersion('1.2.3')).toStrictEqual({
      value: '1.2.3',
      major: 1,
      minor: 2,
      patch: 3,
      untilMinor: '1.2',
      untilPatch: '1.2.3',
      // eslint-disable-next-line unicorn/no-null
      prerelease: null,
    })
  })
  test('when prerelease is with dot delimiter', async () => {
    expect(parseVersion('1.2.3-beta.4')).toStrictEqual({
      value: '1.2.3-beta.4',
      major: 1,
      minor: 2,
      patch: 3,
      untilMinor: '1.2',
      untilPatch: '1.2.3',
      prerelease: ['beta', 4],
    })
  })

  test('when prerelease is a single number', async () => {
    expect(parseVersion('1.2.3-4')).toStrictEqual({
      value: '1.2.3-4',
      major: 1,
      minor: 2,
      patch: 3,
      untilMinor: '1.2',
      untilPatch: '1.2.3',
      prerelease: [4],
    })
  })

  test('when prerelease is a single label', async () => {
    expect(parseVersion('1.2.3-beta')).toStrictEqual({
      value: '1.2.3-beta',
      major: 1,
      minor: 2,
      patch: 3,
      untilMinor: '1.2',
      untilPatch: '1.2.3',
      prerelease: ['beta'],
    })
  })
})

describe('pkg', () => {
  test('basic usage', async () => {
    expect(
      parsePkg({
        name: '@haetae/common',
        rootDir: __dirname,
      }).name,
    ).toBe('@haetae/common')
  })
})
