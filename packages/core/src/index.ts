import path from 'path'
import assert from 'assert/strict'
import fs from 'fs'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
import produce from 'immer'
import deepEqual from 'deep-equal'
import pkg from './pkg'

export { default as pkg } from './pkg'

type PromiseOr<T> = Promise<T> | T

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

export const setConfigFilename = (
  filename: string | undefined = defaultConfigFile,
) => {
  configFilename = filename
}

/**
 * @memoized
 */
export const getConfigFilename = memoizee((): string => {
  let filename = configFilename || '.'
  if (!path.isAbsolute(filename)) {
    filename = path.join(process.cwd(), filename)
  }
  try {
    if (fs.statSync(filename).isDirectory()) {
      filename = path.join(filename, defaultConfigFile)
      assert(fs.existsSync(filename))
      return filename
    }
    return filename
  } catch {
    throw new Error(`Path to config file(${filename}) is non-existent path.`)
  }
})

// todo: set/get current config dirname
export const getConfigDirname = () => path.dirname(getConfigFilename())

export const defaultStoreFile = 'haetae.store.json'

export interface HaetaeRecord<D = unknown, E = unknown> {
  data: D | null
  env: E | null
  time: number
}

export interface HaetaeStore<D = unknown, E = unknown> {
  version: string
  commands: {
    [command: string]: HaetaeRecord<D, E>[]
  }
}

export type HaetaePreCommandEnv<E = unknown> =
  | HaetaeCommandEnv<E>
  | PromiseOr<E | null | undefined>

export type HaetaeCommandEnv<E = unknown> = () => void | PromiseOr<
  E | null | undefined
>

export interface HaetaePreCommand<D = unknown, E = unknown> {
  run: () => void | PromiseOr<D | null | undefined>
  env?: HaetaePreCommandEnv<E>
}

export interface HaetaeCommand<D = unknown, E = unknown> {
  run: () => void | PromiseOr<D | null | undefined>
  env: HaetaeCommandEnv<E>
}

export type RootEnv<E = unknown> = (
  envFromCommand: E | null,
) => PromiseOr<E | null>

export type RootRecordData<D = unknown> = (
  recordDataFromCommand: D | null,
) => PromiseOr<D | null>

export interface HaetaePreConfig<D = unknown, E = unknown> {
  commands: {
    [command: string]: HaetaePreCommand<D, E>
  }
  // maxLimit?: number // Infinity
  // maxAge?: number // Infinity
  env?: RootEnv<E>
  recordData?: RootRecordData<D>
  // It should be an absolute or relative path (relative to config file path)
  storeFile?: string
}

export interface HaetaeConfig<D = unknown, E = unknown> {
  commands: {
    [command: string]: HaetaeCommand<D, E>
  }
  env: RootEnv<E>
  recordData: RootRecordData<D>
  storeFile: string
}

/**
 * @param preConfig: config object provided from user.
 * @returns
 */
