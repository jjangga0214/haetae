import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import upath from 'upath'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
import { findUp } from 'find-up'
import hashObject from 'hash-obj'
import deepmerge from 'deepmerge'
import { PromiseOr, Rec, parsePkg, toAbsolutePath } from '@haetae/common'
import { produce } from 'immer'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ms from 'ms' // TODO: rm ts-ignore once https://github.com/vercel/ms/issues/189 is resolved.
import { dirname } from 'dirname-filename-esm'

export const pkg = parsePkg({
  name: '@haetae/core',
  rootDir: dirname(import.meta),
})

export const reservedRecordDataList: Rec[] = []

let currentCommand: string | undefined

export interface SetCurrentCommandOptions {
  command: string
}

export const setCurrentCommand = ({ command }: SetCurrentCommandOptions) => {
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

export const defaultConfigFiles = [
  'haetae.config.js',
  'haetae.config.mjs',
  'haetae.config.ts',
  'haetae.config.mts',
]

let configFilename: string | undefined

export const getConfigFilename = (): string => {
  assert(!!configFilename, 'configFilename is not set yet.')
  return configFilename
}

export interface SetConfigFilenameOptions {
  filename?: string
  cwd?: string
  checkExistence?: boolean
}

export async function setConfigFilename({
  filename,
  cwd = process.cwd(),
  checkExistence = true,
}: SetConfigFilenameOptions = {}) {
  if (filename) {
    // eslint-disable-next-line no-param-reassign
    filename = upath.resolve(cwd, filename)
    if (checkExistence) {
      try {
        await fs.access(filename)
      } catch (error) {
        console.error(error)
        throw new Error(
          `Path to config file(${filename}) is non-existent path.`,
        )
      }
    }
    configFilename = filename
  } else {
    const candidates = (
      await Promise.all(defaultConfigFiles.map((f) => findUp(f, { cwd })))
    )
      // eslint-disable-next-line unicorn/no-await-expression-member
      .filter((v) => v)
      .map((f) => upath.resolve(f))
    candidates.sort((a, b) => {
      const aDepth = upath.dirname(a).length
      const bDepth = upath.dirname(b).length
      if (aDepth > bDepth) {
        // The deeper becomes the former
        return -1
      }
      if (aDepth < bDepth) {
        // The shallower becomes the latter
        return 1
      }
      // If depth is equal, extension decides the order.
      const extenstions = defaultConfigFiles.map((f) => upath.extname(f))
      const aExtIndex = extenstions.indexOf(upath.extname(a))
      const bExtIndex = extenstions.indexOf(upath.extname(b))
      return aExtIndex - bExtIndex
    })
    if (candidates.length > 0) {
      // eslint-disable-next-line prefer-destructuring
      configFilename = candidates[0]
    } else {
      throw new Error('Cannot find the configuration file.')
    }
  }
}

// todo: set/get current config dirname
export const getConfigDirname = () => upath.dirname(getConfigFilename())

export interface HaetaeRecord<D extends Rec = Rec, E extends Rec = Rec> {
  data: D
  env: E
  envHash: string
  time: number
}

export interface CommandEnvOptions<S extends StoreConnector> {
  store: S
}

export type CommandEnv<E extends Rec, S extends StoreConnector> = (
  options: CommandEnvOptions<S>,
) => void | PromiseOr<E>

export type PreCommandEnv<E extends Rec, S extends StoreConnector> =
  | CommandEnv<E, S>
  | PromiseOr<E | void>

export interface CommandRunOptions<E extends Rec, S extends StoreConnector> {
  env: E
  store: S
}

export type CommandRun<
  D extends Rec,
  E extends Rec,
  S extends StoreConnector,
> = (options: CommandRunOptions<E, S>) => void | PromiseOr<D | void>

export interface PreCommand<
  D extends Rec,
  E extends Rec,
  S extends StoreConnector,
> {
  run: CommandRun<D, E, S>
  env?: PreCommandEnv<E, S>
}

export interface Command<
  D extends Rec,
  E extends Rec,
  S extends StoreConnector,
> {
  run: CommandRun<D, E, S>
  env: CommandEnv<E, S>
}

export type RootEnv<
  A extends Rec,
  S extends StoreConnector,
  R extends Rec = A,
> = (envFromCommand: A, options: CommandEnvOptions<S>) => PromiseOr<R>

export type RootRecordData<
  A extends Rec,
  E extends Rec,
  S extends StoreConnector,
  R extends Rec = A,
> = (recordDataFromCommand: A, options: CommandRunOptions<E, S>) => PromiseOr<R>

export interface PreConfig<S extends StoreConnector = StoreConnector> {
  commands: Record<string, PreCommand<Rec, Rec, S>>
  env?: RootEnv<Rec, S>
  recordData?: RootRecordData<Rec, Rec, S>
  store?: S
}

export interface Config<
  D extends Rec, // Record Data
  E extends Rec, // Env
  S extends StoreConnector = StoreConnector,
  RD extends Rec = D, // Root Record Data
  RE extends Rec = E, // Root Env
> {
  commands: Record<string, Command<D, E, S>>
  env: RootEnv<E, S, RE>
  recordData: RootRecordData<D, RE, S, RD>
  store: S
}

export function configure<
  D extends Rec,
  E extends Rec,
  S extends StoreConnector = LocalFileStoreConnector,
  RD extends Rec = D,
  RE extends Rec = E,
  C extends Config<D, E, S, RD, RE> = Config<D, E, S, RD, RE>,
>({
  commands,
  env = (envFromCommand) => envFromCommand,
  recordData = (recordDataFromCommand) => recordDataFromCommand,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  store = localFileStore(),
}: PreConfig<S>): C {
  // Convert it to a function if not
  assert(
    typeof env === 'function',
    `'env' is misconfigured. It should be a function.`,
  )
  assert(
    typeof recordData === 'function',
    `'recordData' is misconfigured. It should be a function.`,
  )

  for (const command in commands) {
    if (Object.prototype.hasOwnProperty.call(commands, command)) {
      // Convert it to a function if not
      if (typeof commands[command].env !== 'function') {
        const value = commands[command].env as ReturnType<CommandEnv<E, S>>
        // eslint-disable-next-line no-param-reassign
        commands[command].env = () => value
      }

      assert(
        typeof commands[command].run === 'function',
        `commands.${command}.run is invalid. It should be a function.`,
      )
    }
  }

  return {
    commands: commands as unknown as Config<D, E, S, RD, RE>['commands'],
    env: env as unknown as RootEnv<E, S, RE>,
    recordData: recordData as unknown as RootRecordData<D, E, S, RD>,
    store: store as S,
  } as unknown as C
}

// memoize to prevent duplicated registration
const registerTsNode = memoizee(async () => {
  try {
    // import optional peerDependency 'ts-node'
    // Register TypeScript compiler instance
    const tsNode = await import('ts-node')
    return tsNode.register({
      esm: true,
    })
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        `To read a config file written in typescript, 'ts-node' is required. Please install it.\nError: ${error?.message}`,
      )
    }
    throw error
  }
})

