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
  mapStore,
} from '@haetae/core'
import assert from 'assert/strict'

export const { version: packageVersion } = (() => {
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'package.json'),
    'utf8',
  )
  return JSON.parse(content) as { version: string }
})()

export const packageName = '@haetae/cli'

export async function run() {
  const y = await yargs(hideBin(process.argv))
    .scriptName('haetae')
    .usage('$0 [options] <command>')
    .alias('h', 'help')
    .alias('v', 'version')
    .options({
      c: {
        alias: 'config',
        type: 'string',
        description: `Config file path. Default to an environment variable $HAETAE_CONFIG_FILE or "${defaultConfigFile}"`,
        default: process.env.HAETAE_CONFIG_FILE,
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
        default: false,
      },
      d: {
        alias: 'record-data',
        type: 'boolean',
        description: 'All/partial record(s) data',
        default: false,
      },
      e: {
        alias: 'env',
        type: 'boolean',
        description: 'Current environment',
        default: false,
      },
    })
    .conflicts('r', 'd')
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
      ['$0 -d <command>', 'Show all records data of the given command'],
      ['$0 -e <command>', 'Show current env of the given command'],
      [
        '$0 -r -e <command>',
        'Show a record of current env of the given command',
      ],
      [
        '$0 -d -e <command>',
        'Show a record data of current env of the given command',
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

  // 2. Get store
  // If `argv.s` is undefined, `filename` will be resolved as default value
  // Why function, not value? Because `invokeEnv` for `-e` alone does not need store.
  // Therefore, lazy loading is needed.
  const store = () => getStore({ filename: argv.s })

  // 3. Run
  if (argv._.length === 0) {
    // 3.1. When command is not given

    assert(!argv.e, 'Option "e" must be given with <command>')
    assert(argv.r, 'Option "r" must be given when <command> is not given')

    console.log(JSON.stringify(await store(), undefined, 2))
  } else if (argv._.length === 1) {
    // 3.2. When a command is given

    const command = argv._[0]
    assert(typeof command === 'string')
    // Set current command
    setCurrentCommand(command)

    if (argv.r && argv.e) {
      const record = await getRecord({ store: await store() })
      // TODO: when undefined
      console.log(JSON.stringify(record, undefined, 2))
    } else if (argv.d && argv.e) {
      const record = await getRecord({ store: await store() })
      // TODO: when undefined
      console.log(JSON.stringify(record?.data, undefined, 2))
    } else if (argv.e) {
      const env = await invokeEnv()
      console.log(JSON.stringify(env, undefined, 2))
    } else if (argv.r) {
      const records = await getRecords({ store: await store() })
      // TODO: when undefined or empty object
      console.log(JSON.stringify(records, undefined, 2))
    } else if (argv.d) {
      const records = await getRecords({ store: await store() })
      // TODO: when undefined or empty object
      if (records) {
        const dataList = records.map((r) => r.data)
        console.log(JSON.stringify(dataList, undefined, 2))
      }
    } else {
      await saveStore({
        // if `argv.s` is undefined, `filename` will be resolved as default value
        filename: argv.s,
        store: mapStore({
          store: await store(),
        }),
      })
    }
  } else {
    // 3.3. When multiple commands are given
    console.error(' Too many commands. Only one command is allowed.')
  }
}
