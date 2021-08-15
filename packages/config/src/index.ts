import path from 'path'

export const configFilePath = process.env.HAETAE_CONFIG_FILE as string
export const configFileRootDir = path.dirname(configFilePath)