// Load the TypeScript configuration
const importTs = async (filename: string) => {
  // Get registered TypeScript compiler instance
  const registeredCompiler = await registerTsNode()
  // [Service.enabled] REF: https://github.com/TypeStrong/ts-node/blob/45a3c750475cf60c30301ab36bb9a8bcd52ae875/src/index.ts#L1449-L1450
  const isTsNodeCompilerEnabled = registeredCompiler.enabled()
  registeredCompiler.enabled(true)
  const module = await import(filename)
  registeredCompiler.enabled(isTsNodeCompilerEnabled) // Restore it to the original state
  return module
}

export interface GetConfigOptions {
  filename?: string
}

export const getConfig = memoizee(
  async <
    D extends Rec,
    E extends Rec,
    S extends StoreConnector = StoreConnector,
    RD extends Rec = D,
    RE extends Rec = E,
    C extends Config<D, E, S, RD, RE> = Config<D, E, S, RD, RE>,
  >({ filename = getConfigFilename() }: GetConfigOptions = {}): Promise<C> => {
    // eslint-disable-next-line no-param-reassign
    filename = upath.resolve(filename)
    const preConfigModule = await (filename.endsWith('.ts')
      ? importTs(filename)
      : import(filename))

    return configure<D, E, S, RD, RE, C>(preConfigModule.default)
  },
  {
    normalizer: serialize,
  },
)

