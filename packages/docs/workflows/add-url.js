import { dirname } from 'dirname-filename-esm'
import fs from 'fs/promises'
import path from 'path'
import childProcess from 'child_process'
import axios from 'axios'
import { setTimeout } from 'timers/promises'

const { VERCEL_ACCESS_TOKEN, VERCEL_DEPLOYMENT_NAME } = process.env

const vercelClient = axios.create({
  baseURL: 'https://api.vercel.com',
  headers: {
    Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}`,
  },
})

async function exec(command) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, { trim: true }, (error, stdout, stderr) => {
      if (stdout) {
        resolve(stdout)
      }
      reject(error || stderr)
    })
  })
}

/*
interface VercelDeployment {
  url: string // Preview URL e.g. haetae-ljmxzu3ud-jjangga0214.vercel.app
  meta: {
    githubCommitSha: string // e.g. "89424fc15b34cb605f789c5aa93800e80369666e"
  }
}
*/

async function getDeployments() /*: Promise<VercelDeployment[]> */ {
  const {
    data: { deployments },
  } = await vercelClient.get(
    `https://api.vercel.com/v6/deployments/`,
    {},
    {
      params: {
        app: VERCEL_DEPLOYMENT_NAME,
        target: 'production', // Only lists deployments triggered by the production branch(e.g. main)
      },
    },
  )
  return deployments
}

async function getUrl({ commit }) {
  for (let index = 0; index < 6 * 12 /* 6mins */; index += 1) {
    const deployments = await getDeployments()
    const deployment = deployments.find(
      (d) => d.meta.githubCommitSha === commit,
    )
    if (deployment) {
      return deployment.url
    }
    await setTimeout(5 * 1000) // 10s
  }
  throw new Error('Cannot find deployment URL. Maybe Vercel is slow?')
}

async function writeUrl({ url, gitTags, gitBranch }) {
  const filename = path.join(dirname(import.meta), 'urls.json')
  const data = await fs.readFile(filename, {
    encoding: 'utf8',
  })
  const json = JSON.parse(data)

  for (const gitTag of gitTags) {
    console.log(`${gitTag}: ${url}`)
    json[gitTag] = url
  }

  json[gitBranch] = url

  await fs.writeFile(filename, JSON.stringify(json, undefined, 2), {
    encoding: 'utf8',
  })
}

async function main() {
  // console.log(await exec('git tag --points-at HEAD'))
  // const gitTags = (await exec('git tag --points-at HEAD'))
  //   .split('\n') // Tags are like `@haetae/core@1.0.0-beta.1` or `haetae@1.0.0`
  //   .filter((t) => t.startsWith('haetae@') || t.startsWith('@haetae/'))
  // const gitBranch = await exec('git branch --show-current')
  // const commit = await exec('git rev-parse --verify HEAD') // Full-length commit ID (SHA)

  const gitTags = [
    '@haetae/cli@0.0.14',
    '@haetae/common@0.0.2',
    '@haetae/core@0.0.13',
    '@haetae/git@0.0.12',
    '@haetae/javascript@0.0.12',
    '@haetae/utils@0.0.13',
    'haetae@0.0.15',
  ]
  const commit = '9d17ec746a92a954121d966f3032930bee2c9551'
  const gitBranch = 'main'
  const url = await getUrl({ commit })
  await writeUrl({ url, gitTags, gitBranch })
}


main()
main().catch((error) => {
  console.error(error)
  console.log(2)
})
