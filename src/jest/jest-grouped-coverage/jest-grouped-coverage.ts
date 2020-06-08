import * as fs from 'fs';
import * as path from 'path';

import Handlebars from 'handlebars';
import Ajv from 'ajv';
import betterAjvErrors from 'better-ajv-errors';
import mkdirp from 'mkdirp';
import chalk from 'chalk';
import _ from 'lodash';

import groupData, { Config } from './groupData';
import configSchema from './config-schema.json';
import coverageSchema from '../common/coverage-schema.json';
import type { CoverageData } from '../common/helpers';
import { getCoverageClass, getMaxPct, getCoverageClassForMaxPct } from '../common/helpers';

const ajv = new Ajv({ jsonPointers: true });

const validateConfig = ajv.compile(configSchema);
const validateCoverage = ajv.compile(coverageSchema);

export interface Options {
  config: string;
  input: string;
  output: string;
  cwd: string;
  json?: string | boolean;
  verbose?: boolean;
}

Handlebars.registerHelper('kebabCase', function (value: string) {
  return _.kebabCase(value);
});

Handlebars.registerHelper('objectLength', function (value: any) {
  return _.keys(value).length;
});

Handlebars.registerHelper('json', function (value: any) {
  return JSON.stringify(value, null, 2);
});

Handlebars.registerHelper('coverageClass', getCoverageClass);
Handlebars.registerHelper('maxPct', getMaxPct);
Handlebars.registerHelper('coverageClassForMaxPct', getCoverageClassForMaxPct);

export default async function jestGroupedCoverageGenerator(options: Options): Promise<void> {
  try {
    console.log(chalk.white.bold('Generating Report...'));
    const [templateContent, configContent, inputContent] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, 'template.hbs'), 'utf8'),
      fs.promises.readFile(path.resolve(process.cwd(), options.config), 'utf8'),
      fs.promises.readFile(path.resolve(process.cwd(), options.input), 'utf8')
    ]);

    options.verbose && console.log('Read configs successfully');

    const config: Config = JSON.parse(configContent.toString());
    const coverage: CoverageData = JSON.parse(inputContent.toString());

    options.verbose && console.log('Validating config...');

    const validConfig = await validateConfig(config);

    if (!validConfig) {
      console.log(betterAjvErrors(configSchema, config, validateConfig.errors));

      process.exit(1);
    }

    options.verbose && console.log('Validating coverage...');

    const validCoverage = await validateCoverage(coverage);

    if (!validCoverage) {
      console.log(betterAjvErrors(coverageSchema, coverage, validateCoverage.errors));

      process.exit(1);
    }

    options.verbose && console.log('Computing coverage...');
    const groupedData = await groupData(coverage, config);

    options.verbose && console.log('Generating HTML...');
    const template = Handlebars.compile(templateContent);
    const outputData = template({ coverage: groupedData });

    const OUT_DIR = path.resolve(process.cwd(), options.output);

    options.verbose && console.log('Removing old report...');
    await fs.promises.rmdir(OUT_DIR, { recursive: true });

    await mkdirp(OUT_DIR);

    options.verbose && console.log('Writing report to disk...');
    await fs.promises.writeFile(path.join(OUT_DIR, 'index.html'), outputData, 'utf8');
    await fs.promises.copyFile(
      path.resolve(__dirname, '../../assets/pure-min.css'),
      path.join(OUT_DIR, 'pure-min.css')
    );
    await fs.promises.copyFile(path.resolve(__dirname, './table.js'), path.join(OUT_DIR, 'table.js'));
    await fs.promises.copyFile(path.resolve(__dirname, './coverage.css'), path.join(OUT_DIR, 'coverage.css'));

    if (options.json) {
      const jsonFile = typeof options.json === 'string' ? options.json : 'summary.json';
      const jsonFilePath = path.resolve(OUT_DIR, jsonFile);
      await mkdirp(path.dirname(jsonFilePath));
      await fs.promises.writeFile(jsonFilePath, JSON.stringify(groupedData, null, 2), 'utf8');
    }
  } catch (e) {
    if (options.verbose) {
      console.log(e);
    }

    console.log(chalk.red('Something went wrong! Try using --verbose flag to debug'));

    process.exit(1);
  }

  console.log(chalk.green('Done!'));
}
