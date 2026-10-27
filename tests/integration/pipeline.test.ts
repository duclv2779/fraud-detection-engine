import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FraudDetectionApp } from '../../src/app';

describe('pipeline integration', () => {
  it('generates, scores, and evaluates a deterministic dataset', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'fraud-engine-'));
    try {
      const app = new FraudDetectionApp({ rootDir, threshold: 6 });
      await app.pipeline(1234);
      const claims = JSON.parse(await readFile(join(rootDir, 'data', 'claims.json'), 'utf8')) as unknown[];
      const labels = JSON.parse(await readFile(join(rootDir, 'data', 'ground_truth.json'), 'utf8')) as Array<{ is_fraud: boolean }>;
      const scored = JSON.parse(await readFile(join(rootDir, 'reports', 'scored_claims.json'), 'utf8')) as Array<{ risk_score: number; flags: unknown[] }>;
      const metrics = JSON.parse(await readFile(join(rootDir, 'reports', 'metrics.json'), 'utf8')) as { totalClaims: number };
      expect(claims).toHaveLength(2000);
      expect(labels.filter(label => label.is_fraud)).toHaveLength(200);
      expect(scored).toHaveLength(2000);
      expect(scored.every(item => item.risk_score >= 0 && item.risk_score <= 100)).toBe(true);
      expect(metrics.totalClaims).toBe(2000);
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  }, 30000);
});
