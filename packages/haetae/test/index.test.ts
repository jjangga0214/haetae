import { configure, git, core } from '../src/index.js'

describe('configure()', () => {
  test('basic usage', async () => {
    core.setConfigFilename({
      filename: 'haetae.config.js',
      checkExistence: false, // virtual file
    })
    const config = configure({
      commands: {},
    })
    const recordData = await config.recordData({})
    expect(recordData[git.pkg.name]).toBeDefined()
  })
})
