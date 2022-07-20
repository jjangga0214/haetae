import yaml from 'yaml'
import { HaetaeRecord } from '@haetae/core'
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import signale from 'signale'
import dayjs from 'dayjs'
import isObject from 'lodash.isobject'
import isEmpty from 'lodash.isempty'
import { getInfo } from './info'

export function wrapBlock(lines: string[]): string[] {
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

export function processColons(lines: string[]): string[] {
  return (
    lines
      // only dim the first colon from the line
      .map((line) => line.replace(':', chalk.dim.bold(':')))
  )
}

export const al = {
  key: 'value',
  key2: 1,
}

export function processRecord(record: HaetaeRecord): string {
  const padding = ' '.repeat(5)
  const lines = [
    `🕗 ${chalk.cyan('time')}: ${dayjs(record.time).format(
      'YYYY MMM DD HH:mm:ss', // REF: https://day.js.org/docs/en/parse/string-format
    )}`,
  ]

  for (const { renderedKey, value } of [
    { renderedKey: `🌱 ${chalk.green('env')}:`, value: record.env },
    { renderedKey: `💾 ${chalk.yellow('data')}:`, value: record.data },
  ]) {
    if (!isObject(value) || (isObject(value) && isEmpty(value))) {
      lines.push(`${renderedKey} ${chalk.dim(yaml.stringify(value))}`)
    } else {
      lines.push(
        renderedKey,
        ...`${yaml.stringify(value)}`
          .trim()
          .split('\n')
          .map((l) => `${padding}${l}`),
      )
    }
  }

  return processColons(wrapBlock(lines)).join('\n')
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
  WARN = 'warn',
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
  warn(message: string, result?: unknown) {
    this.json({
      status: JsonSimpleResponseStatus.WARN,
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
  render: (result: T) => string | undefined
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
