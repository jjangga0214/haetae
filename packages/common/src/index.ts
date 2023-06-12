import assert from 'node:assert/strict'
import upath from 'upath'
import semver from 'semver'
import { readPackageUpSync } from 'read-pkg-up'

export type PromiseOr<T> = Promise<T> | T
export type Rec = Record<string, unknown>

export interface ToAbsolutePathOptions {
  path?: string
  rootDir: string | (() => string)
}

export function toAbsolutePath({
  path,
  rootDir,
}: ToAbsolutePathOptions): string {
  if (typeof rootDir === 'function') {
    // eslint-disable-next-line no-param-reassign
    rootDir = rootDir()
  }
  if (path === undefined) {
    return upath.resolve(rootDir)
  }
  if (upath.isAbsolute(path)) {
    return upath.normalizeSafe(path)
  }

  return upath.resolve(rootDir, path)
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
  const res = readPackageUpSync({ cwd: rootDir })
  assert(!!res, 'package.json is not a found.')
  const { packageJson } = res
  assert(packageJson.name === name, '`pkg.name` is not matched.')
  return {
    name,
    version: parseVersion(packageJson.version),
  }
}
