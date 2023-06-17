import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import upath from 'upath'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
import deepEqual from 'deep-equal'
import { findUp } from 'find-up'
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

let reservedRecordData: Rec = {}

export interface ReserveRecordDataOptions {
  dryRun?: boolean
}

export function reserveRecordData<D extends Rec>(
  recordData: Rec,
  { dryRun = false }: ReserveRecordDataOptions = {},
): D {
  const result = { ...reservedRecordData, ...recordData }
  if (!dryRun) {
    reservedRecordData = result
  }
  return result as D
}

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
  time: number
}

export type HaetaeCommandEnv<E extends Rec> = () => void | PromiseOr<E>

export type HaetaePreCommandEnv<E extends Rec> =
  | HaetaeCommandEnv<E>
  | PromiseOr<E | void>

export type HaetaeCommandRun<D extends Rec> = () => void | PromiseOr<D | void>

export interface HaetaePreCommand<D extends Rec, E extends Rec> {
  run: HaetaeCommandRun<D>
  env?: HaetaePreCommandEnv<E>
}

export interface HaetaeCommand<D extends Rec, E extends Rec> {
  run: HaetaeCommandRun<D>
  env: HaetaeCommandEnv<E>
}

export type RootEnv<E extends Rec> = (envFromCommand: E) => PromiseOr<E>

export type RootRecordData<A extends Rec, R extends Rec = A> = (
  recordDataFromCommand: A,
) => PromiseOr<R>

export interface HaetaePreConfig {
  commands: Record<string, HaetaePreCommand<Rec, Rec>>
  env?: RootEnv<Rec>
  recordData?: RootRecordData<Rec>
  store?: StoreConnector
}

export interface HaetaeConfig<D extends Rec, E extends Rec> {
  commands: Record<string, HaetaeCommand<D, E>>
  env: RootEnv<E>
  recordData: RootRecordData<D>
}

export function configure<D extends Rec, E extends Rec>(
  preConfig: HaetaePreConfig,
): HaetaeConfig<D, E> {
  const { commands } = preConfig
  const env = preConfig.env || ((envFromCommand) => envFromCommand)
  const recordData =
    preConfig.recordData || ((recordDataFromCommand) => recordDataFromCommand)
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  store = preConfig.store || localStore()

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
        const value = commands[command].env as ReturnType<HaetaeCommandEnv<E>>
        commands[command].env = () => value
      }

      assert(
        typeof commands[command].run === 'function',
        `commands.${command}.run is invalid. It should be a function.`,
      )
    }
  }

  return {
    commands: commands as HaetaeConfig<D, E>['commands'],
    env: env as RootEnv<E>,
    recordData: recordData as RootRecordData<D>,
  }
}

