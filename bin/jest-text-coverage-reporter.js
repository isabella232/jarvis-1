/*
 * Copyright 2020 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

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
        .option('u', {
          alias: 'up',
          describe: 'Slice a path off the start of the paths',
          number: true,
          default: 0
        })
        .option('cwd', {
          describe:
            'Convert absolute paths to relative paths (w.r.t to this path), within the reports. Default is `process.cwd()`',
          default: process.cwd()
        })
        .option('verbose', {
          describe: 'Show verbose output'
        });
    },
    reportGenerator
  )
  .help().argv;
