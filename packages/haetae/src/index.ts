import { parsePkg } from '@haetae/common'
import { dirname } from 'dirname-filename-esm'

export * as core from '@haetae/core'
export * as utils from '@haetae/utils'
export * as js from '@haetae/javascript'
export * as git from '@haetae/git'
export * as cli from '@haetae/cli'

export { $ } from '@haetae/utils'
export { configure } from '@haetae/core'

export const pkg = parsePkg({ name: 'haetae', rootDir: dirname(import.meta) })
