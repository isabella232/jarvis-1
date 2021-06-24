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
        .check(argv => {
          if (!argv.ext.every(ext => ext.startsWith('.'))) {
            throw new Error('An --ext option must start with a "."');
          }
          return true;
        });
    },
    cleanCssTypes
  ).argv;
