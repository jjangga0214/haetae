import fs from 'fs'
import path from 'path'

export * as cli from '@haetae/cli'
export * as core from '@haetae/core'
export * as git from '@haetae/git'
export * as javascript from '@haetae/javascript'
export * as utils from '@haetae/utils'

export const { version: packageVersion } = (() => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'package.json'), {
    encoding: 'utf8',
  })
  return JSON.parse(content)
})()
export const packageName = 'haetae'
