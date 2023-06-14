import upath from 'upath'
import { dirname } from 'dirname-filename-esm'
import { jest } from '@jest/globals'
import * as core from '@haetae/core'
import { changedFiles, ChangedFilesOptions } from '../src/changed-files.js'
import { RecordData } from '../src/pkg.js'

describe('changedFiles', () => {
  const rootDir = upath.resolve(dirname(import.meta), 'changed-files')
  const options = async (): Promise<ChangedFilesOptions> => ({
    renew: ['{c,d,f,g}'],
    previousFiles: {
      b: 'b',
      'b.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c', // hash of 'Hello World
      c: 'c',
      'c.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      e: 'e',
      f: 'f',
      i: 'i',
    },
    rootDir,
  })

  test('basic usage', async () => {
    const reserveRecordData = jest.fn((recordData: RecordData) => recordData)
    const result = await changedFiles(['*', '!i'], {
      ...(await options()),
      reserveRecordData:
        reserveRecordData as unknown as typeof core.reserveRecordData,
    })
    expect(new Set(result)).toStrictEqual(
      new Set([
        upath.resolve(rootDir, 'a'),
        upath.resolve(rootDir, 'b'),
        upath.resolve(rootDir, 'c'),
        upath.resolve(rootDir, 'd'),
        upath.resolve(rootDir, 'e'),
        upath.resolve(rootDir, 'f'),
      ]),
    )
    expect(
      reserveRecordData.mock.calls[0][0]['@haetae/utils'].files,
    ).toStrictEqual({
      // 'a' should not be recorded because it is not to renew
      // a: '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      b: 'b',
      'b.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      c: '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      'c.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      d: '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      e: 'e', // 'e' should be recorded as `keepRemovedFiles` is true by default
    })
  })

  test('glob: false', async () => {
    const reserveRecordData = jest.fn((recordData: RecordData) => recordData)
    const result = await changedFiles(['*', '!i'], {
      ...(await options()),
      renew: ['c', 'd', 'f', 'g'], // `renew` is not glob pattern
      reserveRecordData:
        reserveRecordData as unknown as typeof core.reserveRecordData,
      glob: false,
    })
    expect(new Set(result)).toStrictEqual(new Set())
    expect(
      reserveRecordData.mock.calls[0][0]['@haetae/utils'].files,
    ).toStrictEqual({})

    const result2 = await changedFiles(
      ['a', 'b', 'b.not-changed', 'c', 'c.not-changed', 'd', 'e', 'f', 'h'],
      {
        ...(await options()),
        renew: ['c', 'd', 'f', 'g'], // `renew` is not glob pattern
        reserveRecordData:
          reserveRecordData as unknown as typeof core.reserveRecordData,
        glob: false,
      },
    )
    expect(new Set(result2)).toStrictEqual(
      new Set([
        upath.resolve(rootDir, 'a'),
        upath.resolve(rootDir, 'b'),
        upath.resolve(rootDir, 'c'),
        upath.resolve(rootDir, 'd'),
        upath.resolve(rootDir, 'e'),
        upath.resolve(rootDir, 'f'),
      ]),
    )
    expect(
      reserveRecordData.mock.calls[1][0]['@haetae/utils'].files,
    ).toStrictEqual({
      b: 'b',
      'b.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      c: '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      'c.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      d: '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      e: 'e',
    })
  })

  test('filterByExistence: true', async () => {
    const reserveRecordData = jest.fn((recordData: RecordData) => recordData)
    const result = await changedFiles(['*', '!i'], {
      ...(await options()),
      reserveRecordData:
        reserveRecordData as unknown as typeof core.reserveRecordData,
      filterByExistence: true,
    })
    expect(new Set(result)).toStrictEqual(
      new Set([
        upath.resolve(rootDir, 'a'),
        upath.resolve(rootDir, 'b'),
        upath.resolve(rootDir, 'c'),
        upath.resolve(rootDir, 'd'),
      ]),
    )
    expect(
      reserveRecordData.mock.calls[0][0]['@haetae/utils'].files,
    ).toStrictEqual({
      b: 'b',
      'b.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      c: '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      'c.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      d: '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      e: 'e',
    })
  })

  test('keepRemovedFiles: false', async () => {
    const reserveRecordData = jest.fn((recordData: RecordData) => recordData)
    const result = await changedFiles(['*', '!i'], {
      ...(await options()),
      keepRemovedFiles: false,
      reserveRecordData:
        reserveRecordData as unknown as typeof core.reserveRecordData,
    })
    expect(new Set(result)).toStrictEqual(
      new Set([
        upath.resolve(rootDir, 'a'),
        upath.resolve(rootDir, 'b'),
        upath.resolve(rootDir, 'c'),
        upath.resolve(rootDir, 'd'),
        upath.resolve(rootDir, 'e'),
        upath.resolve(rootDir, 'f'),
      ]),
    )
    expect(
      reserveRecordData.mock.calls[0][0]['@haetae/utils'].files,
    ).toStrictEqual({
      b: 'b',
      'b.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      c: '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      'c.not-changed':
        '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      d: '1e4a09343495ad2d7792c67e1b970084943efa24ceef8affc3943c060f56475c',
      // e: 'e', // 'e' should not be recorded as `keepRemovedFiles` is false
    })
  })
})
