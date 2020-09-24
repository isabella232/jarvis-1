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
import { CoverageData, getCoverageEmoji } from '../common/helpers';
import { getCoverageClass } from '../common/helpers';

const ajv = new Ajv({ jsonPointers: true });

const validateConfig = ajv.compile(configSchema);
const validateCoverage = ajv.compile(coverageSchema);

function getCoverageData(_pct: number): string {
  const pct = getCoverageClass(_pct);
  const emoji = getCoverageEmoji(pct);

  return `${_pct} ${emoji}`.trim();
}

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
Handlebars.registerHelper('maxPct', function (value: CoveragePercentage) {
  return Math.max(...Object.values(value));
});
Handlebars.registerHelper('coverageClassForMaxPct', function (value: CoveragePercentage) {
  const max = Math.max(...Object.values(value));

  return getCoverageClass(max);
});

const JSON_QUOTES_REGEX = /"([A-Za-z0-9]+)"\s*:/g;
const JSON_QUOTES_REPLACER = '$1:';

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
    const groupedData = groupData(coverage, {
      ...config,
      cwd: options.cwd,
      verbose: !!options.verbose
    });

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

    options.verbose && console.log('Generating Markdown...');
    let mdOutput = `
| Group | %Stmts | %Branch | %Funcs | %Lines |
| :--- | -----: | ------: | -----: | -----: |
`;

    mdOutput += Object.entries(groupedData)
      .map(
        ([group, row]) =>
          `| ${group} (${Object.entries(row.files).length} files) | ${getCoverageData(row.total.s)} | ${getCoverageData(
            row.total.b
          )} | ${getCoverageData(row.total.f)} | ${getCoverageData(row.total.l)} |`
      )
      .join('\n');
    await fs.promises.writeFile(path.join(OUT_DIR, 'grouped_summary.md'), mdOutput, 'utf8');

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
