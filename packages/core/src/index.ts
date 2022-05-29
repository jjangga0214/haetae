import path from 'path'
import { strict as assert } from 'assert'
import fs from 'fs'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
// eslint-disable-next-line import/no-extraneous-dependencies
import { Required, Optional } from 'utility-types'
import produce from 'immer'
import deepEqual from 'deep-equal'

export const { version } = (() => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'package.json'), {
    encoding: 'utf8',
  })
  return JSON.parse(content)
})()

let currentCommand: string | undefined

export const setCurrentCommand = (command: string) => {
  currentCommand = command
}

export const getCurrentCommand = (): string => {
  if (!currentCommand) {
    throw new Error(
      `currentCommand has invalid value or not set: ${currentCommand}`,
    )
  }
  return currentCommand
}

export const defaultConfigFile = 'haetae.config.js'

let configFilename: string | undefined

export const setConfigFilename = (filename: string | undefined) => {
  configFilename = filename
}

/**
 * @memoized
 */
export const getConfigFilename = memoizee((): string => {
  // TODO: finding config file recursively(parental)
  let filename =
    configFilename || (process.env.HAETAE_CONFIG_FILE as string) || '.'
  assert(filename, '$HAETAE_CONFIG_FILE is not given.')
  if (!path.isAbsolute(filename)) {
    filename = path.join(process.cwd(), filename)
  }
  try {
    if (fs.statSync(filename).isDirectory()) {
      filename = path.join(filename, defaultConfigFile)
      assert(fs.existsSync(filename), 'Path to config file is invalid')
      return filename
    }
    return filename
  } catch (error) {
    throw new Error('Path to config file is non-existent path.')
  }
})

// todo: set/get current config dirname
export const getConfigDirname = () => path.dirname(getConfigFilename())

export type HaetaeRecordEnv = Record<string, unknown>

export interface HaetaeRecord {
  time: string // ISO format
  env: HaetaeRecordEnv
  // '@haetae/git'?: {
  //   gitSha: string
  // }
  [key: string]: unknown
}

export type HaetaePreRecord = Omit<HaetaeRecord, 'time' | 'env'>

export interface HaetaeStore {
  version: string
  commands: {
    [command: string]: HaetaeRecord[]
  }
}

export interface HaetaeCommand {
  target: () => string[] | Promise<string[]>
  env: () => HaetaeRecordEnv | Promise<HaetaeRecordEnv>
  save: () => HaetaePreRecord | Promise<HaetaePreRecord>
  [subcommand: string]: () => unknown // This can be async functoin
}

export type HaetaePreCommand = Optional<
  HaetaeCommand,
  'target' | 'env' | 'save'
>

export interface HaetaePreConfig<Command = HaetaePreCommand> {
  commands: {
    [command: string]: Command
  }
  // maxLimit?: number // Infinity
  // maxAge?: number // Infinity
  // It should be an absolute or relative path (relative to config file path)
  storeFile?: string
}

export type HaetaeConfig = Required<HaetaePreConfig<HaetaeCommand>, 'storeFile'>

export const defaultStoreFile = 'haetae.store.json'
export const getDefaultStoreFilename = (
  configDirname: string = getConfigDirname(),
) => path.join(configDirname, defaultStoreFile)

/**
 *
 * @param preConfig: config object provided from user.
 * @returns
 */
export function configure({
  commands,
  storeFile,
}: HaetaePreConfig): HaetaePreConfig {
  for (const command in commands) {
    if (Object.prototype.hasOwnProperty.call(commands, command)) {
      for (const subcommand in commands[command]) {
        if (
          Object.prototype.hasOwnProperty.call(commands[command], subcommand)
        ) {
          assert(
            typeof commands[command][subcommand] === 'function',
            `commands.${command}.${subcommand} is invalid. It should be a function.`,
          )
        }
      }
    }
  }
  return {
    storeFile,
    commands,
  }
}

export interface GetConfigOptions {
  filename?: string | Promise<string> // It should be an absolute path
}

/**
 * The function will fill in default values if not already configured..
 * @memoized
 */