// memoize to prevent duplicated registration
const registerTsNode = memoizee(async () => {
  try {
    // import optional peerDependency 'ts-node'
    // Register TypeScript compiler instance
    const tsNode = await import('ts-node')
    return tsNode.register()
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
  async <D extends Rec, E extends Rec>({
    filename = getConfigFilename(),
  }: GetConfigOptions = {}): Promise<HaetaeConfig<D, E>> => {
    // eslint-disable-next-line no-param-reassign
    filename = upath.resolve(filename)
    const preConfigModule = await (filename.endsWith('.ts')
      ? importTs(filename)
      : import(filename))

    return configure<D, E>(preConfigModule.default || preConfigModule)
  },
  {
    normalizer: serialize,
  },
)

export interface InvokeEnvOptions<E extends Rec> {
  command?: string
  config?: HaetaeConfig<Rec, E>
  applyRootEnv?: boolean
}

export const invokeEnv = memoizee(
  async <E extends Rec>(options: InvokeEnvOptions<E> = {}): Promise<E> => {
    const command = options.command || (await getCurrentCommand())
    const config = options.config || (await getConfig())
    const applyRootEnv = options.applyRootEnv ?? true
    const haetaeCommand = config.commands[command]
    assert(!!haetaeCommand, `Command "${command}" is not configured.`)
    const env = (await haetaeCommand.env()) || ({} as E)
    let isObject = false
    try {
      isObject =
        env === undefined || Object.getPrototypeOf(env) === Object.prototype
    } catch {
      throw new Error(
        'The return type of `env` must be a plain object(`{ ... }`) or `void`.',
      )
    }
    assert(
      isObject,
      'The return type of `env` must be a plain object(`{ ... }`) or `void`.',
    )

    if (applyRootEnv) {
      return config.env(env)
    }
    return env
  },
  {
    normalizer: serialize,
  },
)

export interface InvokeRunOptions<D extends Rec> {
  command?: string
  config?: HaetaeConfig<D, Rec>
  applyReservedRecordData?: boolean
  applyRootRecordData?: boolean
}

export const invokeRun = async <D extends Rec>(
  options: InvokeRunOptions<D> = {},
): Promise<D> => {
  const command = options.command || (await getCurrentCommand())
  const config = options.config || (await getConfig())
  const applyReservedRecordData = options.applyReservedRecordData ?? true
  const applyRootRecordData = options.applyRootRecordData ?? true

  const haetaeCommand = config.commands[command]
  assert(!!haetaeCommand, `Command "${command}" is not configured.`)
  let recordData = (await haetaeCommand.run()) || ({} as D)

  let isObject = false
  try {
    isObject =
      recordData === undefined ||
      Object.getPrototypeOf(recordData) === Object.prototype
  } catch {
    throw new Error(
      'The return type of `run` must be a plain object(`{ ... }`) or `void`.',
    )
  }
  assert(
    isObject,
    'The return type of `run` must be a plain object(`{ ... }`) or `void`.',
  )
  if (applyReservedRecordData) {
    recordData = reserveRecordData(recordData, { dryRun: true })
  }

  if (applyRootRecordData) {
    return config.recordData(recordData)
  }
  return recordData
}

export function compareEnvs(one: Rec, theOther: Rec): boolean {
  let sOne
  let sTheOther
  try {
    sOne = JSON.stringify(one)
    sTheOther = JSON.stringify(theOther)
  } catch {
    throw new Error('`env` must be able to be stringified.')
  }

  return deepEqual(JSON.parse(sOne), JSON.parse(sTheOther), {
    strict: true,
  })
}

export interface FormRecordOptions<D extends Rec, E extends Rec> {
  data?: D
  env?: E
  time?: number
}

export async function formRecord<D extends Rec, E extends Rec>(
  options: FormRecordOptions<D, E> = {},
): Promise<HaetaeRecord<D, E>> {
  const data = options.data || (await invokeRun<D>())
  const env = options.env || (await invokeEnv<E>())
  const time = options.time || Date.now()
  return {
    data,
    env,
    time,
  }
}

export interface LocalStore<D extends Rec = Rec, E extends Rec = Rec> {
  version: string
  commands: {
    [command: string]: HaetaeRecord<D, E>[]
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const _loadStore = memoizee(
  async <D extends Rec, E extends Rec>(
    filename: string,
  ): Promise<LocalStore<D, E>> => {
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

export interface AddRecordOptions<D extends Rec, E extends Rec> {
  command?: string
  record?: HaetaeRecord<D, E>
}

export type AddRecord = <D extends Rec, E extends Rec>(
  options?: AddRecordOptions<D, E>,
) => PromiseOr<HaetaeRecord<D, E>>

export interface GetRecordOptions<E extends Rec> {
  command?: string
  env?: E
}

export type GetRecord = <D extends Rec = Rec, E extends Rec = Rec>(
  options?: GetRecordOptions<E>,
) => PromiseOr<HaetaeRecord<D, E> | undefined>

export interface StoreConnector {
  addRecord: AddRecord
  getRecord: GetRecord
}

export interface LoadStoreOptions {
  initWhenNotFound?: boolean
}

export interface LocalStoreConnector extends StoreConnector {
  initNewStore<D extends Rec, E extends Rec>(): LocalStore<D, E>
  loadStore<D extends Rec, E extends Rec>(
    options?: LoadStoreOptions,
  ): Promise<LocalStore<D, E>>
  saveStore(store: LocalStore): Promise<void>
  localStore: {
    filename: string // It should be an absolute or relative path (relative to config file path)
    recordRemoval: {
      age: number // by milliseconds if number // e.g. 90 * 24 * 60 * 60 * 1000 => 90days
      count: number // e.g. 10 => Only leave equal to or less than 10 records
    }
  }
}

export interface LocalStoreOptions {
  filename?: string
  recordRemoval?: {
    age?: number | string
    count?: number
    // countPerEnv?: number // TODO: Implement this
    leaveOnlyLastestPerEnv?: boolean
  }
}

// State does not change after initialization.
export function localStore({
  recordRemoval: {
    age = Number.POSITIVE_INFINITY,
    // countPerEnv = Number.POSITIVE_INFINITY, // TODO: Implement this
    count = Number.POSITIVE_INFINITY,
    leaveOnlyLastestPerEnv = true,
  } = {},
  filename = '.haetae/store.json',
}: LocalStoreOptions = {}): LocalStoreConnector {
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
    // This `localStore` field is a namespace to preserve properties for mixin.
    localStore: {
      filename,
      recordRemoval: {
        count,
        age,
      },
    },
    async addRecord<D extends Rec, E extends Rec>(
      options: AddRecordOptions<D, E> = {},
    ) {
      const store = await this.loadStore<D, E>()
      const command = options.command || getCurrentCommand()
      const record =
        options.record ||
        (await formRecord<D, E>({
          data: await invokeRun<D>({ command }),
          env: await invokeEnv<E>({ command }),
        }))

      const newStore = produce(store, (draft) => {
        /* eslint-disable no-param-reassign */
        draft.version = pkg.version.value
        draft.commands = draft.commands || {}
        // Do NOT change the original array! (e.g. use `slice` instead of `splice`)
        // That's because the store object is memoized by shallow copy.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        draft.commands[command] = draft.commands[command] || []
        if (leaveOnlyLastestPerEnv) {
          draft.commands[command] = draft.commands[command].filter(
            // remove old record with same env. So there's only one record left for each env.
            (oldRecord) => !compareEnvs(record.env, oldRecord.env),
          )
        }
        draft.commands[command] = draft.commands[command]
          .filter(
            (r) => Date.now() - r.time < this.localStore.recordRemoval.age,
          )
          .slice(0, this.localStore.recordRemoval.count)

        /* eslint-enable no-param-reassign */
        return draft
      })
      await this.saveStore(newStore)
      return record
    },
    async getRecord<D extends Rec = Rec, E extends Rec = Rec>(
      options: GetRecordOptions<E> = {},
    ): Promise<HaetaeRecord<D, E> | undefined> {
      const command = options.command || (await getCurrentCommand())
      const env = options.env || (await invokeEnv<E>({ command }))
      const store = await this.loadStore<D, E>()
      const records = store.commands[command]

      for (const record of records || []) {
        if (compareEnvs(env, record.env)) {
          return record
        }
      }
      return undefined // `undefined` if non-existent
    },
    async loadStore<D extends Rec, E extends Rec>({
      initWhenNotFound = true,
    }: LoadStoreOptions = {}) {
      try {
        return await _loadStore<D, E>(this.localStore.filename)
      } catch (error) {
        if (initWhenNotFound) {
          return this.initNewStore<D, E>()
        }
        throw error
      }
    },
    // This does not affect to filesystem, just creates a new store object
    initNewStore<D extends Rec, E extends Rec>(): LocalStore<D, E> {
      return { version: pkg.version.value, commands: {} }
    },
    async saveStore(store: LocalStore) {
      const dirname = upath.dirname(this.localStore.filename)
      try {
        await fs.access(dirname)
      } catch {
        await fs.mkdir(dirname, { recursive: true })
      }
      await fs.writeFile(
        this.localStore.filename,
        `${JSON.stringify(store, undefined, 2)}\n`, // trailing empty line
        {
          encoding: 'utf8',
        },
      )
      _loadStore.clear() // memoization cache clear
    },
  }
}

let store: StoreConnector

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const getRecord: GetRecord = (options) => store!.getRecord(options)
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const addRecord: AddRecord = (options) => store!.addRecord(options)
