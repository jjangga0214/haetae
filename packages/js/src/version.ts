import fs from 'node:fs'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import upath from 'upath'
import { readPackageUp } from 'read-pkg-up'
import { findUp } from 'find-up'
import yaml from 'yaml'
import { getConfigDirname } from '@haetae/core'
import { parseVersion } from '@haetae/common'

const require = createRequire(import.meta.url)

export interface VersionFromYarnBerryOptions {
  rootDir?: string
  lockFilename?: string
}

/**
 * Read package version from yarn.lock
 */
export async function versionFromYarnBerry(
  packageName: string,
  {
    rootDir = getConfigDirname(),
    lockFilename = 'yarn.lock',
  }: VersionFromYarnBerryOptions = {},
): Promise<string> | never {
  // eslint-disable-next-line no-useless-catch
  try {
    /**
     * For yarn berry, it throws an error (by assertion of package name or 'not found' of package.json).
     * With yarn berry, we cannot access to the package.json of the other packages.
     * Note that access to package.json of the package itself is allowed even with yarn berry.
     * For example, source code of `foo` can read package.json of `foo` with yarn berry.
     * But, source code of `foo` can NOT read package.json of `bar` with yarn berry.
     * For npm, yarn classic, or pnpm, there is no such restriction.
     * So, yarn.lock can be fallback.
     * yarn v1(classic), v2(berry) and v3(berry) are all compaitible for parsing dependency version.
     */
    const yarnLockfilePath = await findUp(lockFilename, { cwd: rootDir })
    assert(!!yarnLockfilePath)
    const yarnLockfile = fs.readFileSync(yarnLockfilePath, {
      encoding: 'utf8',
    })
    const depsLockJson = yaml.parse(yarnLockfile)
    /**
     * For yarn classic, uncomment the snippet below
     *
     * let depsLockJson
     * try {
     *   depsLockJson = yaml.parse(yarnLockfile) // For yarn berry
     * } catch {
     *   /// import yarnClassicLock from '@yarnpkg/lockfile'
     *   depsLockJson = yarnClassicLock.parse(yarnLockfile).object // for yarn classic
     * }
     */

    for (const key in depsLockJson) {
      if (
        Object.prototype.hasOwnProperty.call(depsLockJson, key) &&
        key.startsWith(`${packageName}@`)
      ) {
        const { version } = depsLockJson[key]
        return version
      }
    }

    throw new Error(`Version for package ${packageName} cannot be resolved.`)
  } catch (error) {
    throw error
  }
}

export interface VersionOptions {
  rootDir?: string
}

// TODO: test
export async function version(
  packageName: string,
  { rootDir = getConfigDirname() }: VersionOptions = {},
) {
  try {
    const {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      packageJson: { name, version },
    } = await readPackageUp({
      cwd: upath.dirname(
        require.resolve(packageName, {
          paths: [rootDir],
        }),
      ),
    })
    assert(name === packageName)
    return parseVersion(version)
  } catch {
    return parseVersion(await versionFromYarnBerry(packageName, { rootDir }))
  }
}
