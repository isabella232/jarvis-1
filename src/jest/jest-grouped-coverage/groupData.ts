import * as path from 'path';

import _ from 'lodash';
import multimatch from 'multimatch';

import type { CoverageSummary, Coverage, CoverageData } from '../common/helpers';

export interface Config {
  groups: Record<string, string[]>;
  ignore?: string[];
  deprecated?: string[];
}

export interface ExtendedConfig extends Config {
  cwd: string;
  verbose: boolean;
  up: number;
}

export type CoveragePercentage = Record<'l' | 'f' | 'b' | 's', number>;

export interface GroupedCoverageSummary {
  total: CoveragePercentage;
  files: Record<string, CoveragePercentage>;
}

export type GroupedCoverage = Record<string, GroupedCoverageSummary>;

function addCoverage(coverage1: Coverage, coverage2: Coverage): Coverage {
  return {
    total: coverage1.total + coverage2.total,
    covered: coverage1.covered + coverage2.covered,
    skipped: coverage1.skipped + coverage2.skipped,
    pct: 0
  };
}

function addCoverageSummaries(summary1: CoverageSummary, summary2: CoverageSummary): CoverageSummary {
  return {
    lines: addCoverage(summary1.lines, summary2.lines),
    functions: addCoverage(summary1.functions, summary2.functions),
    statements: addCoverage(summary1.statements, summary2.statements),
    branches: addCoverage(summary1.branches, summary2.branches)
  };
}

function getPercentage(data: Coverage): number {
  // returns percentage with only 2 digits after decimal
  return Math.round((data.covered * 100 * 100) / data.total) / 100;
}

function calculateCoveragePercentage(data: CoverageSummary): CoveragePercentage {
  return {
    l: getPercentage(data.lines),
    s: getPercentage(data.statements),
    f: getPercentage(data.functions),
    b: getPercentage(data.branches)
  };
}

function pickCoveragePecentage(data: CoverageSummary): CoveragePercentage {
  return {
    l: data.lines.pct,
    s: data.statements.pct,
    f: data.functions.pct,
    b: data.branches.pct
  };
}

function getGroupedCoverageSummary(
  files: string[],
  coverageData: Record<string, CoverageSummary>,
  config: ExtendedConfig
): GroupedCoverageSummary {
  const groupedSummary: GroupedCoverageSummary = { total: { l: 0, f: 0, s: 0, b: 0 }, files: {} };
  let totalCoverageSummary: CoverageSummary = {
    lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
    functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
    statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
    branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
  };

  // for all the matched files, extract the coverage info
  files.forEach(file => {
    // coverage report has absolute paths for files, hence we also generate one.
    const coverageSummary = coverageData[file];

    if (coverageSummary) {
      // keep adding the values of coverage summaries
      // in order to calculate the total coverage for group later
      totalCoverageSummary = addCoverageSummaries(totalCoverageSummary, coverageSummary);
      const key = file.split(path.sep).slice(config.up).join(path.sep);

      // capture the coverage for the file
      groupedSummary.files[key] = pickCoveragePecentage(coverageSummary);

      // remove the file from coverage, so that we can detect uncategorized files
      delete coverageData[file];
    }
  });

  // calculate the total coverage for group
  groupedSummary.total = calculateCoveragePercentage(totalCoverageSummary);

  return groupedSummary;
}

export default function groupData(coverageData: CoverageData, config: ExtendedConfig): GroupedCoverage {
  const { groups, ignore = [], deprecated = [], cwd, verbose } = config;

  delete coverageData.total; // remove total coverage

  // coverageData has absolute paths, convert them to relative
  const coverageDataWithRelativePaths: Omit<CoverageData, 'total'> = _.mapKeys(coverageData, (_value, file) =>
    path.relative(cwd, file)
  );

  // create new globs by adding negation to the globs, as they will be used to exclude files
  const deprecatedNegativeGlobs = deprecated.map(pattern => `!${pattern}`);

  // remove ignored files completely
  const filesToIgnore = multimatch(Object.keys(coverageDataWithRelativePaths), ignore);
  filesToIgnore.forEach(file => delete coverageDataWithRelativePaths[file]);

  // create a list of all files from the coverage data
  const allFilesWithRelativePath = Object.keys(coverageDataWithRelativePaths);

  // loop over the groups to create report
  const groupedCoverage: GroupedCoverage = _.mapValues(groups, (globs, group) => {
    if (verbose) console.log(`Generating report for group: ${group}`);

    // pick files matching the globs
    const files = multimatch(allFilesWithRelativePath, [...globs, ...deprecatedNegativeGlobs]);

    if (verbose) console.log(`Found ${files.length} files`);

    return getGroupedCoverageSummary(files, coverageDataWithRelativePaths, config);
  });

  if (Array.isArray(deprecated) && deprecated.length > 0) {
    if (verbose) console.log(`Generating report for deprecated files`);
    const files = multimatch(allFilesWithRelativePath, deprecated);

    if (verbose) console.log(`Found ${files.length} deprecated files`);
    groupedCoverage.deprecated = getGroupedCoverageSummary(files, coverageDataWithRelativePaths, config);
  }

  if (verbose) console.log(`Generating report for uncategorized files`);
  // collect all the uncategorized data
  const uncategorizedFiles = Object.keys(coverageDataWithRelativePaths);
  if (verbose) console.log(`Found ${uncategorizedFiles.length} uncategorized files`);
  groupedCoverage.uncategorized = getGroupedCoverageSummary(uncategorizedFiles, coverageDataWithRelativePaths, config);

  return groupedCoverage;
}
