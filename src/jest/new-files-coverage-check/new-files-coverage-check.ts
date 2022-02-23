/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import chalk from 'chalk';
import { $, fetch } from 'zx';
import * as fs from 'fs';
import * as path from 'path';
import multimatch from 'multimatch';

export interface Options {
  branch: string;
  threshold: number;
  input: string;
  verbose: boolean;
  e: string[];
  owner: string;
  reponame: string;
  pull_number: string;
  token: string;
}

const getNewFiles = async (
  owner: string,
  repoName: string,
  pull_number: string,
  globs: string[],
  token: string
): Promise<string[]> => {
  try {
    const headers = token ? { Authorization: `token ${token}` } : undefined;
    // eslint-disable-next-line
    // @ts-ignore
    const response: any[] = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/pulls/${pull_number}/files?per_page=100`,
      { headers }
    ).then(res => res.json());
    if (Array.isArray(response)) {
      const files = response
        .filter(file => file.status === 'added')
        .map(file => path.join(process.cwd(), file.filename));
      return multimatch(files, ['**', ...globs]);
    } else {
      throw response;
    }
  } catch (e) {
    console.log('Error fetching new files from Github', e);
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
  const { input, threshold, verbose, e: globs, owner, pull_number, reponame, token } = options;
  $.verbose = !!verbose;

  const newFilesAdded = await getNewFiles(owner, reponame, pull_number, globs, token);

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
