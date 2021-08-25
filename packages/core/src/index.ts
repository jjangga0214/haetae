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
  assert(pathValue, '$HAETAE_CONFIG_FILE is invalid')
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
  // '@haetae/loader-git'?: {
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
    const resolvedFilename = await filename
    const preConfigFromFile = await import(resolvedFilename)
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
        path.dirname(resolvedFilename),
      )
    }

    if (!path.isAbsolute(preConfig.storeFile)) {
      preConfig.storeFile = path.join(
        path.dirname(resolvedFilename),
        preConfig.storeFile,
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
  // It should be an absolute path
  filename?: string | Promise<string>
  // When there's no store file yet.
  defaultStore?: HaetaeStore | Promise<HaetaeStore>
}

/**
 * @throw if the file does not exist
 * @memoized
 */
export const getStore = memoizee(
  async ({
    filename = getConfig().then((config) => config.storeFile),
    defaultStore = initNewStore(),
  }: GetStoreOptions = {}): Promise<HaetaeStore> => {
    const resolvedFilename = await filename
    try {
      return import(resolvedFilename)
    } catch (error) {
      return defaultStore
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
  }: InvokeEnvOptions = {}) =>
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
    store = getStore(),
    env = invokeEnv({ command, config }),
  }: InvokeTargetOptions = {}) => {
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
    store = getStore(),
    env = invokeEnv({ command, config }),
  }: InvokeSaveOptions = {}) => {
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

export interface MapStoreOptions extends InvokeTargetOrSaveOptions {
  // "pre" is different from "prev", which means "previous". Instead, "pre" means "given from user's config", so default values should be filled in."
  preRecord?: HaetaePreRecord | Promise<HaetaePreRecord>
}

/**
 * This creates a new store from previous store
 * The term map is coined from map function
 */
export async function mapStore({
  command = getCurrentCommand(),
  config = getConfig(),
  store = getStore(),
  env = invokeEnv({ command, config }),
  preRecord = invokeSave({ command, env, store, config }),
}: MapStoreOptions = {}) {
  const newRecord: HaetaeRecord = {
    time: new Date().toISOString(),
    env: await env,
    ...preRecord,
  }
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
      store.commands[await command][index] = newRecord
      return store
    }
  }
  store.commands[await command].push(newRecord)
  return store
}

export interface SaveStoreOptions {
  store: HaetaeStore
  filename?: string
}

export async function saveStore({
  store,
  filename = getDefaultStoreFilename(),
}: SaveStoreOptions) {
  fs.writeFileSync(filename, JSON.stringify(store, null, 2))
}
