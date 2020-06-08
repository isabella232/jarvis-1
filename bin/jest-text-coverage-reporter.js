#!/usr/bin/env node
const reportGenerator = require('../lib/jest/jest-text-coverage-reporter').default;

require('yargs')
  .scriptName('jest-text-coverage-reporter')
  .command(
    '$0 [args]',
    'Generates text reports (in markdown) from given coverage',
    yargs => {
      yargs
        .option('i', {
          alias: 'input',
          demandOption: true,
          describe: 'Path to coverage report in JSON format'
        })
        .option('o', {
          alias: 'output',
          describe: 'Output path for the report',
          default: 'coverage/text-report.md'
        })
        .option('verbose', {
          describe: 'Show verbose output'
        });
    },
    reportGenerator
  )
  .help().argv;
