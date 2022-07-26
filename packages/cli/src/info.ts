import assert from 'assert/strict'
import envinfo from 'envinfo'
import readPkgUp from 'read-pkg-up'
import upath from 'upath'

interface VersionAndPath {
  version: string
  path: string
}

async function getPackagesInfo() {
  type HaetaePackage =
    | 'haetae'
    | '@haetae/core'
    | '@haetae/cli'
    | '@haetae/git'
    | '@haetae/javascript'
    | '@haetae/utils'

  const packagesInfo: Record<HaetaePackage, VersionAndPath | undefined> = {
    haetae: undefined,
    '@haetae/core': undefined,
    '@haetae/cli': undefined,
    '@haetae/git': undefined,
    '@haetae/javascript': undefined,
    '@haetae/utils': undefined,
  }

  for (const key in packagesInfo) {
    if (Object.prototype.hasOwnProperty.call(packagesInfo, key)) {
      try {
        /**
         * `@haetae/*` and `haetae` export `pkg.version`.
         * This is a contract which can be theoretically changed in the future, by breaking change.
         * So, why depending on `pkg.version` here?
         * You might think just reading package.json of them would be more safe.
         * However, with yarn berry, we cannot access to the package.json of the other packages.
         * Note that access to package.json of the package itself is allowed even with yarn berry.
         * For example, source code of `@haetae/cli` can read package.json of `@haetae/cli` with yarn berry.
         * But, source code of `@haetae/cli` can NOT read package.json of `@haetae/core` with yarn berry.
         * For npm, yarn classic, or pnpm, there is no such restriction.
         */
        const entrypoint = require.resolve(key)
        const mod = await import(key)
        let version = mod.pkg?.version?.value // contract

        if (!version) {
          // Fallback to package.json
          // This fallback will not work with yarn berry.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore // `readPkgUp`'s typing and implementation are mismatched.
          const res = await readPkgUp({
            cwd: upath.dirname(entrypoint),
          })

          assert(res?.packageJson.name, key)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          version = res!.packageJson.version
        }

        packagesInfo[key as HaetaePackage] = {
          version,
          path: entrypoint,
        }
      } catch {
        //
      }
    }
  }
  return packagesInfo
}

async function getSystemInfo() {
  const envinfoRes = JSON.parse(
    await envinfo.run(
      {
        System: ['OS', 'CPU', 'Memory', 'Shell'],
        Binaries: ['Node', 'Yarn', 'npm'],
        Utilities: ['Git'],
      },
      { json: true },
    ),
  )

  return {
    os: envinfoRes.System?.OS as string | undefined,
    cpu: envinfoRes.System?.CPU as string | undefined,
    memory: envinfoRes.System?.Memory as string | undefined,
    shell: envinfoRes.System?.Shell as VersionAndPath | undefined,
    node: envinfoRes.Binaries?.Node as VersionAndPath | undefined,
    npm: envinfoRes.Binaries?.npm as VersionAndPath | undefined,
    yarn: envinfoRes.Binaries?.Yarn as VersionAndPath | undefined,
    git: envinfoRes.Utilities?.Git as VersionAndPath | undefined,
  }
}

export async function getInfo() {
  return {
    ...(await getSystemInfo()),
    ...(await getPackagesInfo()),
  }
}

export async function getSerializedInfo() {
  const info = await getInfo()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const serialized: Record<keyof typeof info, string | undefined> = {}
  // eslint-disable-next-line guard-for-in
  for (const key in info) {
    const value = info[key as keyof typeof info]
    if (
      value &&
      Object.prototype.hasOwnProperty.call(info, key) &&
      typeof value !== 'string'
    ) {
      serialized[key as keyof typeof info] = `${value.version} - ${value.path}`
    } else {
      serialized[key as keyof typeof info] = value as string
    }
  }
  return serialized
}