export function reserveRecordData(recordData: Rec) {
  reservedRecordDataList.push(recordData)
}

export interface InvokeEnvOptions<E extends Rec> {
  command?: string
  config?: Config<Rec, E, StoreConnector, Rec, Rec>
}

export const invokeEnv = async <E extends Rec>({
  command = getCurrentCommand(),
  config,
}: InvokeEnvOptions<E> = {}): Promise<E> => {
  // eslint-disable-next-line no-param-reassign
  config = config || (await getConfig<Rec, E, StoreConnector, Rec, Rec>())
  const haetaeCommand = config.commands[command]
  assert(!!haetaeCommand, `Command "${command}" is not configured.`)
  const env = (await haetaeCommand.env({ store: config.store })) || ({} as E)
  let isUndefinedOrObject = false
  try {
    isUndefinedOrObject =
      env === undefined || Object.getPrototypeOf(env) === Object.prototype
  } catch {
    throw new Error(
      'The return type of `env` must be a plain object(`{ ... }`) or `void`.',
    )
  }
  assert(
    isUndefinedOrObject,
    'The return type of `env` must be a plain object(`{ ... }`) or `void`.',
  )

  return env
}

export interface InvokeRootEnvOptions<A extends Rec, R extends Rec> {
  env?: A
  config?: Config<Rec, A, StoreConnector, Rec, R>
}

export const invokeRootEnv = async <A extends Rec, R extends Rec>({
  config,
  env,
}: InvokeRootEnvOptions<A, R> = {}): Promise<R> => {
  // eslint-disable-next-line no-param-reassign
  config = config || (await getConfig<Rec, A, StoreConnector, Rec, R>())
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _env =
    env ||
    (await invokeEnv<A>({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config,
    }))
  return config.env(_env, { store: config.store })
}

export interface InvokeRunOptions<D extends Rec> {
  command?: string
  env?: Rec // env before RootEnv
  config?: Config<D, Rec>
  reserveRecordData?: boolean
}

export const invokeRun = async <D extends Rec>({
  command = getCurrentCommand(),
  config,
  env,
  reserveRecordData = true,
}: InvokeRunOptions<D> = {}): Promise<D> => {
  /* eslint-disable no-param-reassign */
  config = config || (await getConfig<D, Rec>())
  env =
    env ||
    (await invokeEnv({
      command,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config,
    }))
  /* eslint-enable no-param-reassign */
  const { store } = config

  // eslint-disable-next-line unicorn/consistent-destructuring
  const haetaeCommand = config.commands[command]
  assert(!!haetaeCommand, `Command "${command}" is not configured.`)
  // env before RootEnv
  let recordData = (await haetaeCommand.run({ store, env })) || ({} as D)

  let isUndefinedOrObject = false
  try {
    isUndefinedOrObject =
      recordData === undefined ||
      Object.getPrototypeOf(recordData) === Object.prototype
  } catch {
    throw new Error(
      'The return type of `run` must be a plain object(`{ ... }`) or `void`.',
    )
  }
  assert(
    isUndefinedOrObject,
    'The return type of `run` must be a plain object(`{ ... }`) or `void`.',
  )
  if (reserveRecordData) {
    recordData = deepmerge.all([...reservedRecordDataList, recordData]) as D
  }

  return recordData
}

export interface InvokeRootRecordDataOptions<A extends Rec, R extends Rec> {
  env: Rec
  recordData: A
  config?: Config<A, Rec, StoreConnector, R>
}

