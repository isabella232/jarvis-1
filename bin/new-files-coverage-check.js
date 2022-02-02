/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

// #!/usr/bin/env node
const newFileCoverageCheck = require('../lib/jest/new-files-coverage-check/new-files-coverage-check').default;

require('yargs')
  .scriptName('new-file-coverage-check')
  .command(
    '$0 [args]',
    'New files coverage check',
    yargs => {
      yargs
        .option('b', {
          alias: 'branch',
          describe: 'Base branch',
          default: 'master'
        }).check(argv => {
          // eslint-disable-next-line 
          const invalid = /(^|[/.])([/.]|$)|^@$|@{|[\x00-\x20\x7f~^:?*[\\]|\.lock(\/|$)/;
          const isBranchNameInvalid = invalid.test(argv.b);
          if(isBranchNameInvalid) {
            console.log("Invalid branch name", argv.b);
          }
          return !isBranchNameInvalid;
        })
        .option('t', {
          alias: 'threshold',
          describe: 'Minimum coverage threshold',
          default: 80
        })
        .option('i', {
          alias: 'input',
          describe: 'Path to coverage report in JSON format',
          default: 'coverage/coverage-summary.json'
        })
        .option('e', {
          alias: 'exclude',
          describe: 'Globs to ignore for. Example: *.test.ts, *.test.tsx',
          array: true,
          default: ['!**/*.test.tsx', '!**/*.test.ts', '!**/*.snap']
        })
        .option('verbose', {
          describe: 'Show verbose output'
        });
    },
    newFileCoverageCheck
  )
  .help().argv;