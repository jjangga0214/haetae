import envinfo from 'envinfo'
import signale from 'signale'

interface VersionAndPath {
  version: string
  path: string
}
async function getPackagesInfo() {
  const packages = [
    'haetae',
    '@haetae/core',
    '@haetae/cli',
    '@haetae/git',
    '@haetae/javascript',
    '@haetae/utils',
  ] as const

  const packagesInfo: Record<string, VersionAndPath> = {}

  for (const pkg of packages) {
    try {
      const { packageVersion } = await import(pkg)
      const packagePath = require.resolve(pkg)
      packagesInfo[pkg] = {
        version: packageVersion as string,
        path: packagePath,
      }
    } catch {
      //
    }
  }
  return packagesInfo as Record<typeof packages[number], VersionAndPath>
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
    os: envinfoRes.System?.OS as string,
    cpu: envinfoRes.System?.CPU as string,
    memory: envinfoRes.System?.Memory as string,
    shell: envinfoRes.System?.Shell as VersionAndPath,
    node: envinfoRes.Binaries?.Node as VersionAndPath,
    npm: envinfoRes.Binaries?.npm as VersionAndPath,
    yarn: envinfoRes.Binaries?.Yarn as VersionAndPath,
    git: envinfoRes.Utilities?.Git as VersionAndPath,
  }
}

async function getEntireInfo() {
  return {
    ...(await getSystemInfo()),
    ...(await getPackagesInfo()),
  }
}

export async function runInfo() {
  signale.info(
    `Your system information is copied to the clipboard.\nPaste it when creating an issue.\n<https://github.com/jjangga0214/haetae/issues>\n`,
  )

  const messageLines = []
  const entireInfo = await getEntireInfo()

  // eslint-disable-next-line guard-for-in
  for (const key in entireInfo) {
    const singleInfo = entireInfo[key as keyof typeof entireInfo]
    if (singleInfo && Object.prototype.hasOwnProperty.call(entireInfo, key)) {
      if (typeof singleInfo === 'string') {
        messageLines.push(`${key}: ${singleInfo}`)
      } else {
        messageLines.push(`${key}: ${singleInfo.version} - ${singleInfo.path}`)
      }
    }
  }
  const message = messageLines.join('\n')
  console.log(message)
}
