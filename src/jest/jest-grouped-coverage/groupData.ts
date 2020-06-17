import * as path from 'path';

import globby from 'globby';

import type { CoverageSummary, Coverage, CoverageData } from '../common/helpers';

export interface Config {
  groups: Record<string, string[]>;
  ignore?: string[];
}

export interface ExtendedConfig extends Config {
  cwd: string;
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

export default async function groupData(coverageData: CoverageData, config: ExtendedConfig): Promise<GroupedCoverage> {
  const { groups, ignore, cwd } = config;

  delete coverageData.total; // remove total coverage

  const groupKeys = Object.keys(groups); // extract all categories
  const groupedCoverage: GroupedCoverage = {};

  // loops over groups to categorize the files
  for (const group of groupKeys) {
    // match globs defined in config
    const files = await globby(groups[group], { ignore }); // eslint-disable-line no-await-in-loop

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
      const filepath = path.join(cwd, file);

      if (filepath in coverageData) {
        const coverageSummary = coverageData[filepath];

        // keep adding the values of coverage summaries
        // in order to calculate the total coverage for group later
        totalCoverageSummary = addCoverageSummaries(totalCoverageSummary, coverageSummary);

        // capture the coverage for the file
        groupedSummary.files[file] = pickCoveragePecentage(coverageSummary);

        // remove the file from coverage, so that we can detect uncategorized files
        delete coverageData[filepath];
      }
    });

    // calculate the total coverage for group
    groupedSummary.total = calculateCoveragePercentage(totalCoverageSummary);

    // update the final coverage object
    groupedCoverage[group] = groupedSummary;
  }

  // create a category for uncategorized files
  groupedCoverage.uncategorized = {
    total: { l: 0, f: 0, s: 0, b: 0 },
    files: {}
  };

  let totalUncategorizedCoverageSummary: CoverageSummary = {
    lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
    functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
    statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
    branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
  };

  // collect all the uncategorized data
  for (const file of Object.keys(coverageData)) {
    const filepath = path.relative(cwd, file);
    const coverageSummary = coverageData[filepath];

    totalUncategorizedCoverageSummary = addCoverageSummaries(totalUncategorizedCoverageSummary, coverageSummary);

    groupedCoverage.uncategorized.files[file] = pickCoveragePecentage(coverageSummary);

    groupedCoverage.uncategorized.total = calculateCoveragePercentage(totalUncategorizedCoverageSummary);
  }

  return groupedCoverage;
}
