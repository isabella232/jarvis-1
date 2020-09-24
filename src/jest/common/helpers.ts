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

export interface CoverageData {
  total: CoverageSummary;
  [key: string]: CoverageSummary;
}

export function getCoverageClassForMaxPct(value: CoverageSummary): string {
  const max = getMaxPct(value);

  return getCoverageClass(max);
}

export function getCoverageClass(value: number): string {
  if (value < 50) return 'low';

  if (value >= 50 && value < 80) return 'medium';

  if (value >= 80) return 'high';

  return '';
}

export function getMaxPct(value: CoverageSummary): number {
  return Math.max(value.lines.pct, value.functions.pct, value.statements.pct, value.branches.pct);
}

export function getCoverageEmoji(pct: string): string {
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
