/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-extraneous-dependencies */
import { JSONSchemaForNPMPackageJsonFiles as PackageJson } from '@schemastore/package' // root devDep
import readPkg from 'read-pkg'
import { major, minor, patch, prerelease } from 'semver'

const pkg = readPkg.sync() as PackageJson

export default {
  name: '@haetae/javascript' as const,
  version: {
    value: pkg.version!,
    major: major(pkg.version!),
    minor: minor(pkg.version!),
    patch: patch(pkg.version!),
    prerelease: prerelease(pkg.version!),
  },
}
