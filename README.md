# Jarvis

Tooling for UI Repos

This package contains the following tools

**CLI**

- `clean-css-types`: For cleaning up old type declaration files for deleted CSS/SCSS files.
- `jest-grouped-coverage`: Tool to generate grouped coverage report from jest's JSON coverage report in HTML and markdown formats.
- `jest-text-coverage-reporter`: Tool to generate coverage report from jest's JSON coverage report in text format. (It can be posted as comment on a PR.)
- `typecheck-staged`: Script to typecheck staged files while using husky (not meant to be used as stand alone).

## clean-css-types

```
clean-css-types <path> [args]

Find and remove declarations for style (css, scss, etc.) files

Positionals:
  path  Path to search the definitions

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -e, --ext      The extensions to look for. Example: .css, .scss
                                                     [array] [default: [".css"]]
```

## jest-grouped-coverage

```
jest-grouped-coverage [args]

Generate reports using given groups data as json

Options:
      --version  Show version number                                   [boolean]
      --help     Show help                                             [boolean]
  -i, --input    Path to coverage report in JSON format               [required]
  -c, --config   Path to coverage config in JSON format               [required]
  -o, --output   Output path for the report
                                   [default: "coverage/grouped-coverage-report"]
  -f, --format   Output format of the report (html/md)
                                                     [array] [default: ["html"]]
      --cwd      Convert absolute paths to relative paths (w.r.t to this path),
                 within the reports. Default is `process.cwd()`
      --json     export result in JSON format in output directory
  -u, --up       Slice a path off the start of the paths   [number] [default: 0]
      --verbose  Show verbose output

Missing required arguments: i, c
```

## jest-text-coverage-reporter

```
Generates text reports (in markdown) from given coverage

Options:
      --version  Show version number                                   [boolean]
      --help     Show help                                             [boolean]
  -i, --input    Path to coverage report in JSON format               [required]
  -o, --output   Output path for the report [default: "coverage/text-report.md"]
  -u, --up       Slice a path off the start of the paths   [number] [default: 0]
      --cwd      Convert absolute paths to relative paths (w.r.t to this path),
                 within the reports. Default is `process.cwd()`
      --verbose  Show verbose output
```
