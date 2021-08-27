import fs from 'fs'
import path from 'path'
import { program } from 'commander'
import {
  setCurrentCommand,
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
  program.name('haetae').version(version).usage('[options] [command]')

  program
    .option(
      '-c, --config [path]',
      'config file directory or filename. (It can be relative or absolute.) (default: $HAETAE_CONFIG_FILE or ./haetae.config.js)',
    )
    .option(
      '-j, --json',
      "print output to json if possible. (This doesn't affect to commands which has fixed format, or already json format)",
      false,
    )
    .option('--no-color', 'disable colorized output', false)

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

  const config = await (async () => {
    try {
      // We need to await to catch error even if retuning a Promise.
      return await getConfig({
        filename: options.config, // if undefined, it would be replaced by default argument
      })
    } catch (error) {
      return undefined
    }
  })()

  // todo: impl global error handler
  const store = await getStore({ config })
  program
    .command('store')
    .description('show content of store file')
    .action(async () => {
      console.log(JSON.stringify(store, null, 2))
    })
  if (!config) {
    const message = 'Config file is not given.'
    if (options.json) {
      console.error(JSON.stringify({ result: 'error', message }, null, 2))
    } else {
      console.error(`{red [ERROR]} ${message}`)
    }
  } else {
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
                  const record = await getRecord({
                    env: await invokeEnv({ config }),
                    store: getStore({ config }),
                  })
                  console.log(JSON.stringify(record, null, 2))
                })
            }
            // else {
            // todo: haetae store, haetae [command] records, haetae [command] record
            // }
          }
        }
        cmd
          .command('records')
          .description('print every records of given command.')
          .action(async () => {
            setCurrentCommand(command)
            const records = await getRecords({
              store,
            })
            if (!records) {
              const message = 'Not found from the store file.'
              if (options.json) {
                console.log(
                  JSON.stringify({ result: 'error', message }, null, 2),
                )
              } else {
                console.log(`{blue [INFO]} ${message}`)
              }
            } else {
              console.log(JSON.stringify(records, null, 2))
            }
          })
        cmd
          .command('record')
          .description('print record of given command and current env.')
          .action(async () => {
            setCurrentCommand(command)
            const env = await invokeEnv({ config })
            const record = await getRecord({
              store,
              env,
            })
            if (!record) {
              const message = 'Not found from the store file.'
              if (options.json) {
                console.log(
                  JSON.stringify({ result: 'error', message }, null, 2),
                )
              } else {
                console.log(chalk`{blue [INFO]} ${message}`)
              }
            } else {
              console.log(JSON.stringify(record, null, 2))
            }
          })
      }
    }
  }

  program.parse(process.argv)
}

main()
