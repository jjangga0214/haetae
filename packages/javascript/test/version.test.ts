import { version, versionFromYarnBerry } from '../src/version'

describe('version', () => {
  test('basic usage', async () => {
    const versionInfo = await version('semver', { rootDir: __dirname })
    expect(versionInfo.major).toBe(7)
  })
})

describe('versionFromYarn()', () => {
  test('basic usage', async () => {
    await Promise.all([
      expect(
        versionFromYarnBerry('yargs', {
          rootDir: __dirname,
          lockFilename: 'yarn-classic.lock',
        }),
      ).rejects.toThrow(Error), // resolves.toBe('17.5.1'),
      expect(
        versionFromYarnBerry('haetae', {
          rootDir: __dirname,
          lockFilename: 'yarn-berry-2.lock',
        }),
      ).resolves.toBe('0.0.11'),
      expect(
        versionFromYarnBerry('@haetae/core', {
          rootDir: __dirname,
          lockFilename: 'yarn-berry-3.lock',
        }),
      ).resolves.toBe('0.0.10'),
    ])
  })
})
