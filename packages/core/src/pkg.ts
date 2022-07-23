import path from 'path'
import readPkg from 'read-pkg'
import { major, minor, patch, prerelease } from 'semver'

const pkg = readPkg.sync({ cwd: path.join(__dirname, '..') })

export default {
  name: '@haetae/core' as const,
  version: {
    value: pkg.version,
    major: major(pkg.version),
    minor: minor(pkg.version),
    patch: patch(pkg.version),
    prerelease: prerelease(pkg.version),
  },
}
