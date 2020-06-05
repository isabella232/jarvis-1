import * as path from 'path';

import globby from 'globby';

export interface Config {
  groups: Record<string, string[]>;
  ignore?: string[];
}

export interface Coverage {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface CoverageSummary {
  lines: Coverage;
  statements: Coverage;
  functions: Coverage;
  branches: Coverage;
}

export interface CoverageData extends Record<string, CoverageSummary> {
  all: CoverageSummary;
}

export interface GroupedCoverageSummary {
  total: CoverageSummary;
  files: Record<string, CoverageSummary>;
}

export type GroupedCoverage = Record<string, GroupedCoverageSummary>;

function getDefaultCoverage(): Coverage {
  return { total: 0, covered: 0, skipped: 0, pct: 0 };
}

function getDefaultCoverageSummary(): CoverageSummary {
  return {
    lines: getDefaultCoverage(),
    functions: getDefaultCoverage(),
    statements: getDefaultCoverage(),
    branches: getDefaultCoverage()
  };
}

function addCoverage(coverage1: Coverage, coverage2: Coverage): Coverage {
  return {
    total: coverage1.total + coverage2.total,
    covered: coverage1.covered + coverage2.covered,
    skipped: coverage1.skipped + coverage2.skipped,
    pct: 0
  };
}

function getPercentage(data: Coverage): number {
  // returns percentage with only 2 digits after decimal
  return Math.round((data.covered * 100 * 100) / data.total) / 100;
}

function getTotalCoverage(data: Record<string, CoverageSummary>): CoverageSummary {
  const total = Object.entries(data).reduce((acc, [_key, { lines, functions, statements, branches }]) => {
    return {
      lines: addCoverage(acc.lines, lines),
      functions: addCoverage(acc.functions, functions),
      statements: addCoverage(acc.statements, statements),
      branches: addCoverage(acc.branches, branches)
    };
  }, getDefaultCoverageSummary());

  total.lines.pct = getPercentage(total.lines);
  total.statements.pct = getPercentage(total.statements);
  total.functions.pct = getPercentage(total.functions);
  total.branches.pct = getPercentage(total.branches);

  return total;
}

export default async function groupData(config: Config, coverage: CoverageData): Promise<GroupedCoverage> {
  const { groups, ignore } = config;

  delete coverage.all; // remove total coverage

  const groupKeys = Object.keys(groups); // extract all categories
  const groupedCoverage: GroupedCoverage = {};

  // loops over groups to categorize the files
  for (const group of groupKeys) {
    // match globs defined in config
    const files = await globby(groups[group], { ignore }); // eslint-disable-line no-await-in-loop

    const temp: GroupedCoverageSummary = { total: getDefaultCoverageSummary(), files: {} };

    // for all the matched files, extract the coverage info
    files.forEach(file => {
      const filepath = path.join(process.cwd(), file);
      if (filepath in coverage) {
        temp.files[file] = coverage[filepath];

        // remove the file from coverage, so that we can detect uncategorized files
        delete coverage[filepath];
      }
    });

    temp.total = getTotalCoverage(temp.files);

    // update the coverage
    groupedCoverage[group] = temp;
  }

  // collect all the uncategorized data
  const uncategorizedSummary = Object.keys(coverage).reduce<Record<string, CoverageSummary>>((acc, key) => {
    const filepath = path.relative(process.cwd(), key);

    acc[filepath] = coverage[key];

    return acc;
  }, {});

  groupedCoverage.uncategorized = {
    total: getTotalCoverage(uncategorizedSummary),
    files: uncategorizedSummary
  };

  return groupedCoverage;
}
