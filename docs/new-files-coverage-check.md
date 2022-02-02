This repo contains code used in the [Harness CD Community Edition](https://github.com/harness/harness-cd-community) which is licensed under the [PolyForm Shield License 1.0.0](./licenses/PolyForm-Shield-1.0.0.txt). This repo also contains code belonging to Harness CD Enterprise Plan which is licensed under the [PolyForm Free Trial License 1.0.0](./licenses/PolyForm-Free-Trial-1.0.0.txt). You may obtain a copy of these licenses in the [licenses](./licenses/) directory at the root of this repository.

# new-files-coverage-check

```
new-file-coverage-check [args]

New files coverage check

Options:
      --version    Show version number                                 [boolean]
      --help       Show help                                           [boolean]
  -b, --branch                                               [default: "master"]
  -t, --threshold                                                  [default: 80]
  -i, --input                        [default: "coverage/coverage-summary.json"]
  -e, --exclude
              [array] [default: ["!**/*.test.tsx","!**/*.test.ts","!**/*.snap"]]
```
