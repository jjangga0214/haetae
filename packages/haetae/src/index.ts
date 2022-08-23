import { parsePkg } from '@haetae/common'

export * as core from '@haetae/core'
export * as utils from '@haetae/utils'
export * as js from '@haetae/javascript'
export * as git from '@haetae/git'
export * as cli from '@haetae/cli'
export const pkg = parsePkg({ name: 'haetae', rootDir: __dirname })
