/* eslint-disable import/no-extraneous-dependencies */
import { dirname } from 'dirname-filename-esm'
import { pathToFileURL } from 'url'
import path from 'path'

const specifierMap = {
  haetae: 'packages/haetae/src/index.js',
  '@haetae/cli': 'packages/cli/src/index.js',
  '@haetae/common': 'packages/common/src/index.js',
  '@haetae/core': 'packages/core/src/index.js',
  '@haetae/git': 'packages/git/src/index.js',
  '@haetae/javascript': 'packages/js/src/index.js',
  '@haetae/utils': 'packages/utils/src/index.js',
}

export function resolve(specifier, context, nextResolve) {
  if (specifierMap[specifier]) {
    return nextResolve(
      pathToFileURL(path.join(dirname(import.meta), specifierMap[specifier]))
        .href,
      context,
    )
  }

  return nextResolve(specifier, context)
}
