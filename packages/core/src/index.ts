import path from 'path'
import assert from 'assert/strict'
import fs from 'fs'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
import produce from 'immer'

export const { name: packageName, version: packageVersion } = (() => {
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
  assert(!!filename, '$HAETAE_CONFIG_FILE is not given.')
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
  } catch {
    throw new Error('Path to config file is non-existent path.')
  }
})

// todo: set/get current config dirname
export const getConfigDirname = () => path.dirname(getConfigFilename())

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HaetaeRecordEnv = any

/**
 * e.g. { '@haetae/git': { commit: string } }
 */
export type HaetaeRecordData = Record<string, unknown>

export interface HaetaeRecord {
  time: number
  env: HaetaeRecordEnv
  data: HaetaeRecordData
}

export interface HaetaeStore {
  version: string
  commands: {
    [command: string]: HaetaeRecord[]
  }
}

export interface HaetaePreCommand {
  run: () => HaetaeRecordData | Promise<HaetaeRecordData>
  env?:
    | (() => HaetaeRecordEnv | Promise<HaetaeRecordEnv>)
    | HaetaeRecordEnv
    | Promise<HaetaeRecordEnv>
}

export interface HaetaeCommand extends HaetaePreCommand {
  env: () => HaetaeRecordEnv | Promise<HaetaeRecordEnv>
}

export interface HaetaePreConfig {
  commands: {
    [command: string]: HaetaePreCommand
  }
  // maxLimit?: number // Infinity
  // maxAge?: number // Infinity
  // It should be an absolute or relative path (relative to config file path)
  storeFile?: string
}

export interface HaetaeConfig {
  commands: {
    [command: string]: HaetaeCommand
  }
  storeFile: string
}

export const defaultStoreFile = 'haetae.store.json'

/**
 * @param preConfig: config object provided from user.
 * @returns
 */
export function configure({
  commands,
  storeFile = '.',
}: HaetaePreConfig): HaetaeConfig {
  /* eslint-disable no-param-reassign */
  for (const command in commands) {
    if (Object.prototype.hasOwnProperty.call(commands, command)) {
      // Setting default: env
      if (commands[command].env === undefined) {
        commands[command].env = () => ({})
      }

      // Convert it to a function if not
      if (typeof commands[command].env !== 'function') {
        commands[command].env = () => commands[command].env
      }

      assert(
        typeof commands[command].run === 'function',
        `commands.${command}.run is invalid. It should be a function.`,
      )
    }
  }

  assert(
    typeof storeFile === 'string',
    `'storeFile' is misconfigured. It should be string.`,
  )

  // When it's given as a directory.
  // Keep in mind that store file might not exist, yet.
  // So you must NOT use `fs.statSync(preConfig.storeFile).isDirectory()`.
  if (!storeFile.endsWith('.json')) {
    storeFile = path.join(storeFile, defaultStoreFile)
  }

  /* eslint-enable no-param-reassign */
  return {
    commands: commands as HaetaeConfig['commands'],
    storeFile,
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
    } catch {
      throw new Error(
        `Config filename is given as "${configFilename}", but it does not exist.`,
      )
    }

    const config = configure(await import(configFilename))

    if (!path.isAbsolute(config.storeFile)) {
      config.storeFile = path.join(
        path.dirname(configFilename),
        config.storeFile,
      )
    }

    return config
  },
  {
    normalizer: serialize,
  },
)

export function initNewStore(): HaetaeStore {
  return { version: packageVersion, commands: {} }
}

export interface GetStoreOptions {
  filename?: string | Promise<string>
  // When there's no store file yet.
  fallback?: ({
    filename,
    error,
  }: {
    filename: string
    error: Error
  }) => HaetaeStore | Promise<HaetaeStore> | never
}

/**
 * @throw if the file does not exist
 * `config.storeFile` should be absolute path
 * @memoized
 */
