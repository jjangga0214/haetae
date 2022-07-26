import readPkg from 'read-pkg'
import { major, minor, patch, prerelease } from 'semver'
import upath from 'upath'

const pkg = readPkg.sync({ cwd: upath.resolve(__dirname, '..') })

export default {
  name: '@haetae/cli' as const,
  version: {
    value: pkg.version,
    major: major(pkg.version),
    minor: minor(pkg.version),
    patch: patch(pkg.version),
    prerelease: prerelease(pkg.version),
  },
}
