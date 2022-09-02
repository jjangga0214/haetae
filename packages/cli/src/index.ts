#!/usr/bin/env node
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import assert from 'assert/strict'
import signale from 'signale'
import chalk from 'chalk'
import clipboard from 'clipboardy'
import stripAnsi from 'strip-ansi'
import { dirname } from 'dirname-filename-esm'
import {
  setCurrentCommand,
  invokeEnv,
  setConfigFilename,
  defaultConfigFiles,
  defaultStoreFile,
  saveStore,
  getStore,
  getRecord,
  getRecords,
  setStoreFilename,
} from '@haetae/core'
import { parsePkg } from '@haetae/common'
import { getInfo } from './info.js'
import * as ui from './ui.js'

export const pkg = parsePkg({
  name: '@haetae/cli',
  rootDir: dirname(import.meta),
})

export async function run(): Promise<void> {
  let y
  try {
    y = await yargs(hideBin(process.argv))
      .scriptName('haetae')
      .usage('$0 [options] <command>')
      .alias('h', 'help')
      .alias('v', 'version')
      .options({
        c: {
          alias: 'config',
          type: 'string',
          description: `Config file path. Default to an environment variable $HAETAE_CONFIG_FILE or finding one of ${defaultConfigFiles.join(
            ', ',
          )} by walking up parent directories.`,
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
        d: {
          alias: 'record-data',
          type: 'boolean',
          description: 'All/partial record(s) data',
        },
        e: {
          alias: 'env',
          type: 'boolean',
          description: 'Current environment',
        },
        i: {
          alias: 'info',
          type: 'boolean',
          description: 'System, binary, dependencies information',
        },
        j: {
          alias: 'json',
          type: 'boolean',
          description: 'Print output in JSON format (for programmatic use)',
        },
      })
      .conflicts('r', 'd')
      .conflicts('i', 'c')
      .conflicts('i', 's')
      .conflicts('i', 'r')
      .conflicts('i', 'd')
      .conflicts('i', 'e')
      .example([
        [`$0 -c ./${defaultConfigFiles[0]} <...>`, 'Specify config file path.'],
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
        [
          '$0 -i',
          'Show your system, binary, dependencies information needed for reporting an issue on GitHub repository',
        ],
      ])

    // `y` should be instantiated for type check. Do NOT create `argv` directly.
    const argv = await y.argv

    if (argv.i) {
      assert(argv._.length === 0, 'Option `-i` cannot be used with <command>.')
    }
    if (argv.e) {
      assert(argv._.length > 0, 'Option `-e` must be given with <command>.')
    }
    if (argv.j) {
      assert(
        argv.r || argv.d || argv.e || argv.i,
        'Option `-j` must be given with at least one of `-r`, `-d`, `-e`, `-i`.',
      )
    }

    // 1. Set config file path

    // Throws error if config file does not exist.
    setConfigFilename({
      filename: argv.c || process.env.HAETAE_CONFIG_FILE,
    })

    // 2. Set store file path
    if (argv.s) {
      setStoreFilename({
        filename: argv.s,
      })
    }

    // 3. Run
    if (argv._.length === 0) {
      // 3.1. When command is not given

      if (argv.r) {
        const haetaeStore = await getStore({
          fallback: ({ error }) => {
            throw error
          },
        })

        const message = `${chalk.dim('Store is loaded successfully.')}`
        if (argv.j) {
          ui.json.success(message, haetaeStore)
        } else {
          const result = await ui.processStore(haetaeStore)
          signale.success(chalk.dim(`The store is successfully loaded\n`))
          console.log(result)
        }
      } else if (argv.i) {
        const info = await getInfo()
        if (argv.j) {
          ui.json.success(
            'You can paste this information when creating an issue from https://github.com/jjangga0214/haetae/issues',
            info,
          )
        } else {
          signale.info(
            `${chalk.dim(
              'Your runtime information is copied to the clipboard without color code. Paste it when creating an issue.\n',
            )}${chalk.bold.blue('➜ ')}${chalk.underline.bold(
              'https://github.com/jjangga0214/haetae/issues',
            )}\n`,
          )
          const message = ui.processInfo(info)
          clipboard.writeSync(stripAnsi(message))
          console.log(message)
        }
      } else {
        throw new Error(
          'Option `-r` or `-i` must be given when <command> is not given.',
        )
      }
    } else if (argv._.length === 1) {
      // 3.2. When a single command is given

      const command = argv._[0]
      assert(typeof command === 'string')
      // Set current command
      setCurrentCommand({
        command,
      })

      if (argv.r && argv.e) {
        const record = await getRecord()
        ui.conditional({
          toJson: !!argv.j,
          message: `${chalk.dim(
            'Record matching with current environment is found for the command',
          )} ${chalk.bold.underline(command)}`,
          noResultMessage: `${chalk.dim(
            'No record matching with current environment is found for the command',
          )} ${chalk.bold.underline(command)}`,
          result: record,
          render: ui.processRecord,
        })
      } else if (argv.d && argv.e) {
        const recordData = (await getRecord())?.data
        ui.conditional({
          toJson: !!argv.j,
          message: `${chalk.dim(
            'Record matching with current environment is found for the command',
          )} ${chalk.bold.underline(command)}`,
          noResultMessage: `${chalk.dim(
            'No record data matching with current environment is found for the command',
          )} ${chalk.bold.underline(command)}`,
          result: recordData,
          render: (result) => ui.asBlock(result),
        })
      } else if (argv.e) {
        const env = await invokeEnv()
        ui.conditional({
          toJson: !!argv.j,
          message: `${chalk.dim(
            'Current environment is successfully executed for the command',
          )} ${chalk.bold.underline(command)}`,
          noResultMessage: `${chalk.dim(
            'Env is defined in config (on command level or root level), but returned `undefined` for the command',
          )} ${chalk.bold.underline(command)}`,
          result: env,
          render: (result) => ui.asBlock(result),
        })
      } else if (argv.r) {
        const records = await getRecords()
        ui.conditional({
          toJson: !!argv.j,
          message: `${chalk.bold.underline(records?.length)} ${chalk.dim(
            'record data are found for the command',
          )} ${chalk.bold.underline(command)}`,
          noResultMessage: `There is no record for the command ${chalk.bold(
            command,
          )}`,
          result: records,
          render: (records) =>
            records.map((record) => ui.processRecord(record)).join('\n\n'),
        })
      } else if (argv.d) {
        const records = await getRecords()
        const recordDataList = records?.map((r) => r.data)
        ui.conditional({
          toJson: !!argv.j,
          message: `${chalk.bold.underline(recordDataList?.length)} ${chalk.dim(
            'records are found for the command',
          )} ${chalk.bold.underline(command)}`,
          noResultMessage: `There is no record for the command ${chalk.bold.underline(
            command,
          )}`,
          result: recordDataList,
          render: (result) =>
            result.map((recordData) => ui.asBlock(recordData)).join('\n\n'),
        })
      } else {
        await saveStore()
        const record = await getRecord()
        assert(
          !!record,
          'Oops! Something went wrong. Record is not found the store even though the command was just executed.',
        )
        const message = `${chalk.dim('Command')} ${chalk.bold.underline(
          command,
        )} ${chalk.dim('is successfully executed.')}`
        if (argv.j) {
          ui.json.success(message, record)
        } else {
          signale.success(`${message}\n`)
          console.log(ui.processRecord(record))
        }
      }
    } else {
      // 3.3. When multiple commands are given
      throw new Error('Too many commands. Only one command is allowed.')
    }
  } catch (error) {
    if ((await y?.argv)?.j) {
      if (error instanceof Error) {
        ui.json.fatal(error.message, error.stack)
      } else if (typeof error === 'string') {
        ui.json.fatal(error, error)
      } else {
        ui.json.fatal('Error occurred.', error)
      }
    } else {
      signale.fatal(error)
    }
    process.exit(1)
  }
}
