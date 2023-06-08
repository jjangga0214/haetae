import { dirname } from 'dirname-filename-esm'
import { version, versionFromYarnBerry } from '../src/version.js'

describe('version', () => {
  test('basic usage', async () => {
    const versionInfo = await version('semver', {
      rootDir: dirname(import.meta),
    })
    expect(versionInfo.major).toBe(7)
  })
})

describe('versionFromYarn()', () => {
  test('with yarn v1 (Classic)', async () => {
    await expect(
      versionFromYarnBerry('yargs', {
        rootDir: dirname(import.meta),
        lockFilename: 'resources/yarn-classic.lock',
      }),
    ).rejects.toThrow(Error) // resolves.toBe('17.5.1'),
  })
  test('with yarn v2 (Berry)', async () => {
    await expect(
      versionFromYarnBerry('haetae', {
        rootDir: dirname(import.meta),
        lockFilename: 'resources/yarn-berry-2.lock',
      }),
    ).resolves.toBe('0.0.11')
  })
  test('with yarn v3 (Berry)', async () => {
    await expect(
      versionFromYarnBerry('@haetae/core', {
        rootDir: dirname(import.meta),
        lockFilename: 'resources/yarn-berry-3.lock',
      }),
    ).resolves.toBe('0.0.10')
  })
})
