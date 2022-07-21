import yaml from 'yaml'
import { HaetaeRecord, HaetaeStore } from '@haetae/core'
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import signale from 'signale'
import dayjs from 'dayjs'
import isObject from 'lodash.isobject'
import isEmpty from 'lodash.isempty'
import produce from 'immer'
import { getInfo } from './info'

function wrapBlock(lines: string[]): string[] {
  if (lines.length === 1) {
    return [`${chalk.dim('[')} ${lines[0]}`]
  }
  return lines.map((line, index) => {
    if (index === 0) {
      return `${chalk.dim('⎡')} ${line}`
    }
    if (index === lines.length - 1) {
      return `${chalk.dim('⎣')} ${line}`
    }
    return `${chalk.dim('⎜')} ${line}`
  })
}

function processColons(lines: string[]): string[] {
  return (
    lines
      // only dim the first colon from the line
      .map((line) => line.replace(':', chalk.dim.bold(':')))
  )
}

function isToBeSingleLine(value: unknown): boolean {
  return !isObject(value) || (isObject(value) && isEmpty(value))
}

export function asBlock<T>(value: T): string | T {
  if (isToBeSingleLine(value)) {
    return wrapBlock([`${value}`])[0]
  }
  const rawLines = yaml.stringify(value).trim().split('\n')
  const lines = processColons(wrapBlock(rawLines))
  return lines.join('\n')
}

export function processRecord({ time, env, data }: HaetaeRecord): string {
  const indentation = ' '.repeat(3)
  const rawLines = yaml.stringify({ time, env, data }).trim().split('\n')
  const lines = rawLines
    .map((line) =>
      line.startsWith('time:')
        ? `time: ${dayjs(time).format(
            'YYYY MMM DD HH:mm:ss', // REF: https://day.js.org/docs/en/parse/string-format
          )} ${chalk.dim(`(timestamp: ${time})`)}`
        : line,
    )
    .map((line) =>
      line
        .replace(/^time:/, `🕗 ${chalk.cyan('time')}:`)
        .replace(/^env:/, `🌱 ${chalk.green('env')}:`)
        .replace(/^data:/, `💾 ${chalk.yellow('data')}:`),
    )
    .map((line) => (line.startsWith(' ') ? `${indentation}${line}` : line))

  return processColons(wrapBlock(lines)).join('\n')
}

export async function processStore(store: HaetaeStore): Promise<string> {
  const uuid = '4f9360a0-9920-4159-a68d-8b151699d7a7'
  const patchedStore = await produce(store, async (draft) => {
    for (const command in draft.commands) {
      if (
        Object.prototype.hasOwnProperty.call(draft.commands, command) &&
        draft.commands[command]
      ) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        draft.commands[command] = draft.commands[command].map((_, index) =>
          JSON.stringify({ uuid, command, index }),
        )
      }
    }
    return draft
  })

  const patchedYaml = yaml.stringify(patchedStore)

  const indentation = ' '.repeat(4)

  const lines = patchedYaml.split('\n').flatMap((line) => {
    if (line.includes(uuid)) {
      // `line` would be like
      //    - '{"uuid":"4f9360a0-9920-4159-a68d-8b151699d7a7","command":"test","index":3}'
      const sjson = line
        .trim()
        .replace(/^- /, '')
        .replace(/^'/, '')
        .replace(/'$/, '')

      // `sjson` would be like
      // {"uuid":"4f9360a0-9920-4159-a68d-8b151699d7a7","command":"test","index":3}
      const { command, index } = JSON.parse(sjson)
      const record = store.commands[command][index]
      return `${index === 0 ? '\n' : ''}${processRecord(record)}\n`
        .split('\n')
        .map((line) => `${indentation}${line}`)
    }
    return line
  })
  return processColons(lines).join('\n')
}

export function processInfo(info: Awaited<ReturnType<typeof getInfo>>) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const lines = []

  const versionAndPathDelimiter = ' • '
  // eslint-disable-next-line guard-for-in
  for (let key in info) {
    const value = info[key as keyof typeof info]
    if (value && Object.prototype.hasOwnProperty.call(info, key)) {
      key = key.replace(/"/g, '')
      if (typeof value === 'string') {
        // When `value` is string
        lines.push(`${key}: ${value}`)
      } else if (typeof value === 'object') {
        // When `value` is `VersionAndPath`
        lines.push(
          `${key}: ${value.version}${chalk.dim.bold(
            versionAndPathDelimiter,
          )}${chalk.dim(value.path)}`,
        )
      } else {
        // When `value` is undefined
        lines.push(`${key}: ${chalk.dim('N/A')}`)
      }
    }
  }

  const message = processColons(lines).join('\n')
  return message
}

enum JsonSimpleResponseStatus {
  SUCCESS = 'success',
  FATAL = 'fatal',
}

interface JsonSimpleResponse {
  status: JsonSimpleResponseStatus
  message: string
}

export const json = {
  json(object: unknown, error = false) {
    const response = JSON.stringify(object, undefined, 2)
    if (error) {
      console.error(response)
    } else {
      console.log(response)
    }
  },
  success(message: string, result?: unknown) {
    this.json({
      status: JsonSimpleResponseStatus.SUCCESS,
      message: stripAnsi(message),
      result,
    } as JsonSimpleResponse)
  },
  fatal(message: string, result?: unknown) {
    this.json({
      status: JsonSimpleResponseStatus.FATAL,
      message: stripAnsi(message),
      result,
    } as JsonSimpleResponse)
  },
}

interface ConditionalOptions<T> {
  toJson: boolean
  result?: T
  // render: if undefined is returned, it would not be printed out.
  render: (result: T) => string | T | undefined
  message: string
  noResultMessage: string
}

export function conditional<T>({
  toJson,
  result,
  render,
  message,
  noResultMessage,
}: ConditionalOptions<T>) {
  if (
    result !== undefined &&
    (Array.isArray(result) ? result.length > 0 : true)
  ) {
    if (toJson) {
      json.success(message, result)
    } else {
      const rendered = render(result)
      if (rendered !== undefined) {
        signale.success(`${message}\n`)
        console.log(rendered)
      } else {
        signale.success(message)
      }
    }
  } else if (toJson) {
    json.success(noResultMessage, result)
  } else {
    signale.success(noResultMessage)
  }
}
