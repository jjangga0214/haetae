---
'@haetae/cli': patch
---

When -c is not given and `$HAETAE_CONFIG_FILE` is also undefined, the cli finds 'haetae.config.json' file by walking up parent directories recursively.
