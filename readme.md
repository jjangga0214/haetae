# Haetae

Incremental tasks - test, lint, build, and more - for any environment.

[![license](https://img.shields.io/badge/license-MIT-ff4081.svg?style=flat-square&labelColor=black)](./LICENSE)
[![test](https://img.shields.io/badge/test-jest-7c4dff.svg?style=flat-square&labelColor=black)](./jest.config.js)
[![code style:airbnb](https://img.shields.io/badge/code_style-airbnb-448aff.svg?style=flat-square&labelColor=black)](https://github.com/airbnb/javascript)
[![code style:prettier](https://img.shields.io/badge/code_style-prettier-18ffff.svg?style=flat-square&labelColor=black)](https://prettier.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-ffab00.svg?style=flat-square&labelColor=black)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/Commitizen-cz_conventional_changelog-dd2c00.svg?style=flat-square&labelColor=black)](http://commitizen.github.io/cz-cli/)
![pr welcome](https://img.shields.io/badge/PRs-welcome-09FF33.svg?style=flat-square&labelColor=black)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fjjangga0214%2Fhaetae.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fjjangga0214%2Fhaetae?ref=badge_shield)

🚧 WIP (The readme is out of date. It is to be rewritten soon.)

## Why?

There're needs of automating, especially on CI, incremental tasks.

For examples,

- Linting only changed source files.
- Running only affected test files, either when the test file is changed or transitive dependancy source file is changed, with language-specific automatic dependancy graph detection.
- Triggering build only when source file is changed. Or selectively building only changed source files and overriding existing build cache.
- Storing 'state' or 'result' for each tasks (Unless you save it, like if a test is failed or not, "incremental" task becomes impossible in most scenario.).
- Detecting changes by your own customized criteria (e.g. git diff against to lastly pushed commit per branch.), and doing some very specialized task.

**Haetae** enables all kinds of incremental tasks, including test, lint, build, and more, with ease.

Haetae is written in (compiled to) js, so requires nodejs runtime.
But regardless of that, it's purpose is for any languages, frameworks and platforms.
For now, it only officially supports javascript, JSX, typescript, and TSX.
However, more language supports are possibly to be added in future.

## Getting Started

In this section, you'd be guided to understand the basic usage. For more detail, please refer to docs.

### Installation

```sh
npm install --save-dev haetae
# or
yarn add --dev haetae
# or
pnpm add --save-dev haetae
```

Or

```sh
npm install --save-dev @haetae/core @haetae/cli @haetae/...
```

**Haetae** is loosely coupled. The main funtionalities are implemented by [`@haetae/cli`](./packages/cli) and [`@haetae/core`](./packages/core). They are the minimum required depedencies you need to have (For plugin writer, the required minimum is `@haetae/core`).

Of course, for additional features, there're some other official packages as well (e.g. `@haetae/*`). So you can freely pick only what you need.

On the other hand, the package [`haetae`](./packages/haetae) is the all-in-one package, battery-included for general scenarios. It includes every official packages, [`@haetae/cli`](./packages/cli), [`@haetae/core`](./packages/core), [`@haetae/git`](./packages/git), [`@haetae/utils`](./packages/utils), and [`@haetae/javascript`](./packages/javascript). Though it depends on multiple packages, as each one's size is small, `haetae` is also quite lightweight.

So the choice between the two - _"picking only what you need(`@haetae/*`)"_ VS _"a single battery-included package(`haetae`)"_ - is up to you.

In this _"Getting Started"_ section, we are assumed to simply depend on `haetae`, the latter one.

### Writing a config file (`haetae.config.js`)

After the installation, create a new config file named **haetae.config.js** under the project root directory (next to your package.json).

```js
const { core, git, js, utils } = require('haetae')

// You can just export pure json without `core.configure`.
// But `core.configure` would help you by type-checking (on IDE level)
module.exports = core.configure({
  commands: {
    // `commands.*` must have `run` and `env` functions.
    test: {
      run: async () => {
        // An array of test files which (transitively) depend on changed (git) files
        const filesToTest = utils
          .glob(['**/*.test.ts']) // Get an array of files by glob pattern.
          // Leave test files only if one of its (transitive) dependency file changed or test file itself changed.
          .filter(js.dependsOn(git.changedFiles()))

        if (filesToTest.length > 0) {
          // Execute tests
          // (Replace jest and yarn with your test runner and package manager)
          await utils.exec(`yarn jest ${filesToTest.join(' ')}`)
          // Equals to "yarn jest path/to/foo.test.ts path/to/bar.test.ts ..."
        }

        // `commands.*.run` must return a json to record.
        return git.recordData()
      },
      env: async () => ({
        nodeVersion: process.version,
        os: process.platform,
        coreVersion: core.version,
      }),
    },
  },
})
```

How this works would be explained little by little as this section goes.

### Executing incremental task

```shell
haetae test
```

The subcommand `test` is not a reserved keyword. This is just matched with what you wrote in your config file. In our example, we wrote a function `commands.test.run` in the config file. The CLI will find your config file, and execute the function.

### What's happening?

1. finding a config file
2. finding a store file
   if found ->
   if not -> create an empty store.
3. run the functin
4. finding an equal env form the store.
   if found -> override
   if not -> create

If test fails by exiting non-zero(0) code, `utils.exec` throws an error. Then, the store is not updated by returned json(`git.recordData()` in this example). Thus, for the next time, we can expect Haetae to run tests includeing the failed ones(re-run) as store is not changed.

You can read each packages' detailed docs of how each functions work.

- `git.changedFiles()` returns an array of changed files (detecting by git) from Haetae's last execution in the same **env**. If there's no execution recorded, which means this time is the initial execution, then it returns an arrey of every files tracked by git.
- `js.dependsOn(files)` is a higher-order function that returns a predicate function. The returned funtion returns a boolean of if an argument depends on the files or not. It can detect ts, tsx, js, jsx, tsconfig and webpack, although its package name is `@haetae/javascript`.

1. The path to config file(`haetae.config.js`.) is resolved, by priority, from an env var `$HAETAE_CONFIG_FILE` or current working directory, or recursively parental directory.
1. The CLI(`@haetae/cli`) passes the subcommand `test` to the core(`@haetae/core`), and the core accesses to `commands.test`, which is the javascript object you wrote.
1. The core

## Concepts

## License

MIT License. Copyright © 2021, GIL B. Chan <github.com/jjangga0214> <bnbcmindnpass@gmail.com>


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fjjangga0214%2Fhaetae.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fjjangga0214%2Fhaetae?ref=badge_large)