export const invokeRootRecordData = memoizee(
  async <A extends Rec, R extends Rec>({
    env,
    recordData,
    config,
  }: InvokeRootRecordDataOptions<A, R>): Promise<R> => {
    /* eslint-disable no-param-reassign */
    config = config || (await getConfig<A, Rec, StoreConnector, R>())
    /* eslint-enable no-param-reassign */
    return config.recordData(recordData, {
      store: config.store,
      env,
    })
  },
  {
    normalizer: serialize,
  },
)

export function hashEnv(env: Rec): string {
  return hashObject(env, { algorithm: 'sha1' })
}

export interface CreateRecordOptions<D extends Rec, E extends Rec> {
  config?: Config<D, E>
  command?: string
}

export async function createRecord<D extends Rec, E extends Rec>({
  config,
  command = getCurrentCommand(),
}: CreateRecordOptions<D, E> = {}): Promise<HaetaeRecord<D, E>> {
  // eslint-disable-next-line no-param-reassign
  config = config || (await getConfig<D, E>())
  const env = await invokeEnv<E>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config,
    command,
  })
  const rootEnv = await invokeRootEnv({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config,
    env,
  })
  const recordData = await invokeRun({
    env,
    command,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config,
  })
  const rootRecordData = await invokeRootRecordData({
    env: rootEnv,
    recordData,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config,
  })
  const envHash = hashEnv(rootEnv)

  return {
    env: rootEnv,
    data: rootRecordData,
    envHash,
    time: Date.now(),
  }
}

export const localFileStoreSpecVersion = 1

