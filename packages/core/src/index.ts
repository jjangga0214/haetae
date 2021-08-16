import path from 'path'
import { strict as assert } from 'assert'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
// eslint-disable-next-line import/no-extraneous-dependencies
import { DeepRequired } from 'utility-types'
import fs from 'fs'
import deepEqual from 'deep-equal'
import { version } from '../package.json'

export const defaultConfigFile = 'haetae.config.js'

/**
 * @memoized
 */
export const getConfigFilenameFromEnvVar = memoizee((): string => {
  const pathValue = process.env.HAETAE_CONFIG_FILE as string
  assert(pathValue, 'HAETAE_CONFIG_FILE is invalid')
  try {
    if (fs.statSync(pathValue).isDirectory()) {
      const filename = path.join(pathValue as string, defaultConfigFile)
      assert(fs.existsSync(filename), 'HAETAE_CONFIG_FILE is invalid')
      return filename
    }
    return pathValue
  } catch (error) {
    throw new Error('HAETAE_CONFIG_FILE is non-existent path.')
  }
})

export const getConfigDirnameFromEnvVar = () =>
  path.dirname(getConfigFilenameFromEnvVar())

export type HaetaeRecordEnv = Record<string, any>

export interface HaetaeRecord {
  time: string // ISO format
  env: HaetaeRecordEnv
  '@haetae/loader-git'?: {
    gitSha: string
  }
}

type HaetaePreRecord = Omit<HaetaeRecord, 'time' | 'env'>

export interface HaetaeStore {
  version: string
  commands: {
    [command: string]: HaetaeRecord[]
  }
}

export interface SubCommandTargetOptions {
  prevRecord?: HaetaeRecord
}
export interface SubCommandEnvOptions {
  haetaeVersion: string
}
export interface SubCommandSaveOptions {
  prevRecord?: HaetaeRecord
}
export interface HaetaeConfig {
  commands: {
    [command: string]: {
      target: (options: SubCommandTargetOptions) => string[] | Promise<string[]>
      env?: (
        options: SubCommandEnvOptions,
      ) => HaetaeRecordEnv | Promise<HaetaeRecordEnv>
      save: (
        options: SubCommandSaveOptions,
      ) => HaetaePreRecord | Promise<HaetaePreRecord>
    }
  }
  storeFile?: string
}

export const defaultStoreFile = 'haetae.json'
export const getDefaultStoreFilename = () =>
  path.join(getConfigDirnameFromEnvVar(), defaultStoreFile)

export const defaultSubCommandEnv = ({
  haetaeVersion,
}: SubCommandEnvOptions) => ({
  haetaeVersion,
})

/**
 *
 * @param haetaeConfig: config object provided from user. The function will fill out default values if not already configured..
 * @returns
 */
export function config(haetaeConfig: HaetaeConfig): DeepRequired<HaetaeConfig> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line no-param-reassign
  delete haetaeConfig.default
  for (const command in haetaeConfig.commands) {
    if (Object.prototype.hasOwnProperty.call(haetaeConfig.commands, command)) {
      assert(
        typeof haetaeConfig.commands[command].target === 'function',
        `commands.${command}.target is required, but has invalid value.`,
      )
      assert(
        typeof haetaeConfig.commands[command].save === 'function',
        `commands.${command}.save function is required, but has invalid value.`,
      )
      // eslint-disable-next-line no-param-reassign
      haetaeConfig.commands[command].env =
        haetaeConfig.commands[command].env || defaultSubCommandEnv
    }
  }
  return {
    storeFile: getDefaultStoreFilename(),
    ...haetaeConfig,
  } as DeepRequired<HaetaeConfig>
}

export interface GetConfigOptions {
  filename?: string // config file path
}

/**
 * @memoized
 */
export const getConfig = memoizee(
  async ({
    filename = getConfigFilenameFromEnvVar(),
  }: GetConfigOptions = {}) => {
    const userConfig = await import(filename)
    return config(userConfig)
  },
  {
    normalizer: serialize,
  },
)

export interface GetStoreOptions {
  filename?: string // record store file path
}

/**
 * @throw if the file does not exist
 * @memoized
 */