export const getConfig = memoizee(
  async ({
    filename = getConfigFilename(),
  }: GetConfigOptions = {}): Promise<HaetaeConfig> => {
    let configFilename = await filename
    try {
      if (fs.statSync(configFilename).isDirectory()) {
        configFilename = path.join(configFilename, defaultConfigFile)
      }
    } catch (error) {
      throw new Error(
        `Config filename is given as "${configFilename}", but it does not exist.`,
      )
    }

    const preConfigFromFile = await import(configFilename)
    // delete preConfigFromFile.default
    const preConfig: HaetaePreConfig = configure(preConfigFromFile)
    for (const command in preConfig.commands) {
      if (Object.prototype.hasOwnProperty.call(preConfig.commands, command)) {
        // eslint-disable-next-line no-param-reassign
        preConfig.commands[command].env =
          preConfig.commands[command].env || (() => ({}))
      }
    }
    if (!preConfig.storeFile) {
      // It becomes an absolute path, as path.dirname(filename) is also an absolute path.
      preConfig.storeFile = getDefaultStoreFilename(
        path.dirname(configFilename),
      )
    }

    if (!path.isAbsolute(preConfig.storeFile)) {
      preConfig.storeFile = path.join(
        path.dirname(configFilename),
        preConfig.storeFile,
      )
    }

    if (!preConfig.storeFile.endsWith('.json')) {
      preConfig.storeFile = getDefaultStoreFilename(
        path.dirname(preConfig.storeFile),
      )
    }

    return preConfig as HaetaeConfig
  },
  {
    normalizer: serialize,
  },
)

export function initNewStore(): HaetaeStore {
  return { version, commands: {} }
}

export interface GetStoreOptions {
  config?: HaetaeConfig | Promise<HaetaeConfig>
  // When there's no store file yet.
  fallback?: () => HaetaeStore | Promise<HaetaeStore>
}

/**
 * @throw if the file does not exist
 * config.storeFile should be absolute path
 * @memoized
 */
export const getStore = memoizee(
  async ({
    config = getConfig(),
    fallback = initNewStore,
  }: GetStoreOptions = {}): Promise<HaetaeStore> => {
    const filename = (await config).storeFile
    try {
      const rawStore = fs.readFileSync(filename, {
        encoding: 'utf8',
      })
      const store = JSON.parse(rawStore)
      return store
    } catch (error) {
      return fallback()
    }
  },
  {
    normalizer: serialize,
  },
)
export interface GetRecordsOptions {
  command?: string | Promise<string> // record store file path
  store?: HaetaeStore | Promise<HaetaeStore>
}

export async function getRecords({
  command = getCurrentCommand(),
  store = getStore(),
}: GetRecordsOptions = {}): Promise<HaetaeRecord[] | undefined> {
  return (await store).commands[await command]
}

export interface InvokeReservedDynamicSubcommandOptions {
  command?: string | Promise<string>
  config?: HaetaeConfig | Promise<HaetaeConfig>
}

/**
 * @memoized
 */
export const invokeEnv = memoizee(
  async ({
    command = getCurrentCommand(),
    config = getConfig(),
  }: InvokeReservedDynamicSubcommandOptions = {}): Promise<HaetaeRecordEnv> =>
    (await config)?.commands[await command]?.env(),
  {
    normalizer: serialize,
  },
)

export interface GetRecordOptions extends GetRecordsOptions {
  env?: HaetaeRecordEnv | Promise<HaetaeRecordEnv>
}

/**
 * The 'Env' in the function name does not mean environment variable.
 * It means `HaetaeRecordEnv`
 */
export async function getRecord({
  command = getCurrentCommand(),
  env = invokeEnv({ command }),
  store = getStore(),
}: GetRecordOptions = {}): Promise<HaetaeRecord | undefined> {
  const records = await getRecords({ command, store })
  if (records) {
    for (const record of records) {
      if (deepEqual(await env, record.env)) {
        return record
      }
    }
  }

  return undefined
}

/**
 * @memoized
 */
export const invokeTarget = memoizee(
  async ({
    command = getCurrentCommand(),
    config = getConfig(),
  }: InvokeReservedDynamicSubcommandOptions = {}): Promise<string[]> =>
    (await config).commands[await command].target(),
  {
    normalizer: serialize,
  },
)

