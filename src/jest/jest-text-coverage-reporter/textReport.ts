import * as path from 'path';

import { CoverageData, CoverageSummary, Coverage, getCoverageEmoji } from '../common/helpers';
import { getCoverageClass, getCoverageClassForMaxPct } from '../common/helpers';

function getCoverageData(data: Coverage): string {
  const pct = getCoverageClass(data.pct);
  const emoji = getCoverageEmoji(pct);

  return `${data.pct} ${emoji}`.trim();
}

function makeFinalFilePath(file: string, options: Pick<Options, 'up' | 'cwd'>): string {
  return path.relative(options.cwd, file).split(path.sep).slice(options.up).join(path.sep);
}

export interface Options {
  up: number;
  cwd: string;
}

function getRow(fileName: string, data: CoverageSummary): string {
  const col0 = `${getCoverageEmoji(getCoverageClassForMaxPct(data))} ${fileName}`;
  const col1 = getCoverageData(data.statements);
  const col2 = getCoverageData(data.branches);
  const col3 = getCoverageData(data.functions);
  const col4 = getCoverageData(data.lines);

  return `| ${col0} | ${col1} |  ${col2} | ${col3} | ${col4} |\n`;
}

export default function textReport(data: CoverageData, options: Options): string {
  const { total, ...files } = data;
  const { cwd, up } = options;

  let output = `
| File | %Stmts | %Branch | %Funcs | %Lines |
| :--- | -----: | ------: | -----: | -----: |
`;

  output += getRow('All', total);

  output += Object.entries(files)
    .map(([file, row]) => getRow(makeFinalFilePath(file, { cwd, up }), row))
    .join('');

  return output;
}