export const getStore = memoizee(
  async ({
    filename = getDefaultStoreFilename(),
  }: GetStoreOptions = {}): Promise<HaetaeStore> =>
    (await import(filename)) as HaetaeStore,
  {
    normalizer: serialize,
  },
)
export interface GetRecordsOptions {
  command: string // record store file path
  store?: HaetaeStore | Promise<HaetaeStore>
}

export async function getRecords({
  command,
  store = getStore(),
}: GetRecordsOptions): Promise<HaetaeRecord[]> {
  return (await store).commands[command]
}

export interface GetRecordByEnvOptions extends GetRecordsOptions {
  env: HaetaeRecordEnv
}

/**
 * The 'Env' in the function name does not mean environment variable.
 * It means `HaetaeRecordEnv`
 */
export async function getRecordByEnv({
  command,
  env,
  store = getStore(),
}: GetRecordByEnvOptions): Promise<HaetaeRecord | undefined> {
  const records = await getRecords({ command, store })
  for (const record of records) {
    if (deepEqual(env, record.env)) {
      return record
    }
  }
  return undefined
}

export interface InvokeEnvOptions {
  command: string
  config?: DeepRequired<HaetaeConfig> | Promise<DeepRequired<HaetaeConfig>>
}

export async function invokeEnv({
  command,
  config = getConfig(),
}: InvokeEnvOptions) {
  return (await config)?.commands[command]?.env({ haetaeVersion: version })
}
export interface InvokeTargetOrSaveOptions {
  command: string
  config?: DeepRequired<HaetaeConfig> | Promise<DeepRequired<HaetaeConfig>>
  store?: HaetaeStore | Promise<HaetaeStore>
  env?: HaetaeRecordEnv | Promise<HaetaeRecordEnv> // current env
}

type InvokeTargetOptions = InvokeTargetOrSaveOptions

export async function invokeTarget({
  command,
  env,
  store = getStore(),
  config = getConfig(),
}: InvokeTargetOptions) {
  const prevRecord = await getRecordByEnv({
    command,
    env: (await env) || (await invokeEnv({ command, config })),
    store,
  })
  return (await config).commands[command].target({
    prevRecord,
  })
}

export type InvokeSaveOptions = InvokeTargetOrSaveOptions

export async function invokeSave({
  command,
  env,
  store = getStore(),
  config = getConfig(),
}: InvokeSaveOptions) {
  const prevRecord = await getRecordByEnv({
    command,
    env: (await env) || (await invokeEnv({ command, config })),
    store,
  })
  return (await config).commands[command].save({
    prevRecord,
  })
}

export interface MapStoreOptions extends InvokeTargetOptions {
  record: HaetaePreRecord | Promise<HaetaePreRecord>
}

/**
 * This creates a new store from previous store
 * The term map is coined from map function
 */
export async function mapStore({
  command,
  env,
  record,
  store,
  config = getConfig(),
}: MapStoreOptions) {
  const newStore: HaetaeStore = await (async () => {
    try {
      return (await store) || (await getStore())
    } catch (error) {
      // When there is no store.
      return {
        version,
        commands: {
          [command]: [],
        },
      }
    }
  })()
  const currentEnv = (await env) || (await invokeEnv({ command, config }))
  const preRecord =
    (await record) || (await invokeSave({ command, env, store, config }))

  const newRecord: HaetaeRecord = {
    ...preRecord,
    time: new Date().toISOString(),
    env: currentEnv,
  }

  newStore.version = version
  newStore.commands[command] = newStore.commands[command] || []

  for (let index = 0; index < newStore.commands[command].length; index += 1) {
    const prevRecord = newStore.commands[command][index]
    if (deepEqual(currentEnv, prevRecord.env)) {
      newStore.commands[command][index] = newRecord
      return newStore
    }
  }
  newStore.commands[command].push(newRecord)
  return newStore
}

async function main() {
  // console.log(
  //   await getStore({
  //     filename: '/media/jjangga/SHARE/haetae/packages/core2/haetae.json',
  //   }),
  // )
  // console.log(await getRecords({ command: 'test' }))
  // console.log(
  //   await getRecordByEnv({
  //     command: 'test',
  //     env: {
  //       os: 'darwin',
  //       haetaeVersion: '0.0.1',
  //     },
  //   }),
  // )
}

main()
