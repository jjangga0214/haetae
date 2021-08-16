import path from 'path'
import { strict as assert } from 'assert'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
// eslint-disable-next-line import/no-extraneous-dependencies
import { DeepRequired } from 'utility-types'
import fs from 'fs'
import deepEqual from 'deep-equal'

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

export interface HaetaeStore {
  version: string
  commands: {
    [command: string]: HaetaeRecord[]
  }
}

export interface SubCommandTargetOptions {
  prevRecord: HaetaeRecord
}
export interface SubCommandEnvOptions {
  prevRecord: HaetaeRecord
  haetaeVersion: string
}
export interface SubCommandSaveOptions {
  prevRecord: HaetaeRecord
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
      ) => HaetaeRecord | Promise<HaetaeRecord>
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
export function config(haetaeConfig: HaetaeConfig) {
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
  filename: string // config file path
}

/**
 * @memoized
 */
export const getHaetaeConfig = memoizee(
  async ({ filename = getConfigFilenameFromEnvVar() }: GetConfigOptions) => {
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
  store,
}: GetRecordByEnvOptions): Promise<HaetaeRecord | undefined> {
  const records = await getRecords({ command, store })
  for (const record of records) {
    if (deepEqual(env, record.env)) {
      return record
    }
  }
  return undefined
}

// async function main() {
//   console.log(await getStore())
//   console.log(await getRecords({ command: 'test' }))
//   console.log(
//     await getRecordByEnv({
//       command: 'test',
//       env: {
//         os: 'darwin',
//         haetaeVersion: '0.0.1',
//       },
//     }),
//   )
// }

// main()
