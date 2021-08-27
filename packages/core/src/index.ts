import path from 'path'
import { strict as assert } from 'assert'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
// eslint-disable-next-line import/no-extraneous-dependencies
import { Required } from 'utility-types'
import fs from 'fs'
import deepEqual from 'deep-equal'

export const { version } = (() => {
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'package.json'),
    'utf8',
  )
  return JSON.parse(content)
})()

let currentCommand: string | null = null

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

/**
 * @memoized
 */
export const getConfigFilenameFromEnvVar = memoizee((): string => {
  const pathValue = process.env.HAETAE_CONFIG_FILE as string
  assert(pathValue, '$HAETAE_CONFIG_FILE is not given.')
  try {
    if (fs.statSync(pathValue).isDirectory()) {
      const filename = path.join(pathValue as string, defaultConfigFile)
      assert(fs.existsSync(filename), '$HAETAE_CONFIG_FILE is invalid')
      return filename
    }
    return pathValue
  } catch (error) {
    throw new Error('$HAETAE_CONFIG_FILE is non-existent path.')
  }
})

export const getConfigDirnameFromEnvVar = () =>
  path.dirname(getConfigFilenameFromEnvVar())

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

export interface SubCommandTargetOptions {
  prevRecord?: HaetaeRecord | undefined
}
export interface SubCommandEnvOptions {
  coreVersion: string
}
export interface SubCommandSaveOptions {
  prevRecord?: HaetaeRecord | undefined
}

export interface HaetaePreCommand {
  target: (options: SubCommandTargetOptions) => string[] | Promise<string[]>
  env?: (
    options: SubCommandEnvOptions,
  ) => HaetaeRecordEnv | Promise<HaetaeRecordEnv>
  save: (
    options: SubCommandSaveOptions,
  ) => HaetaePreRecord | Promise<HaetaePreRecord>
}

export type HaetaeCommand = Required<HaetaePreCommand, 'env'>

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
  configDirname: string = getConfigDirnameFromEnvVar(),
) => path.join(configDirname, defaultStoreFile)

export const defaultSubCommandEnv = ({
  coreVersion,
}: SubCommandEnvOptions) => ({
  coreVersion,
})

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
      assert(
        typeof commands[command].target === 'function',
        `commands.${command}.target is required, but has invalid value.`,
      )
      assert(
        typeof commands[command].save === 'function',
        `commands.${command}.save function is required, but has invalid value.`,
      )
      assert(
        commands[command].env === undefined ||
          typeof commands[command].env === 'function',
        `commands.${command}.target is not undefined, but not a function.`,
      )
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
    filename = getConfigFilenameFromEnvVar(),
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
    delete preConfigFromFile.default
    const preConfig: HaetaePreConfig = configure(preConfigFromFile)
    for (const command in preConfig.commands) {
      if (Object.prototype.hasOwnProperty.call(preConfig.commands, command)) {
        // eslint-disable-next-line no-param-reassign
        preConfig.commands[command].env =
          preConfig.commands[command].env || defaultSubCommandEnv
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
 * @memoized
 */
export const getStore = memoizee(
  async ({
    config = getConfig(),
    fallback = initNewStore,
  }: GetStoreOptions = {}): Promise<HaetaeStore> => {
    const resolvedFilename = (await config).storeFile
    try {
      const store = await import(resolvedFilename)
      delete store.default
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
}: GetRecordsOptions = {}): Promise<HaetaeRecord[]> {
  return (await store).commands[await command]
}

export interface GetRecordOptions extends GetRecordsOptions {
  env?: HaetaeRecordEnv | Promise<HaetaeRecordEnv>
}

export interface InvokeEnvOptions {
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
  }: InvokeEnvOptions = {}): Promise<HaetaeRecordEnv> =>
    (await config)?.commands[await command]?.env({ coreVersion: version }),
  {
    normalizer: serialize,
  },
)

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
  for (const record of records) {
    if (deepEqual(env, record.env)) {
      return record
    }
  }
  return undefined
}

export interface InvokeTargetOrSaveOptions {
  command?: string | Promise<string>
  config?: HaetaeConfig | Promise<HaetaeConfig>
  store?: HaetaeStore | Promise<HaetaeStore>
  env?: HaetaeRecordEnv | Promise<HaetaeRecordEnv> // current env
}

type InvokeTargetOptions = InvokeTargetOrSaveOptions

/**
 * @memoized
 */
export const invokeTarget = memoizee(
  async ({
    command = getCurrentCommand(),
    config = getConfig(),
    store = getStore({ config }),
    env = invokeEnv({ command, config }),
  }: InvokeTargetOptions = {}): Promise<string[]> => {
    const prevRecord = await getRecord({
      command,
      env: (await env) || (await invokeEnv({ command, config })),
      store,
    })
    return (await config).commands[await command].target({
      prevRecord,
    })
  },
  {
    normalizer: serialize,
  },
)

export type InvokeSaveOptions = InvokeTargetOrSaveOptions

/**
 * @memoized
 */
export const invokeSave = memoizee(
  async ({
    command = getCurrentCommand(),
    config = getConfig(),
    store = getStore({ config }),
    env = invokeEnv({ command, config }),
  }: InvokeSaveOptions = {}): Promise<HaetaePreRecord> => {
    const prevRecord = await getRecord({
      command,
      env,
      store,
    })
    return (await config).commands[await command].save({
      prevRecord,
    })
  },
  {
    normalizer: serialize,
  },
)

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

export interface MapStoreOptions extends InvokeTargetOrSaveOptions {
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
    preRecord: invokeSave({ command, env, store, config }),
  }),
}: MapStoreOptions = {}) {
  // todo: deep copy the store
  // eslint-disable-next-line no-param-reassign
  store = await store
  // eslint-disable-next-line no-param-reassign
  store.version = version
  // eslint-disable-next-line no-param-reassign
  store.commands[await command] = store.commands[await command] || []

  for (
    let index = 0;
    index < store.commands[await command].length;
    index += 1
  ) {
    const prevRecord = store.commands[await command][index]
    if (deepEqual(await env, prevRecord.env)) {
      // eslint-disable-next-line no-param-reassign
      store.commands[await command][index] = await record
      return store
    }
  }
  store.commands[await command].push(await record)
  return store
}

export interface SaveStoreOptions {
  store: HaetaeStore
  config?: HaetaeConfig | Promise<HaetaeConfig>
}

export async function saveStore({
  store,
  config = getConfig(),
}: SaveStoreOptions) {
  fs.writeFileSync(
    (await config).storeFile,
    `${JSON.stringify(store, null, 2)}\n`, // trailing empty line
  )
  getStore.clear() // memoization cache clear
}
