import assert from 'assert/strict'
import upath from 'upath'
import readPkg from 'read-pkg'
import { major, minor, patch, prerelease } from 'semver'

const pkg = readPkg.sync({ cwd: upath.resolve(__dirname, '..') })
const name = '@haetae/cli' as const
assert(pkg.name === name, '`pkg.name` is not matched')

export default {
  name,
  version: {
    value: pkg.version,
    major: major(pkg.version),
    minor: minor(pkg.version),
    patch: patch(pkg.version),
    untilMinor: `${major(pkg.version)}.${minor(pkg.version)}`,
    untilPatch: `${major(pkg.version)}.${minor(pkg.version)}.${patch(
      pkg.version,
    )}`,
    prerelease: prerelease(pkg.version),
  },
}
