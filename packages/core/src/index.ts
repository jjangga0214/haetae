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

export type HaetaeRecordEnv = Record<string, unknown>

export interface HaetaeRecord {
  time: string // ISO format
  env: HaetaeRecordEnv
  // '@haetae/loader-git'?: {
  //   gitSha: string
  // }
  [key: string]: unknown
}

type HaetaePreRecord = Omit<HaetaeRecord, 'time' | 'env'>

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
  haetaeVersion: string
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
  haetaeVersion,
}: SubCommandEnvOptions) => ({
  haetaeVersion,
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

export interface GetStoreOptions {
  filename?: string | Promise<string> // It should be an absolute path
}

/**
 * @throw if the file does not exist
 * @memoized
 */
export const getStore = memoizee(
  async ({
    filename = getConfig().then((config) => config.storeFile),
  }: GetStoreOptions = {}): Promise<HaetaeStore> => {
    const resolvedFilename = await filename
    return import(resolvedFilename)
  },
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
  config?: HaetaeConfig | Promise<HaetaeConfig>
}

/**
 * @memoized
 */
export const invokeEnv = memoizee(
  async ({ command, config = getConfig() }: InvokeEnvOptions) =>
    (await config)?.commands[command]?.env({ haetaeVersion: version }),
  {
    normalizer: serialize,
  },
)

export interface InvokeTargetOrSaveOptions {
  command: string
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
    command,
    env,
    store = getStore(),
    config = getConfig(),
  }: InvokeTargetOptions) => {
    const prevRecord = await getRecordByEnv({
      command,
      env: (await env) || (await invokeEnv({ command, config })),
      store,
    })
    return (await config).commands[command].target({
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
    command,
    env,
    store = getStore(),
    config = getConfig(),
  }: InvokeSaveOptions) => {
    const prevRecord = await getRecordByEnv({
      command,
      env: (await env) || (await invokeEnv({ command, config })),
      store,
    })
    return (await config).commands[command].save({
      prevRecord,
    })
  },
  {
    normalizer: serialize,
  },
)

export interface MapStoreOptions extends InvokeTargetOrSaveOptions {
  record: HaetaePreRecord | Promise<HaetaePreRecord>
}

/**
 * This creates a new store from previous store
 * The term map is coined from map function
 * @param {record}: This is "preRecord"
 */
export async function mapStore({
  command,
  env,
  record,
  store,
  config = getConfig(),
}: MapStoreOptions) {
  const newStore = await (async (): Promise<HaetaeStore> => {
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
  // "pre" is different from "prev", which means "previous". Instead, "pre" means "given from user's config", so default values should be filled in."
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
  const config = await getConfig({
    filename:
      '/media/jjangga/SHARE/haetae/packages/core/test/haetae.config.example.js',
  })
  console.log(config)
  console.log(version)
}

main()
