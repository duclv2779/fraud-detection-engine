import { mkdir, writeFile } from 'node:fs/promises';
import { stringify } from 'csv-stringify/sync';
import type { ScoredClaim } from '../domain/scored-claim.types';
import type { EvaluationMetrics } from '../domain/evaluation.types';

export async function writeScoredClaims(path: string, scored: readonly ScoredClaim[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(scored, null, 2)}\n`, 'utf8');
}

export async function writeRankedClaimsCsv(path: string, scored: readonly ScoredClaim[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const rows = scored.map(item => ({
    claim_id: item.claim_id,
    risk_score: item.risk_score,
    flags: item.flags.map(flag => `${flag.rule} (severity ${flag.severity}): ${flag.evidence}`).join(' | '),
  }));
  await writeFile(path, stringify(rows, { header: true, columns: ['claim_id', 'risk_score', 'flags'] }), 'utf8');
}

export async function writeMetrics(path: string, metrics: EvaluationMetrics): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
}

function dirname(path: string): string {
  const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return index <= 0 ? '.' : path.slice(0, index);
}
