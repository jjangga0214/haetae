import assert from 'assert/strict'
import upath from 'upath'
import semver from 'semver'
import readPkgUp from 'read-pkg-up'

export type PromiseOr<T> = Promise<T> | T

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
  if (upath.isAbsolute(path)) {
    return path
  }
  // eslint-disable-next-line no-param-reassign
  rootDir = upath.resolve(rootDir) // It becomes an absolute path
  // eslint-disable-next-line no-param-reassign
  rootDir = rootDir.endsWith('/') ? rootDir : `${rootDir}/`
  const resolvedPath = upath.resolve(path)

  if (resolvedPath.startsWith(rootDir) || `${resolvedPath}/` === rootDir) {
    return upath.resolve(path)
  }
  return upath.join(rootDir, path)
}

export function parseVersion(version: string) {
  return {
    value: version,
    major: semver.major(version),
    minor: semver.minor(version),
    patch: semver.patch(version),
    untilMinor: `${semver.major(version)}.${semver.minor(version)}`,
    untilPatch: `${semver.major(version)}.${semver.minor(
      version,
    )}.${semver.patch(version)}`,
    prerelease: semver.prerelease(version),
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
  assert(!!res, 'package.json is not a found.')
  const { packageJson } = res
  assert(packageJson.name === name, '`pkg.name` is not matched.')
  return {
    name,
    version: parseVersion(packageJson.version),
  }
}
