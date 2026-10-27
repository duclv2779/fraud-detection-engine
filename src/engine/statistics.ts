import type { Claim } from '../domain/claim.types';
import type { ProcedureStatistics } from '../domain/fraud-rule.types';

export function calculateStatistics(values: number[]): ProcedureStatistics {
  if (values.length === 0) return { mean: 0, standardDeviation: 0, count: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return { mean, standardDeviation: Math.sqrt(variance), count: values.length };
}

export function buildProcedureStatistics(claims: readonly Claim[]): Map<string, ProcedureStatistics> {
  const amounts = new Map<string, number[]>();
  for (const claim of claims) {
    for (const code of new Set(claim.procedure_codes)) {
      const values = amounts.get(code) ?? [];
      values.push(claim.submitted_amount);
      amounts.set(code, values);
    }
  }
  return new Map([...amounts.entries()].map(([code, values]) => [code, calculateStatistics(values)] as const));
}
