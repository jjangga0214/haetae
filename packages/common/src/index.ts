import assert from 'node:assert/strict'
import upath from 'upath'
import semver from 'semver'
import { readPackageUpSync } from 'read-pkg-up'

export type PromiseOr<T> = Promise<T> | T

export type Rec = {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | Rec
    | (string | number | boolean | null | undefined | Rec)[]
}

export interface ToAbsolutePathOptions {
  path: string
  rootDir: string | (() => string)
}

export function toAbsolutePath({
  path,
  rootDir,
}: ToAbsolutePathOptions): string {
  if (upath.isAbsolute(path)) {
    return upath.normalizeSafe(path)
  }
  if (typeof rootDir === 'function') {
    // eslint-disable-next-line no-param-reassign
    rootDir = rootDir()
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
