---
'@haetae/core': patch
---

**BREAKING CHANGE**: A string constant `defaultConfigFile` is replaced by an contant array `defaultConfigFiles`. From now on, `haetae.config.js`, `haetae.config.mjs`, `haetae.config.ts`, `haetae.config.mts` are automatically searched. For typescript file, a peer dependency `ts-node` should be installed first.