export const getStore = memoizee(
  async ({
    filename = (async () => (await getConfig()).storeFile)(),
    fallback = initNewStore,
  }: GetStoreOptions = {}): Promise<HaetaeStore> => {
    let rawStore

    try {
      rawStore = fs.readFileSync(await filename, {
        encoding: 'utf8',
      })
    } catch (error) {
      return fallback({ filename: await filename, error: error as Error })
    }
    const store = JSON.parse(rawStore)
    return store
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

export interface CommandFromConfig {
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
  }: CommandFromConfig = {}): Promise<HaetaeRecordEnv> =>
    (await config)?.commands[await command]?.env(),
  {
    normalizer: serialize,
  },
)

export const invokeRun = async ({
  command = getCurrentCommand(),
  config = getConfig(),
}: CommandFromConfig = {}): Promise<HaetaeRecordData> =>
  (await config)?.commands[await command]?.run()

export interface GetRecordOptions extends GetRecordsOptions {
  env?: HaetaeRecordEnv | Promise<HaetaeRecordEnv>
}

/**
 * @returns true if those envs are identical, false otherwise.
 */
export async function compareEnvs(
  one: HaetaeRecordEnv | Promise<HaetaeRecordEnv>,
  theOther: HaetaeRecordEnv | Promise<HaetaeRecordEnv>,
) {
  return JSON.stringify(await one) === JSON.stringify(await theOther)
}

export async function getRecord({
  command = getCurrentCommand(),
  env = invokeEnv({ command }),
  store = getStore(),
}: GetRecordOptions = {}): Promise<HaetaeRecord | undefined> {
  const records = await getRecords({ command, store })
  if (records) {
    for (const record of records) {
      if (await compareEnvs(env, record.env)) {
        return record
      }
    }
  }
  return undefined
}

export interface MapRecordOptions {
  time?: number
  env?: HaetaeRecordEnv | Promise<HaetaeRecordEnv>
  // "pre" is different from "prev", which means "previous". Instead, "pre" means "given from user's config", so default values should be filled in."
  data?: HaetaeRecordData | Promise<HaetaeRecordData>
}

export async function mapRecord({
  time = Date.now(),
  env = invokeEnv(),
  data = invokeRun(),
}: MapRecordOptions): Promise<HaetaeRecord> {
  return {
    time,
    env: await env,
    data: await data,
  }
}

export interface MapStoreOptions {
  command?: string | Promise<string>
  store?: HaetaeStore | Promise<HaetaeStore>
  record?: HaetaeRecord | Promise<HaetaeRecord>
}

/**
 * This creates a new store from previous store
 * The term map is coined from map function
 */
export async function mapStore({
  command = getCurrentCommand(),
  store = getStore(),
  record = mapRecord({
    env: invokeEnv({ command }),
    data: invokeRun({ command }),
  }),
}: MapStoreOptions = {}) {
  return produce(await store, async (draft) => {
    /* eslint-disable no-param-reassign */
    record = await record
    command = await command
    draft.version = packageVersion
    draft.commands = draft.commands || {}
    draft.commands[command] = draft.commands[command] || []
    const records = draft.commands[command]
    for (const [index, oldRecord] of records.entries()) {
      try {
        if (await compareEnvs(record.env, oldRecord.env)) {
          records[index] = record
          return draft
        }
      } catch {
        // console.error(error)
        throw new Error('`env` must be able to be stringified.')
      }
    }
    draft.commands[command].push(await record)
    /* eslint-enable no-param-reassign */
    return draft
  })
}

export interface SaveStoreOptions {
  filename?: string | Promise<string>
  store?: HaetaeStore | Promise<HaetaeStore>
}

export async function saveStore({
  filename = getConfig().then((config) => config.storeFile),
  store = mapStore(),
}: SaveStoreOptions = {}) {
  // TODO: await
  fs.writeFileSync(
    await filename,
    `${JSON.stringify(await store, undefined, 2)}\n`, // trailing empty line
    {
      encoding: 'utf8',
    },
  )
  getStore.clear() // memoization cache clear
}
