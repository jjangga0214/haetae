import assert from 'assert/strict'
import upath from 'upath'
import { major, minor, patch, prerelease } from 'semver'
import readPkgUp from 'read-pkg-up'

export interface ToAbsolutePathOptions {
  path: string
  rootDir: string
}

export function toAbsolutePath({
  path,
  rootDir,
}: ToAbsolutePathOptions): string {
  // eslint-disable-next-line no-param-reassign
  path = upath.normalize(path)
  // eslint-disable-next-line no-param-reassign
  rootDir = upath.resolve(rootDir) // It becomes an absolute path
  if (upath.isAbsolute(path)) {
    return path
  }
  return upath.join(rootDir, path)
}

export function parseVersion(version: string) {
  return {
    value: version,
    major: major(version),
    minor: minor(version),
    patch: patch(version),
    untilMinor: `${major(version)}.${minor(version)}`,
    untilPatch: `${major(version)}.${minor(version)}.${patch(version)}`,
    prerelease: prerelease(version),
  }
}

export interface ParsePkgOptions<T extends string> {
  name: T
  rootDir: string
}

export interface Pkg<T extends string> {
  name: T
  version: ReturnType<typeof parseVersion>
}

export function parsePkg<T extends string>({
  name,
  rootDir,
}: ParsePkgOptions<T>): Pkg<T> {
  const res = readPkgUp.sync({ cwd: rootDir })
  assert(res, 'package.json is not a found.')
  const { packageJson } = res
  assert(packageJson.name === name, '`pkg.name` is not matched.')
  return {
    name,
    version: parseVersion(packageJson.version),
  }
}
