import type { CoverageData, CoverageSummary, Coverage } from '../common/helpers';
import { getCoverageClass, getCoverageClassForMaxPct } from '../common/helpers';

function getCoverageEmoji(pct: string): string {
  switch (pct) {
    case 'high':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'low':
      return '🔴';
    default:
      return '';
  }
}

function getCoverageData(data: Coverage): string {
  const pct = getCoverageClass(data.pct);
  const emoji = getCoverageEmoji(pct);

  return `${data.pct} ${emoji}`.trim();
}

function getRow(fileName: string, data: CoverageSummary): string {
  const col0 = `${getCoverageEmoji(getCoverageClassForMaxPct(data))} ${fileName}`;
  const col1 = getCoverageData(data.statements);
  const col2 = getCoverageData(data.branches);
  const col3 = getCoverageData(data.functions);
  const col4 = getCoverageData(data.lines);

  return `| ${col0} | ${col1} |  ${col2} | ${col3} | ${col4} |\n`;
}

export default function textReport(data: CoverageData): string {
  const { total, ...files } = data;

  let output = `
| File | %Stmts | %Branch | %Funcs | %Lines |
| :--- | -----: | ------: | -----: | -----: |
`;

  output += getRow('All', total);

  output += Object.entries(files)
    .map(row => getRow(...row))
    .join('');

  return output;
}
