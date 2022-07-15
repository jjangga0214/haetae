#!/usr/bin/env node
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import path from 'path'
import fs from 'fs'
import {
  setCurrentCommand,
  invokeEnv,
  setConfigFilename,
  defaultConfigFile,
  defaultStoreFile,
  saveStore,
  getStore,
  getRecord,
  getRecords,
} from '@haetae/core'
import assert from 'assert/strict'

// export function hideBinary(argv: string[]): string[] {
//   if (process.env.NODE_ENV === 'development') {
//     return argv.slice(6)
//   }
//   return hideBin(argv)
// }

export const { name, version } = (() => {
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'package.json'),
    'utf8',
  )
  return JSON.parse(content)
})()

export async function run() {
  const y = await yargs(hideBin(process.argv))
    .scriptName('haetae')
    .usage('$0 <command>')
    .alias('h', 'help')
    .alias('v', 'version')
    .options({
      c: {
        alias: 'config',
        type: 'string',
        description: `Config file path. Default to "./${defaultConfigFile}" or the environment variable $HAETAE_CONFIG_FILE`,
      },
      s: {
        alias: 'store',
        type: 'string',
        description: 'Store file path',
      },
      r: {
        alias: 'record',
        type: 'boolean',
        description: 'All/partial record(s)',
      },
      e: {
        alias: 'env',
        type: 'boolean',
        description: 'Current environment',
      },
    })
    .example([
      [`$0 -c ./${defaultConfigFile} <...>`, 'Specify config file path.'],
      [
        `$0 -s ./${defaultStoreFile} <...>`,
        'Specify store file path, ignoring "storeFile" field in config file.',
      ],
      [
        '$0 <command>',
        'Run the given command and save the new record to store file',
      ],
      ['$0 -r', 'Show all content of the store file'],
      ['$0 -r <command>', 'Show all records of the given command'],
      ['$0 -e <command>', 'Show current env of the given command'],
      [
        '$0 -r -e <command>',
        'Show a record of current env of the given command',
      ],
    ])

  // `y` should be instantiated for type check. Do NOT create `argv` directly.
  const argv = await y.argv

  // 1. Set config file path
  if (argv.c) {
    setConfigFilename(argv.c)
  } else {
    const cwdConfigFile = path.join(process.cwd(), defaultConfigFile)
    try {
      assert(
        fs.statSync(cwdConfigFile).isFile(),
        `${cwdConfigFile} must be a file.`,
      )
      setConfigFilename(cwdConfigFile)
    } catch {
      //
    }
  }

  // 2. Set store file path
  if (argv.s) {
    // TODO: https://github.com/jjangga0214/haetae/issues/13
  }

  if (argv._.length === 0) {
    // When command is not given

    assert(!argv.e, 'Option "e" must be given with <command>')
    assert(
      argv.r === true,
      'Option "r" must be given when <command> is not given',
    )
    const store = await getStore()
    console.log(JSON.stringify(store, undefined, 2))
  } else if (argv._.length === 1) {
    // When a command is given

    const command = argv._[0]
    assert(typeof command === 'string')
    // Set current command
    setCurrentCommand(command)

    if (argv.r && argv.e) {
      const record = await getRecord()
      console.log(JSON.stringify(record, undefined, 2))
    } else if (argv.e) {
      const env = await invokeEnv()
      console.log(JSON.stringify(env, undefined, 2))
    } else if (argv.r) {
      const records = await getRecords()
      console.log(JSON.stringify(records, undefined, 2))
    } else {
      await saveStore()
    }
  } else {
    console.error(' Too many commands. Only one command is allowed.')
  }
}
