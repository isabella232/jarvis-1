#!/usr/bin/env node
const reportGenerator = require('../lib/jest/jest-grouped-coverage').default;

require('yargs')
  .scriptName('jest-grouped-coverage')
  .command(
    '$0 [args]',
    'Generate reports using given groups data as json',
    yargs => {
      yargs
        .option('i', {
          alias: 'input',
          demandOption: true,
          describe: 'Path to coverage report in JSON format'
        })
        .option('c', {
          alias: 'config',
          demandOption: true,
          describe: 'Path to coverage config in JSON format'
        })
        .option('o', {
          alias: 'output',
          describe: 'Output path for the report',
          default: 'coverage/grouped-coverage-report'
        })
        .option('f', {
          alias: 'format',
          type: 'array',
          describe: 'Output format of the report (html/md)',
          default: ['html']
        })
        .option('cwd', {
          describe:
            'Convert absolute paths to relative paths (w.r.t to this path), within the reports. Default is `process.cwd()`',
          default: process.cwd()
        })
        .option('json', {
          describe: 'export result in JSON format in output directory'
        })
        .option('u', {
          alias: 'up',
          describe: 'Slice a path off the start of the paths',
          number: true,
          default: 0
        })
        .option('verbose', {
          describe: 'Show verbose output'
        });
    },
    reportGenerator
  )
  .help().argv;
