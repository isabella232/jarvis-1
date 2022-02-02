/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import chalk from 'chalk';
import { $ } from 'zx';
import * as fs from 'fs';
import * as path from 'path';
import multimatch from 'multimatch';

export interface Options {
  branch: string;
  threshold: number;
  input: string;
  verbose: boolean;
  e: string[];
}

const getNewFiles = async (baseBranch: string, globs: string[]): Promise<string[]> => {
  try {
    const files = await $`git diff ${baseBranch} --name-status | grep '^A' | cut -c 3-`;
    const splitted = `${files}`.split('\n').filter(Boolean);
    return multimatch(splitted, ['**', ...globs]);
  } catch (e) {
    console.log(chalk.green('No new files added in this PR'));
    process.exit(0);
  }
};

const checkCoverage = (
  files: string[],
  coverage: Record<string, any>,
  threshold: number,
  verbose: boolean
): string[] => {
  return files.filter(fileName => {
    console.log('----------------------------------');
    const fullFilePath = path.join(process.cwd(), fileName);
    console.log(chalk.white('evaluating - ', fullFilePath));
    const fileReport = coverage[fullFilePath];

    if (!fileReport) {
      console.log(chalk.red(`file ${fileName} not considered/covered for/in test cases`));
      return true;
    } else {
      verbose && console.table(fileReport);
      let coveragePassed = true;
      for (const prop in fileReport) {
        if (fileReport[prop].pct < threshold) {
          coveragePassed = false;
          verbose && console.log(chalk.red(`Coverage is below ${threshold} for`, fileName));
          return true;
        }
      }
      if (coveragePassed && verbose) {
        console.log(chalk.green('Coverage passed for', fileName));
      }
    }
  });
};

export default async function newFilesCoverageCheck(options: Options): Promise<void> {
  const { branch, input, threshold, verbose, e: globs } = options;
  $.verbose = !!verbose;

  const newFilesAdded = await getNewFiles(branch, globs);

  if (newFilesAdded.length > 0) {
    const inputContent = await fs.promises.readFile(path.resolve(process.cwd(), input), 'utf8');
    const coverage: Record<string, any> = JSON.parse(inputContent.toString());
    console.log(chalk.yellowBright('New files added in this PR \n'));
    newFilesAdded.forEach(file => console.log(chalk.cyan(file)));
    const failedFiles = checkCoverage(newFilesAdded, coverage, threshold, verbose);

    if (failedFiles.length > 0) {
      console.log(chalk.red('\nCoverage check failed'));
      process.exit(1);
    } else {
      console.log(chalk.green('\nCoverage passed'));
      process.exit(0);
    }
  } else {
    console.log(chalk.green('No new files are added in this PR'));
    process.exit(0);
  }
}
