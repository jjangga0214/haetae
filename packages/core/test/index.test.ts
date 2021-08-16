import path from 'path'
import { getConfig, getStore } from '#core'

describe('index', () => {
  it('getConfig', async () => {
    expect.hasAssertions()
    const config = await getConfig({
      filename: path.join(__dirname, 'haetae.config.example.js'),
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const res = await config.commands.test.target()
    expect(res).toStrictEqual(['hello.ts'])
  })

  it('getStore', async () => {
    expect.hasAssertions()
    const store = await getStore({
      filename: path.join(__dirname, 'haetae.example.json'),
    })

    expect(store.version).toStrictEqual('0.0.1')
  })
})
