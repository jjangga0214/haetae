import fs from 'fs'
import path from 'path'
import {
  setCurrentCommand,
  getConfig,
  invokeEnv,
  invokeTarget,
  mapStore,
  getStore,
  saveStore,
  getRecord,
} from '@haetae/core'
import { program } from 'commander'

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
      '-C, --config [path]',
      'config file directory or filename. It can be relative or absolute. (default: $HAETAE_CONFIG_FILE or ./haetae.config.js)',
    )
    .option(
      '-J, --json',
      "print output to json if possible. (This doesn't affect to commands which has fixed format, or already json format)",
      false,
    )
  // .option(
  //   '-s, --store <path>',
  //   'Store file directory or filename. It can be relative or absolute.',
  //   'haetae.store.json',
  // )

  program.parse(process.argv)
  const options = program.opts()

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

  if (!config) {
    const message = 'Config file is not given.'
    if (options.json) {
      console.error(JSON.stringify({ result: 'error', message }, null, 2))
    } else {
      console.error(`[ERROR] ${message}`)
    }
  } else {
    // dynamically add commands and subcommands by reading config file.
    for (const command in config.commands) {
      if (Object.prototype.hasOwnProperty.call(config.commands, command)) {
        const cmd = program.command(command)
        for (const subCommand in config.commands[command]) {
          if (
            Object.prototype.hasOwnProperty.call(
              config.commands[command],
              subCommand,
            )
          ) {
            const subCmd = cmd.command(subCommand)
            if (subCommand === 'env') {
              subCmd
                .description('print current env object')
                .action(async () => {
                  setCurrentCommand(command)
                  const env = await invokeEnv({ config })
                  console.log(JSON.stringify(env, null, 2))
                })
            } else if (subCommand === 'target') {
              subCmd.description('print target').action(async () => {
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
                .description('save new record to store file')
                .action(async () => {
                  setCurrentCommand(command)
                  const newStore = await mapStore({ config })
                  saveStore({
                    store: newStore,
                    config,
                  })
                  const record = getRecord({
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
      }
    }
  }

  program.parse(process.argv)
}

main()
