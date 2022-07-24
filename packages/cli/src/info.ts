import envinfo from 'envinfo'

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
        const {
          pkg: {
            version: { value: version },
          },
        } = await import(key)
        const packagePath = require.resolve(key)
        packagesInfo[key as HaetaePackage] = {
          version,
          path: packagePath,
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