/**
 * @memoized
 */
export const invokeSave = memoizee(
  async ({
    command = getCurrentCommand(),
    config = getConfig(),
  }: InvokeReservedDynamicSubcommandOptions = {}): Promise<HaetaePreRecord> => {
    // NOTE: `prevRecord` and `preRecord` have different meanings.
    const preRecord = await (await config).commands[await command].save()
    assert(
      preRecord.time === undefined,
      'A Reserved Dynamic Subcommand `save` should not return an object with a key named "time". The key "time" is statically reserved by Haetae, and automatically filled in.',
    )
    assert(
      preRecord.env === undefined,
      'A Reserved Dynamic Subcommand `save` should not return an object with a key named "env". The key "env" is statically reserved by Haetae, and automatically filled in.',
    )
    return preRecord
  },
  {
    normalizer: serialize,
  },
)

export interface InvokeSubcommandOptions
  extends InvokeReservedDynamicSubcommandOptions {
  subcommand: string
}

export const invokeSubcommand = async ({
  command = getCurrentCommand(),
  config = getConfig(),
  subcommand,
}: InvokeSubcommandOptions): Promise<unknown> => {
  assert(
    subcommand !== 'env',
    'Reserved Dynamic Subcommands have dedicated functions. For `env`, call `invokeEnv` directly.',
  )
  assert(
    subcommand !== 'target',
    'Reserved Dynamic Subcommands have dedicated functions. For `target`, call `invokeTarget` directly.',
  )
  assert(
    subcommand !== 'save',
    'Reserved Dynamic Subcommands have dedicated functions. For `save`, call `invokeSave` directly.',
  )

  return (await config).commands[await command][subcommand]()
}

export interface MapRecordOptions {
  env: HaetaeRecordEnv | Promise<HaetaeRecordEnv>
  // "pre" is different from "prev", which means "previous". Instead, "pre" means "given from user's config", so default values should be filled in."
  preRecord: HaetaePreRecord | Promise<HaetaePreRecord>
}

export async function mapRecord({
  env,
  preRecord,
}: MapRecordOptions): Promise<HaetaeRecord> {
  return {
    time: new Date().toISOString(),
    env: await env,
    ...(await preRecord),
  }
}

export interface MapStoreOptions {
  command?: string | Promise<string>
  store?: HaetaeStore | Promise<HaetaeStore>
  env?: HaetaeRecordEnv | Promise<HaetaeRecordEnv>
  config?: HaetaeConfig | Promise<HaetaeConfig>
  record?: HaetaeRecord | Promise<HaetaeRecord>
}

/**
 * This creates a new store from previous store
 * The term map is coined from map function
 */
export async function mapStore({
  command = getCurrentCommand(),
  config = getConfig(),
  store = getStore({ config }),
  env = invokeEnv({ command, config }),
  record = mapRecord({
    env,
    preRecord: invokeSave({ command, config }),
  }),
}: MapStoreOptions = {}) {
  return produce(await store, async (draft) => {
    /* eslint-disable no-param-reassign */
    draft.version = version
    draft.commands = draft.commands || {}
    draft.commands[await command] = draft.commands[await command] || []

    for (
      let index = 0;
      index < draft.commands[await command].length;
      index += 1
    ) {
      const oldRecord = draft.commands[await command][index]
      if (deepEqual(await env, oldRecord.env)) {
        draft.commands[await command][index] = await record
        return draft
      }
    }
    draft.commands[await command].push(await record)
    /* eslint-enable no-param-reassign */
    return draft
  })
}

export interface SaveStoreOptions {
  config?: HaetaeConfig | Promise<HaetaeConfig>
  store?: HaetaeStore | Promise<HaetaeStore>
}

export async function saveStore({
  config = getConfig(),
  store = mapStore({ config }),
}: SaveStoreOptions = {}) {
  fs.writeFileSync(
    (await config).storeFile,
    `${JSON.stringify(await store, null, 2)}\n`, // trailing empty line
    {
      encoding: 'utf8',
    },
  )
  getStore.clear() // memoization cache clear
}