export function configure<D = unknown, E = unknown>({
  commands,
  env = (envFromCommand) => envFromCommand,
  recordData = (recordDataFromCommand) => recordDataFromCommand,
  storeFile = '.',
}: HaetaePreConfig<D, E>): HaetaeConfig<D, E> {
  /* eslint-disable no-param-reassign */

  // Convert it to a function if not
  assert(
    typeof env === 'function',
    `'env' is misconfigured. It should be a function.`,
  )
  assert(
    typeof recordData === 'function',
    `'recordData' is misconfigured. It should be a function.`,
  )
  assert(
    typeof storeFile === 'string',
    `'storeFile' is misconfigured. It should be string.`,
  )
  if (!path.isAbsolute(storeFile)) {
    // Change posix path to platform-specific path
    storeFile = path.join(...storeFile.split('/'))
  }

  // When it's given as a directory.
  // Keep in mind that store file might not exist, yet.
  // So you must NOT use `fs.statSync(preConfig.storeFile).isDirectory()`.
  if (!storeFile.endsWith('.json')) {
    storeFile = path.join(storeFile, defaultStoreFile)
  }

  for (const command in commands) {
    if (Object.prototype.hasOwnProperty.call(commands, command)) {
      // Convert it to a function if not
      if (typeof commands[command].env !== 'function') {
        commands[command].env = () =>
          commands[command].env as ReturnType<HaetaeCommandEnv<E>>
      }

      assert(
        typeof commands[command].run === 'function',
        `commands.${command}.run is invalid. It should be a function.`,
      )
    }
  }

  /* eslint-enable no-param-reassign */
  return {
    commands: commands as HaetaeConfig<D, E>['commands'],
    env,
    recordData,
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
  async <D = unknown, E = unknown>({
    filename = getConfigFilename(),
  }: GetConfigOptions = {}): Promise<HaetaeConfig<D, E>> => {
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

    const config = configure<D, E>(await import(configFilename))

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

export function initNewStore<D = unknown, E = unknown>(): HaetaeStore<D, E> {
  return { version: pkg.version.value, commands: {} }
}

export interface GetStoreOptions<D = unknown, E = unknown> {
  filename?: string | Promise<string>
  // When there's no store file yet.
  fallback?: ({
    filename,
    error,
  }: {
    filename: string
    error: Error
  }) => HaetaeStore<D, E> | Promise<HaetaeStore<D, E>> | never
}

/**
 * @throw if the file does not exist
 * `config.storeFile` should be absolute path
 * @memoized
 */
export const getStore = memoizee(
  async <D = unknown, E = unknown>({
    filename = getConfig().then((c) => c.storeFile),
    fallback = () => initNewStore(),
  }: GetStoreOptions<D, E> = {}): Promise<HaetaeStore<D, E>> => {
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

export interface GetRecordsOptions<D = unknown, E = unknown> {
  command?: string | Promise<string> // record store file path
  store?: HaetaeStore<D, E> | Promise<HaetaeStore<D, E>>
}

export async function getRecords<D = unknown, E = unknown>({
  command = getCurrentCommand(),
  store = getStore(),
}: GetRecordsOptions<D, E> = {}): Promise<HaetaeRecord<D, E>[] | undefined> {
  return (await store).commands[await command] // `undefined` if non-existent
}

export interface CommandFromConfig<D = unknown, E = unknown> {
  command?: string | Promise<string>
  config?: HaetaeConfig<D, E> | Promise<HaetaeConfig<D, E>>
}

/**
 * @memoized
 */
export const invokeEnv = memoizee(
  async <E = unknown>({
    command = getCurrentCommand(),
    config = getConfig(),
  }: CommandFromConfig<unknown, E> = {}): Promise<E | null> => {
    const haetaeCommand = (await config).commands[await command]
    assert(!!haetaeCommand, `Command "${await command}" is not configured.`)
    const env = await haetaeCommand.env()
    // eslint-disable-next-line unicorn/no-null
    return (await config).env(env === undefined ? null : env)
  },
  {
    normalizer: serialize,
  },
)

export const invokeRun = async <D = unknown>({
  command = getCurrentCommand(),
  config = getConfig(),
}: CommandFromConfig<D, unknown> = {}): Promise<D | null> => {
  const haetaeCommand = (await config).commands[await command]
  assert(!!haetaeCommand, `Command "${await command}" is not configured.`)

  const recordData = await haetaeCommand.run()
  // eslint-disable-next-line unicorn/no-null
  return (await config).recordData(recordData === undefined ? null : recordData)
}

export interface GetRecordOptions<D = unknown, E = unknown>
  extends GetRecordsOptions<D, E> {
  env?: E | null | Promise<E | null>
}

/**
 * @returns true if those envs are identical, false otherwise.
 */
export async function compareEnvs<E = unknown>(
  one: E | Promise<E>,
  theOther: E | Promise<E>,
) {
  return deepEqual(
    JSON.parse(JSON.stringify(await one)),
    JSON.parse(JSON.stringify(await theOther)),
    {
      strict: true,
    },
  )
}

export async function getRecord<D = unknown, E = unknown>({
  command = getCurrentCommand(),
  env = invokeEnv({ command }),
  store = getStore(),
}: GetRecordOptions<D, E> = {}): Promise<HaetaeRecord<D, E> | undefined> {
  const records = await getRecords({ command, store })
  if (records) {
    for (const record of records) {
      if (await compareEnvs(env, record.env)) {
        return record
      }
    }
  }
  return undefined // `undefined` if non-existent
}

export interface MapRecordOptions<D = unknown, E = unknown> {
  data?: D | null | Promise<D | null>
  env?: E | null | Promise<E | null>
  time?: number
}

export async function mapRecord<D = unknown, E = unknown>({
  data = invokeRun(),
  env = invokeEnv(),
  time = Date.now(),
}: MapRecordOptions<D, E>): Promise<HaetaeRecord<D, E>> {
  return {
    data: await data,
    env: await env,
    time,
  }
}

export interface MapStoreOptions<D = unknown, E = unknown> {
  command?: string | Promise<string>
  store?: HaetaeStore<D, E> | Promise<HaetaeStore<D, E>>
  record?: HaetaeRecord<D, E> | Promise<HaetaeRecord<D, E>>
}

/**
 * This creates a new store from previous store
 * The term map is coined from map function
 */
export async function mapStore<D = unknown, E = unknown>({
  command = getCurrentCommand(),
  store = getStore(),
  record = mapRecord({
    data: invokeRun({ command }),
    env: invokeEnv({ command }),
  }),
}: MapStoreOptions<D, E> = {}) {
  return produce(await store, async (draft) => {
    /* eslint-disable no-param-reassign */
    record = await record
    command = await command
    draft.version = pkg.version.value
    draft.commands = draft.commands || {}
    draft.commands[command] = draft.commands[command] || []
    const records = draft.commands[command]
    for (const [index, oldRecord] of records.entries()) {
      try {
        if (await compareEnvs(record.env, oldRecord.env as E)) {
          records.splice(index, 1)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          records.unshift(record)
          return draft
        }
      } catch {
        // console.error(error)
        throw new Error('`env` must be able to be stringified.')
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    records.unshift(record)
    /* eslint-enable no-param-reassign */
    return draft
  })
}

export interface SaveStoreOptions {
  filename?: string | Promise<string>
  store?: HaetaeStore | Promise<HaetaeStore>
}

export async function saveStore({
  filename = getConfig().then((c) => c.storeFile),
  store = mapStore(),
}: SaveStoreOptions = {}) {
  // TODO: await?
  fs.writeFileSync(
    await filename,
    `${JSON.stringify(await store, undefined, 2)}\n`, // trailing empty line
    {
      encoding: 'utf8',
    },
  )
  getStore.clear() // memoization cache clear
}
