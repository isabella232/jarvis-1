import * as fs from 'fs';
import * as path from 'path';

import Ajv from 'ajv';
import betterAjvErrors from 'better-ajv-errors';
import mkdirp from 'mkdirp';
import chalk from 'chalk';

import coverageSchema from '../common/coverage-schema.json';
import type { CoverageData } from '../common/helpers';
import textReport from './textReport';

const ajv = new Ajv({ jsonPointers: true });

const validateCoverage = ajv.compile(coverageSchema);

export interface Options {
  input: string;
  output: string;
  up: number;
  cwd: string;
  verbose?: boolean;
}

export default async function jestTextCoverageReporter(options: Options): Promise<void> {
  try {
    console.log(chalk.white.bold('Generating Report...'));
    const inputContent = await fs.promises.readFile(path.resolve(process.cwd(), options.input), 'utf8');

    options.verbose && console.log('Read configs successfully');

    const coverage: CoverageData = JSON.parse(inputContent.toString());

    options.verbose && console.log('Validating coverage...');

    const validCoverage = await validateCoverage(coverage);

    if (!validCoverage) {
      console.log(betterAjvErrors(coverageSchema, coverage, validateCoverage.errors));

      process.exit(1);
    }

    options.verbose && console.log('Generating Text Report...');
    const outputData = textReport(coverage, options);

    const OUTPUT_PATH = path.resolve(process.cwd(), options.output);

    await mkdirp(path.dirname(OUTPUT_PATH));

    options.verbose && console.log('Writing report to disk...');
    await fs.promises.writeFile(OUTPUT_PATH, outputData, 'utf8');
  } catch (e) {
    if (options.verbose) {
      console.log(e);
    }

    console.log(chalk.red('Something went wrong! Try using --verbose flag to debug'));

    process.exit(1);
  }

  console.log(chalk.green('Done!'));
}
