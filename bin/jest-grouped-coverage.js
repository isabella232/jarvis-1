#!/usr/bin/env node
const reportGenerator = require('../lib/jest/jest-grouped-coverage').default;

require('yargs')
  .scriptName('jest-grouped-coverage')
  .command('$0 <cmd> [args]')
  .command(
    'generate',
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
        .option('json', {
          describe: 'export result in JSON format in output directory'
        })
        .option('verbose', {
          describe: 'Show verbose output'
        });
    },
    reportGenerator
  )
  .help().argv;
