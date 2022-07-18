import yaml from 'yaml'
import { HaetaeRecord } from '@haetae/core'
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import signale from 'signale'
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

export function processRecord(record: HaetaeRecord): string {
  const padding = ' '.repeat(5)
  const lines = [
    `🕗 ${chalk.cyan('time')}: ${record.time}`, // TODO: to human readable string
    `🌱 ${chalk.green('env')}:`,
    ...`${yaml.stringify(record.env)}` // TODO: handle empty object or undefined
      .trim()
      .split('\n')
      .map((l) => `${padding}${l}`),
    `💾 ${chalk.yellow('data')}:`,
    ...`${yaml.stringify(record.data)}` // TODO: handle empty object or undefined
      .trim()
      .split('\n')
      .map((l) => `${padding}${l}`),
  ]

  return processColons(wrapBlock(lines)).join('\n')
}

export function processInfo(info: Awaited<ReturnType<typeof getInfo>>) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const lines = []
  const colorizedLines = []

  const versionAndPathDelimiter = ' • '
  // eslint-disable-next-line guard-for-in
  for (let key in info) {
    const value = info[key as keyof typeof info]
    if (value && Object.prototype.hasOwnProperty.call(info, key)) {
      key = key.replace(/"/g, '')
      if (typeof value === 'string') {
        // When `value` is string
        lines.push(`${key}: ${value}`)
        colorizedLines.push(`${key}: ${value}`)
      } else if (typeof value === 'object') {
        // When `value` is `VersionAndPath`
        lines.push(
          `${key}: ${value.version}${versionAndPathDelimiter}${value.path}`,
        )
        colorizedLines.push(
          `${key}: ${value.version}${chalk.dim.bold(
            versionAndPathDelimiter,
          )}${chalk.dim(value.path)}`,
        )
      } else {
        // When `value` is undefined
        lines.push(`${key}: ${'N/A'}`)
        colorizedLines.push(`${key}: ${chalk.dim('N/A')}`)
      }
    }
  }

  const message = lines.join('\n')
  const colorizedMessage = processColons(colorizedLines).join('\n')
  return {
    plain: message,
    colorized: colorizedMessage,
  }
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
