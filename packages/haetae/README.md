# `haetae`

Grouping of frequentely used packages(`@haetae/*`) for [**Haetae**](https://github.com/jjangga0214/haetae).

[![license](https://img.shields.io/badge/license-MIT-ff4081.svg?style=flat-square&labelColor=black)](https://github.com/jjangga0214/haetae/blob/main/LICENSE)
![test](https://img.shields.io/badge/test-jest-7c4dff.svg?style=flat-square&labelColor=black)
[![code style:airbnb](https://img.shields.io/badge/code_style-airbnb-448aff.svg?style=flat-square&labelColor=black)](https://github.com/airbnb/javascript)
[![code style:prettier](https://img.shields.io/badge/code_style-prettier-18ffff.svg?style=flat-square&labelColor=black)](https://prettier.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-ffab00.svg?style=flat-square&labelColor=black)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/Commitizen-cz_conventional_changelog-dd2c00.svg?style=flat-square&labelColor=black)](http://commitizen.github.io/cz-cli/)
![pr welcome](https://img.shields.io/badge/PRs-welcome-09FF33.svg?style=flat-square&labelColor=black)

🚧 WIP

## Haetae

**Haetae** enables incremental test, lint, build, and more, for any languages, platforms, and frameworks.
**Haetae**'s main functionalities are implemented by [`@haetae/cli`](https://github.com/jjangga0214/haetae/tree/main/packages/cli) and [`@haetae/core`](https://github.com/jjangga0214/haetae/tree/main/packages/core).

This pacakge(`haetae`) is not **Haetae** itself, but a convenient grouping of frequently used packages, including `@haetae/cli` and `@haetae/core`.

For understanding **Haetae** itself first, please read [the repository(monorepo)](https://github.com/jjangga0214/haetae)'s README, not this packages' README.

## Why?

Haetae is very loosely coupled.
Heatae enables flexible configuration for any kind of incremental tasks.
So, you can freely set how it works.

But there're still some patterns and toolsets frequently used in general scenario.
That's why the Haetae organization implements several offical packages.

Though you can of course selectively depend on only what you really need, sometimes you just want them all as a single package for convenience.

This package(`haetae`) is for that purpose. This package depends on all of them(`@haetae/*`) and exports every features of them.

**Full List:**

- [`@haetae/cli`](https://github.com/jjangga0214/haetae/tree/main/packages/cli)
- [`@haetae/core`](https://github.com/jjangga0214/haetae/tree/main/packages/core)
- [`@haetae/git`](https://github.com/jjangga0214/haetae/tree/main/packages/git)
- [`@haetae/javascript`](https://github.com/jjangga0214/haetae/tree/main/packages/javascript)
- [`@haetae/jest`](https://github.com/jjangga0214/haetae/tree/main/packages/jest)
- [`@haetae/utils`](https://github.com/jjangga0214/haetae/tree/main/packages/utils)

## CLI Usage

This is identical from [`@haetae/cli`](https://github.com/jjangga0214/haetae/tree/main/packages/cli). You can use CLI `haetae` as if you installed `@haetae/cli` directly. Refer to `@haetae/cli`'s docs for description.

## Programmatic Usage (in config file)

This package(`haetae`) has a very simple source code.

```ts
export * as cli from '@haetae/cli'
export * as core from '@haetae/core'
export * as git from '@haetae/git'
export * as javascript from '@haetae/javascript'
export * as jest from '@haetae/jest'
export * as utils from '@haetae/utils'
```

So, you can use `haetae` like the example below.

**haetae.config.js** (example):

```js
const { core, git, javascript: js, jest, utils } = require('haetae')

// `core.configure` helps you by type checking (on IDE level), as it has .d.ts files
module.exports = core.configure({
  commands: {
    test: {
      target: async ({ prevRecord }) => {
        // return any test files which (transitively) depends on changed(git) files
        return (await utils.glob(['**/*.test.ts'])).filter(
          // `js.dependsOn` can detect ts, tsx, js, jsx, tsconfig and webpack,
          // although its package name is `@haetae/javascript`.
          js.dependsOn(git.changedFiles()),
        )
      },
      env: ({ coreVersion }) => ({
        nodeVersion: process.version,
        os: process.platform,
        coreVersion,
      }),
      save: async ({ prevRecord }) => git.record(),
    },
    lint: {
      target: async ({ prevRecord }) => {
        // return only changed(git) typescript files
        return (await git.changedFiles()).filter((filename) =>
          filename.endsWith('.ts'),
        )
      },
      save: async ({ prevRecord }) => git.record(),
    },
  },
})
```
