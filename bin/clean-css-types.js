/*
 * Copyright 2020 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

#!/usr/bin/env node
const cleanCssTypes = require('../lib/misc/clean-css-types').default;

require('yargs')
  .scriptName('clean-css-types')
  .command(
    '$0 <path> [args]',
    'Find and remove declarations for style (css, scss, etc.) files',
    yargs => {
      yargs
        .positional('path', { description: 'Path to search the definitions' })
        .option('e', {
          alias: 'ext',
          description: 'The extensions to look for. Example: .css, .scss',
          array: true,
          default: ['.css']
        })
        .check((argv, opt) => {
          if (!argv.ext.every(ext => ext.startsWith('.'))) {
            throw new Error('An --ext option must start with a "."');
          }
          return true;
        });
    },
    cleanCssTypes
  ).argv;