export interface LocalFileStore<D extends Rec = Rec, E extends Rec = Rec> {
  specVersion: number
  commands: {
    [command: string]: HaetaeRecord<D, E>[]
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const _loadStore = memoizee(
  async <D extends Rec, E extends Rec>(
    filename: string,
  ): Promise<LocalFileStore<D, E>> => {
    // This will throw an error if the file does not exist.
    const rawStore = await fs.readFile(filename, {
      encoding: 'utf8',
    })
    const store = JSON.parse(rawStore)
    return store
  },
  {
    normalizer: serialize,
  },
)

export interface AddRecordOptions {
  command?: string
  record: HaetaeRecord
}

export type AddRecord = (options: AddRecordOptions) => PromiseOr<void>

export interface GetRecordOptions {
  command?: string
  envHash?: string
}

export type GetRecord = <D extends Rec = Rec, E extends Rec = Rec>(
  options?: GetRecordOptions,
) => PromiseOr<HaetaeRecord<D, E> | undefined>

export interface StoreConnector {
  addRecord: AddRecord
  getRecord: GetRecord
}

export interface LoadStoreOptions {
  initWhenNotFound?: boolean
}

export interface LocalFileStoreConnector extends StoreConnector {
  initNewStore<D extends Rec, E extends Rec>(): LocalFileStore<D, E>
  loadStore<D extends Rec, E extends Rec>(
    options?: LoadStoreOptions,
  ): Promise<LocalFileStore<D, E>>
  saveStore(store: LocalFileStore): Promise<void>
  localFileStore: {
    filename: string // It should be an absolute or relative path (relative to config file path)
    recordRemoval: {
      age: number // by milliseconds if number // e.g. 90 * 24 * 60 * 60 * 1000 => 90days
      count: number // e.g. 10 => Only leave equal to or less than 10 records
    }
  }
}

export interface LocalFileStoreOptions {
  filename?: string
  recordRemoval?: {
    age?: number | string
    count?: number
    // countPerEnv?: number // TODO: Implement this
    keepOnlyLatest?: boolean
  }
}

// State does not change after initialization.
export function localFileStore({
  recordRemoval: {
    age = Number.POSITIVE_INFINITY,
    // countPerEnv = Number.POSITIVE_INFINITY, // TODO: Implement this
    count = Number.POSITIVE_INFINITY,
    keepOnlyLatest = true,
  } = {},
  filename = '.haetae/store.json',
}: LocalFileStoreOptions = {}): LocalFileStoreConnector {
  if (typeof age === 'string') {
    // eslint-disable-next-line no-param-reassign
    age = ms(age) as number // TODO: rm ts-ignore once https://github.com/vercel/ms/issues/189 is resolved.
    assert(
      // `undefined` if invalid string
      age === 0 || !!age,
      `'recordRemoval.age' is given as an invalid string. Refer to https://github.com/vercel/ms for supported value.`,
    )
  }
  assert(
    count >= 0,
    `'recordRemoval.count' is misconfigured. It should be zero or positive value.`,
  )
  assert(
    age >= 0,
    `'recordRemoval.age' is misconfigured. It should be zero or positive value.`,
  )
  // eslint-disable-next-line no-param-reassign
  filename = toAbsolutePath({ path: filename, rootDir: getConfigDirname })
  const extension = upath.extname(filename)
  assert(
    !extension || extension === '.json',
    `Extension of the store file "${filename}" is not .json.`,
  )
  if (extension !== '.json') {
    // eslint-disable-next-line no-param-reassign
    filename = upath.join(filename, upath.basename('.haetae/store.json'))
  }

  return {
    // This `localFileStore` field is a namespace to preserve properties for mixin.
    localFileStore: {
      filename,
      recordRemoval: {
        count,
        age,
      },
    },

    async addRecord<D extends Rec, E extends Rec>({
      command = getCurrentCommand(),
      record,
    }: AddRecordOptions) {
      const store = await this.loadStore<D, E>()
      const newStore = produce(store, (draft) => {
        /* eslint-disable no-param-reassign */
        draft.specVersion = localFileStoreSpecVersion
        draft.commands = draft.commands || {}
        draft.commands[command] = draft.commands[command] || []
        if (keepOnlyLatest) {
          draft.commands[command] = draft.commands[command].filter(
            // remove old record with same env. So there's only one record left for each env.
            (oldRecord) => record.envHash !== oldRecord.envHash,
          )
        }
        // Do NOT change the original array! (e.g. use `slice` instead of `splice`)
        // That's because the store object is memoized by shallow copy.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        draft.commands[command] = draft.commands[command]
          .filter(
            (r) => !keepOnlyLatest || r.envHash !== record.envHash,
          )
          .filter(
            (r) => Date.now() - r.time < this.localFileStore.recordRemoval.age,
          )
          .slice(0, this.localFileStore.recordRemoval.count)
        // Important Assumption that `getRecord` depend on: always recent records are at the front of the array
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        draft.commands[command].unshift(record)

        /* eslint-enable no-param-reassign */
        return draft
      })
      await this.saveStore(newStore)
    },

    async getRecord<D extends Rec = Rec, E extends Rec = Rec>({
      command = getCurrentCommand(),
      envHash,
    }: GetRecordOptions = {}): Promise<HaetaeRecord<D, E> | undefined> {
      // eslint-disable-next-line no-param-reassign
      envHash = envHash || hashEnv(await invokeEnv({ command }))
      const store = await this.loadStore<D, E>()
      const records = store.commands[command] || []
      for (const record of records) {
        // Important Assumption that `addRecord` makes: always recent records are at the front of the array
        if (envHash === record.envHash) {
          return record
        }
      }
      return undefined // `undefined` if non-existent
    },

    async loadStore<D extends Rec, E extends Rec>({
      initWhenNotFound = true,
    }: LoadStoreOptions = {}) {
      try {
        return await _loadStore<D, E>(this.localFileStore.filename)
      } catch (error) {
        if (initWhenNotFound) {
          return this.initNewStore<D, E>()
        }
        throw error
      }
    },

    // This does not affect to filesystem, just creates a new store object
    initNewStore<D extends Rec, E extends Rec>(): LocalFileStore<D, E> {
      return { specVersion: localFileStoreSpecVersion, commands: {} }
    },

    async saveStore(store: LocalFileStore) {
      const dirname = upath.dirname(this.localFileStore.filename)
      try {
        await fs.access(dirname)
      } catch {
        await fs.mkdir(dirname, { recursive: true })
      }
      await fs.writeFile(
        this.localFileStore.filename,
        `${JSON.stringify(store, undefined, 2)}\n`, // trailing empty line
        {
          encoding: 'utf8',
        },
      )
      _loadStore.clear() // memoization cache clear
    },
  }
}
