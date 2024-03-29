/*
 * Copyright 2020 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as fs from 'fs';
import * as path from 'path';

import Handlebars from 'handlebars';
import Ajv from 'ajv';
import betterAjvErrors from 'better-ajv-errors';
import mkdirp from 'mkdirp';
import chalk from 'chalk';
import _ from 'lodash';

import groupData from './groupData';
import type { Config, CoveragePercentage } from './groupData';
import configSchema from './config-schema.json';
import coverageSchema from '../common/coverage-schema.json';
import type { CoverageData } from '../common/helpers';
import { getCoverageClass, getCoverageEmoji } from '../common/helpers';

const ajv = new Ajv({ jsonPointers: true });

const validateConfig = ajv.compile(configSchema);
const validateCoverage = ajv.compile(coverageSchema);

export interface Options {
  config: string;
  input: string;
  output: string;
  cwd: string;
  format: Array<'html' | 'md'>;
  json?: string | boolean;
  verbose?: boolean;
  up: number;
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

Handlebars.registerHelper('maxPct', function (value: CoveragePercentage) {
  return Math.max(...Object.values(value));
});

Handlebars.registerHelper('coverageClassForMaxPct', function (value: CoveragePercentage) {
  const max = Math.max(...Object.values(value));

  return getCoverageClass(max);
});

Handlebars.registerHelper('coverageEmoji', function (value: number) {
  return `${Math.floor(value)} ${getCoverageEmoji(getCoverageClass(value))}`;
});

const JSON_QUOTES_REGEX = /"([A-Za-z0-9]+)"\s*:/g;
const JSON_QUOTES_REPLACER = '$1:';

export default async function jestGroupedCoverageGenerator(options: Options): Promise<void> {
  try {
    console.log(chalk.white.bold('Generating Report...'));
    const [htmlTemplateContent, mdTemplateContent, configContent, inputContent] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, 'templates', 'html.hbs'), 'utf8'),
      fs.promises.readFile(path.join(__dirname, 'templates', 'md.hbs'), 'utf8'),
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
    const groupedData = groupData(_.cloneDeep(coverage), {
      ...config,
      cwd: options.cwd,
      verbose: !!options.verbose,
      up: options.up
    });

    // Prepare output folder
    const OUT_DIR = path.resolve(process.cwd(), options.output);

    await mkdirp(OUT_DIR);

    if (options.format.includes('html')) {
      const filesToRemove = ['index.html', 'pure-min.css', 'table.js', 'coverage.css'];
      options.verbose && console.log('Removing old report...');
      for (const file of filesToRemove) {
        // eslint-disable-next-line no-await-in-loop
        await fs.promises.unlink(path.resolve(OUT_DIR, file));
      }

      // HTML report
      options.verbose && console.log('Generating HTML...');
      const template = Handlebars.compile(htmlTemplateContent);
      const outputData = template({ coverage: groupedData });

      options.verbose && console.log('Writing report to disk...');
      await fs.promises.writeFile(path.join(OUT_DIR, 'index.html'), outputData, 'utf8');
      await fs.promises.copyFile(
        path.resolve(__dirname, '../../assets/pure-min.css'),
        path.join(OUT_DIR, 'pure-min.css')
      );

      let jsContent = await fs.promises.readFile(path.resolve(__dirname, './table.js'), 'utf-8');

      jsContent = jsContent.replace(
        "'__COVERAGE_DATA__'",
        JSON.stringify(groupedData).replace(JSON_QUOTES_REGEX, JSON_QUOTES_REPLACER) // removing quotes around keys to reduce the file size
      );

      const tableKeys = Object.keys(groupedData);
      jsContent = jsContent.replace(
        "'__COVERAGE_TABLE_MAP__'",
        JSON.stringify(
          _.zipObject(
            tableKeys.map(str => 'table-' + _.kebabCase(str)),
            tableKeys
          )
        ).replace(JSON_QUOTES_REGEX, JSON_QUOTES_REPLACER) // removing quotes around keys to reduce the file size
      );

      await fs.promises.writeFile(path.join(OUT_DIR, 'table.js'), jsContent, 'utf8');
      await fs.promises.copyFile(path.resolve(__dirname, './coverage.css'), path.join(OUT_DIR, 'coverage.css'));
    }

    if (options.format.includes('md')) {
      // Markdown report
      options.verbose && console.log('Generating Markdown...');
      const template = Handlebars.compile(mdTemplateContent);
      const mdOutput = template({
        coverage: groupedData,
        actualCoverage: _.mapKeys(
          _.mapValues(coverage.total, ({ pct }) => Math.floor(pct)),
          (_v, key) => key.toString().slice(0, 1)
        )
      });

      await fs.promises.writeFile(path.join(OUT_DIR, 'grouped_summary.md'), mdOutput, 'utf8');
    }

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
