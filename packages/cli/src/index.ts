import fs from 'fs'
import path from 'path'
import { program } from 'commander'
import {
  setCurrentCommand,
  setConfigFilename,
  getConfig,
  invokeEnv,
  invokeTarget,
  mapStore,
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

async function main() {
  program
    .name('haetae')
    .version(version, '-v, --version', 'Show the version.')
    .helpOption('-h, --help', 'Show helpful descriptions.')
    .usage(
      // '[root options] <command> [command options] [<subcommand> [subcommand options]]',
      '[options] <command> [<subcommand>]',
    )
    .description(
      [
        'Incremental test, lint, build and more.',
        'For any languages, platforms, and frameworks.',
        'The CLI dynamically (at runtime) produces commands and subcommands by your config file.',
      ].join('\n'),
      // chalk`{blue hello}`,
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
      '--no-color',
      'Disable colorized (e.g. red for error) / decorated (e.g. bold text) output.',
      false,
    )
    .addHelpText(
      'after',
      [
        '\nExamples:',
        '  $ haetae store',
        '  $ haetae --config /path/to/haetae.config.js test records # [NOTE] "records" is plural.',
        '  $ haetae --no-color lint record  # [NOTE] "record" is singular.',
        '  $ haetae --json test target',
        '  $ HAETAE_CONFIG_FILE=/path/to/haetae.config.js haetae lint save',
        '  $ haetae build env',
        '  $ haetae help test',
      ].join('\n'),
    )

  // .option(
  //   '-s, --store <path>',
  //   'Store file directory or filename. It can be relative or absolute.',
  //   'haetae.store.json',
  // )

  program.parse(process.argv)
  const options = program.opts()
  process.env.FORCE_COLOR = options.color ? '3' : '0'
  // `chalk` (https://www.npmjs.com/package/chalk) use $FORCE_COLOR
  // `chalk` should be dynamically imported after setting process.env.FORCE_COLOR
  const chalk = (await import('chalk')).default

  // program.parse(process.argv)
  const config = await (async () => {
    try {
      setConfigFilename(options.config) // update
      // We need to await to catch error even if retuning a Promise.
      return await getConfig()
    } catch (error) {
      console.error(error)
      return undefined
    }
  })()

  // todo: impl global error handler

  if (!config) {
    const message = 'Config file is not given.'
    if (options.json) {
      console.error(JSON.stringify({ result: 'error', message }, null, 2))
    } else {
      console.error(chalk`{red [ERROR]} ${message}`)
    }
    return
  }

  program
    .command('store')
    .description('show content of store file')
    .action(async () => {
      console.log(JSON.stringify(await getStore({ config }), null, 2))
    })
  // dynamically add commands and subcommands by reading config file.
  for (const command in config.commands) {
    if (Object.prototype.hasOwnProperty.call(config.commands, command)) {
      const cmd = program
        .command(command)
        .description('user-defined command from config')
      for (const subCommand in config.commands[command]) {
        if (
          Object.prototype.hasOwnProperty.call(
            config.commands[command],
            subCommand,
          )
        ) {
          const subCmd = cmd.command(subCommand)
          if (subCommand === 'env') {
            subCmd.description('show current env object').action(async () => {
              setCurrentCommand(command)
              const env = await invokeEnv({ config })
              console.log(JSON.stringify(env, null, 2))
            })
          } else if (subCommand === 'target') {
            subCmd.description('show targets').action(async () => {
              setCurrentCommand(command)
              const targets = await invokeTarget({ config })
              if (!options.json) {
                console.log(targets.join('\n'))
              } else {
                console.log(JSON.stringify(targets, null, 2))
              }
            })
          } else if (subCommand === 'save') {
            subCmd
              .description(
                'save a new record to store file and show the new record',
              )
              .action(async () => {
                setCurrentCommand(command)
                const newStore = await mapStore({ config })
                await saveStore({
                  store: newStore,
                  config,
                })
                const record = await getRecord()
                console.log(JSON.stringify(record, null, 2))
              })
          }
        }
      } // end for loop
      cmd
        .command('records')
        .description('print every records of given command.')
        .action(async () => {
          setCurrentCommand(command)
          const records = await getRecords()
          if (!records) {
            const message = 'Not found from the store file.'
            if (options.json) {
              console.log(JSON.stringify({ result: 'error', message }, null, 2))
            } else {
              console.log(chalk`{blue [INFO]} ${message}`)
            }
          } else {
            console.log(JSON.stringify(records, null, 2))
          }
        })
      cmd
        .command('record')
        .description('show record of given command and current env')
        .action(async () => {
          setCurrentCommand(command)
          const env = await invokeEnv({ config })
          const record = await getRecord({
            env,
          })
          if (!record) {
            const message = 'Not found from the store file.'
            if (options.json) {
              console.log(JSON.stringify({ result: 'error', message }, null, 2))
            } else {
              console.log(chalk`{blue [INFO]} ${message}`)
            }
          } else {
            console.log(JSON.stringify(record, null, 2))
          }
        })
    }
  }

  program.parse(process.argv)
}

main()
