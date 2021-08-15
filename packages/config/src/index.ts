import path from 'path'

export const configFilePath: string = process.env.HAETAE_CONFIG_FILE || ''
export const configFileRootDir = path.dirname(configFilePath)

// interface HaetaeRecord {
//   version: string
//   time: string
//   gitSha?: string
//   env: Record<string, any>
// }

// async function getPrevRecord(): HaetaeRecord {
//   console.log(Date.now())
//   console.log(new Date().toISOString())
//   console.log(Date.parse('2021-08-15T10:07:08.156Z'))
//   console.log(configFileRootDir)
// }

// getPrevRecord()
