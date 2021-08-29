import fs from 'fs'
import path from 'path'
import { createCommand } from 'commander'
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

import {
  setCurrentCommand,
  setConfigFilename,
  getConfig,
  invokeEnv,
  invokeTarget,
  invokeSubcommand,
  getStore,
  saveStore,
  getRecord,
  getRecords,
} from '@haetae/core'

export const { version } = (() => {
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'package.json'),
    'utf8',
  )
  return JSON.parse(content)
})()

export async function createCommanderProgram() {
  /**
   * The CLI should be dynamically created by reading config file,
   * whose path is given by `--config` option from the user.
   * For commander, in order to read any options from user,
   * `program.parse(process.argv)` should be called.
   * However, it has side effect, thus is not proper to invoke before finishing building the CLI.
   * Hence, hereby yargs is used for getting root options (e.g. `--config`),
   * which does not have a side effect.
   * Maybe, in future, we might consider replacing commander by yargs entirely.
   * However, the CLI is already written with commander,
   * so it's not one of priorities, and may not be needed at all.
   */
  const rootOptions = {
    config: undefined,
    json: false,
    color: true,
    ...yargs(hideBin(process.argv))
      .alias('c', 'config')
      .alias('j', 'json')
      .help(false) // Needed for yargs not to catch --help option before commander gets it.
      .version(false).argv, // Needed for yargs not to catch --version option before commander gets it.
  }

  // program.parse(process.argv) // DO NOT call this to get rootOptions. Instead, use yargs.

  process.env.FORCE_COLOR = rootOptions.color ? '3' : '0'
  // `chalk` (https://www.npmjs.com/package/chalk) use $FORCE_COLOR
  // `chalk` should be dynamically imported after setting process.env.FORCE_COLOR
  const chalk = (await import('chalk')).default

  const config = await (async () => {
    try {
      setConfigFilename(rootOptions.config as string | undefined) // update config filename
      // We need to await to catch error even if retuning a Promise.
      return await getConfig()
    } catch (error) {
      return undefined
    }
  })()

  // todo: impl global error handler

  if (!config) {
    const message = 'Config file is not given.'
    if (rootOptions.json) {
      console.error(JSON.stringify({ result: 'error', message }, null, 2))
    } else {
      console.error(chalk`{red [ERROR]} ${message}`)
    }
    return
  }
  const program = createCommand('haetae')
    // program
    // .name('haetae')
    .version(version, '-v, --version', 'Show the version.')
    .usage(
      // '[root options] <command> [command options] [<subcommand> [subcommand options]]',
      '[options] <command> [options] [<subcommand> [options]]',
    )
    .description(
      [
        chalk`Incremental test, lint, build and more.`,
        chalk`For any languages, platforms, and frameworks.`,
        chalk`{blue.bold The CLI dynamically (at runtime) produces commands and subcommands by your config file.}`,
      ].join('\n'),
    )
    .option(
      '-c, --config <path>',
      'Config file directory or filename. It can be relative or absolute. (default: $HAETAE_CONFIG_FILE or ./haetae.config.js)',
    )
    .option(
      '-j, --json',
      "Format output to json if possible. This doesn't affect to commands which has fixed format, or already json format.",
      false,
    )
    .option(
      '    --no-color',
      'Disable colorized (e.g. red for error) / decorated (e.g. bold text) output.',
      false,
    )
    .helpOption('-h, --help', 'Show helpful descriptions.')
    .addHelpText(
      'after',
      [
        '\nRepo for any issues, questions and contribution(\u{1f496}):',
        chalk`{green   https://github.com/jjangga0214/haetae}`,
      ].join('\n'),
    )
    .addHelpText(
      'after',
      [
        chalk`\nExamples:`,
        chalk`  $ haetae store`,
        chalk`  $ haetae --config /path/to/haetae.config.js test records {dim.bold # [NOTE] "records" is plural.}`,
        chalk`  $ haetae --no-color lint record  {dim.bold # [NOTE] "record" is singular.}`,
        chalk`  $ haetae test target | jest {dim.bold # [NOTE] pipeline to your test runner}`,
        chalk`  $ haetae lint target | eslint {dim.bold # [NOTE] pipeline to your linter/formatter}`,
        chalk`  $ haetae --json test target | your-json-operator | your-test-runner`,
        chalk`  $ haetae build env`,
        chalk`  $ haetae lint save`,
        chalk`  $ haetae build --help`,
      ].join('\n'),
    )
    .addHelpCommand(false) // `help` command can be replaced by `--help` option.

  program
    .command('store')
    .description('Show content of store file.')
    .action(async () => {
      console.log(JSON.stringify(await getStore({ config }), null, 2))
    })
  // dynamically add commands and subcommands by reading config file.
  for (const command in config.commands) {
    if (Object.prototype.hasOwnProperty.call(config.commands, command)) {
      const cmd = program
        .command(command)
        .description('User-defined command from config.')
        .addHelpCommand(false) // `help` command can be replaced by `--help` option.
      for (const subcommand in config.commands[command]) {
        if (
          Object.prototype.hasOwnProperty.call(
            config.commands[command],
            subcommand,
          )
        ) {
          const subCmd = cmd.command(subcommand)
          if (subcommand === 'env') {
            subCmd.description('Show current env object.').action(async () => {
              setCurrentCommand(command)
              const env = await invokeEnv({ config })
              console.log(JSON.stringify(env, null, 2))
            })
          } else if (subcommand === 'target') {
            subCmd.description('Show targets.').action(
              async (
                _,
                {
                  parent: {
                    parent: { options: rootOptions },
                  },
                },
              ) => {
                setCurrentCommand(command)
                const targets = await invokeTarget({ config })
                if (rootOptions.json) {
                  console.log(JSON.stringify(targets, null, 2))
                } else {
                  console.log(targets.join('\n'))
                }
              },
            )
          } else if (subcommand === 'save') {
            subCmd
              .description(
                'Save a new record to store file and show the new record.',
              )
              .action(async () => {
                setCurrentCommand(command)
                await saveStore({
                  config,
                })
                const record = await getRecord()
                console.log(JSON.stringify(record, null, 2))
              })
          } else {
            subCmd
              .description('User-defined subcommand from config.')
              .action(async () => {
                setCurrentCommand(command)
                const res = await invokeSubcommand({ subcommand })
                console.log(JSON.stringify(res, null, 2))
              })
          }
        }
      } // end for loop
      cmd
        .command('records')
        .description('Show every records of given command.')
        .action(
          async (
            _,
            {
              parent: {
                parent: { options: rootOptions },
              },
            },
          ) => {
            setCurrentCommand(command)
            const records = await getRecords()
            if (!records) {
              const message = 'Not found from the store file.'
              if (rootOptions.json) {
                console.log(
                  JSON.stringify({ result: 'error', message }, null, 2),
                )
              } else {
                console.log(chalk`{blue [INFO]} ${message}`)
              }
            } else {
              console.log(JSON.stringify(records, null, 2))
            }
          },
        )
      cmd
        .command('record')
        .description('Show record of given command and current env.')
        .action(
          async (
            _,
            {
              parent: {
                parent: { options: rootOptions },
              },
            },
          ) => {
            setCurrentCommand(command)
            const env = await invokeEnv({ config })
            const record = await getRecord({
              env,
            })
            if (!record) {
              const message = 'Not found from the store file.'
              if (rootOptions.json) {
                console.log(
                  JSON.stringify({ result: 'error', message }, null, 2),
                )
              } else {
                console.log(chalk`{blue [INFO]} ${message}`)
              }
            } else {
              console.log(JSON.stringify(record, null, 2))
            }
          },
        )
    }
  }

  return program
}
