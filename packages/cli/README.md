# `@haetae/cli`

CLI for [**Haetae**](https://github.com/jjangga0214/haetae).

[![license](https://img.shields.io/badge/license-MIT-ff4081.svg?style=flat-square&labelColor=black)](https://github.com/jjangga0214/haetae/blob/main/LICENSE)
![test](https://img.shields.io/badge/test-jest-7c4dff.svg?style=flat-square&labelColor=black)
[![code style:airbnb](https://img.shields.io/badge/code_style-airbnb-448aff.svg?style=flat-square&labelColor=black)](https://github.com/airbnb/javascript)
[![code style:prettier](https://img.shields.io/badge/code_style-prettier-18ffff.svg?style=flat-square&labelColor=black)](https://prettier.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-ffab00.svg?style=flat-square&labelColor=black)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/Commitizen-cz_conventional_changelog-dd2c00.svg?style=flat-square&labelColor=black)](http://commitizen.github.io/cz-cli/)
![pr welcome](https://img.shields.io/badge/PRs-welcome-09FF33.svg?style=flat-square&labelColor=black)

🚧 WIP

## Commands: `haetae <command>`

The CLI's commands are dynamically generated at runtime, from config file's `Command`s.

### Reserved Static Commands

**Reserved Static Commands** are not generated. Rather, their behavior are statically fixed regardless of config file. Of course, they are reserved by Haetae. Thus, you should **NOT** define your own `Command` whose name is overlapped with **Reserved Static Commands**.

- `store`: Currently, `haetae store` is the only **Reserved Static Commands**.

Please note that, **Reserved Static Commands** are different from **Reserved Dynamic Subcommands**.

### Usage

Commands like `test`, `lint` and `bulid` from the below example are generated at runtime, which means that your result might be different by your config file's setting.

```shell
$ haetae --help

Usage: haetae [options] <command> [options] [<subcommand> [options]]

Incremental test, lint, build and more.
For any languages, platforms, and frameworks.
The CLI dynamically (at runtime) produces commands and subcommands by your config file.

Options:
  -v, --version        Show the version.
  -c, --config <path>  Config file directory or filename. It can be relative or absolute.
                       (default: $HAETAE_CONFIG_FILE or ./haetae.config.js)
  -j, --json           Format output to json if possible. This doesn't affect to commands
                       which has fixed format, or already json format. (default: false)
  --no-color           Disable colorized (e.g. red for error) / decorated (e.g. bold text)
                       output.
  -h, --help           Show helpful descriptions.

Commands:
  store                Show content of store file.
  test                 User-defined command from config.
  lint                 User-defined command from config.
  build                User-defined command from config.

Repo for any issues, questions and contribution(💖):
  https://github.com/jjangga0214/haetae

Examples:
  $ haetae store
  $ haetae --config /path/to/haetae.config.js test records # [NOTE] "records" is plural.
  $ haetae --no-color lint record  # [NOTE] "record" is singular.
  $ haetae test target | jest # [NOTE] pipeline to your(any) test runner
  $ haetae lint target | eslint # [NOTE] pipeline to your(any) linter/formatter
  $ haetae --json test target | your-json-operator | your-test-runner
  $ haetae build env
  $ haetae lint save
  $ haetae build --help
```

## Subcommands: `haetae <command> <subcommand>`

Like CLI commands, CLI's subcommands are dynamically generated at runtime, from your config file's `Subcommand`s.

### Reserved Dynamic Subcommands

Unlike **Reserved Static Commands**, you **CAN** define **Reserved Dynamic Subcommands** on your own, in the config file.

They are _"reserved"_, so Haetae expects your definitions to implement specific "contracts".

They are also _"dynamic"_, so you can override default behaviors.

Currently all of them are optional, so if you do not define them, default configuration is used.

Otherwise are not generated. Rather, they are fixed statically and literally reserved by Haetae. Thus, you should **NOT** create your own `Subcommand` whose name is overlapped with **Reserved Commands**.

- `target`:
  - contract: The corresponding function in config file should return an array of string(`string[]`). The array can be empty(`[]`). Though not required, in general, elements are (absolute) paths to files.
  - default (when not configured): Prints empthy string as stdout, not stderr.
  - behavior: Prints every elements of the array. The output is delimited by `\n` by default, but printed as-is (javascript array) if `--json` option is given.
- `env`:
  - contract: The corresponding function in config file should return an object(json). The object can be empty(`{}`).
  - default (when not configured): Prints `{}` as stdout, not stderr.
  - behavior: Prints env object of your computer. Output is always json format.
- `save`:
  - contract: The corresponding function in config file should return an object(json). The object can be empty(`{}`). Though not required, in general, keys of object are package name for namespace to save their information for next execution. (e.g. `{ '@haetae/git': { gitSha: "1803de" } }`)
  - default (when not configured): Prints `{}` as stdout, not stderr.
  - bahavior: This saves a record returned from corresponding function in config file. Store file is modified by this operation.

Please note that **Reserved Dynamic Subcommands** are different form **Reserved Static Commands**.

### Usage

Command like `test` and Subcommands like `foo` from the below example are generated at runtime, which means that your result might be different by your config file's setting.

```shell
$ haetae test --help

Usage: haetae test [options] [command]

User-defined command from config.

Options:
  -h, --help  Show helpful descriptions.

Commands:
  target      Show targets.
  env         Show current env object.
  save        Save a new record to store file and show the new record.
  records     Show every records of given command.
  record      Show record of given command and current env.
  foo         User-defined subcommand from config.
```
