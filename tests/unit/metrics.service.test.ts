import { calculateMetrics } from '../../src/evaluation/metrics.service';
import type { FraudLabel } from '../../src/domain/fraud-label.types';
import type { ScoredClaim } from '../../src/domain/scored-claim.types';

const scored: ScoredClaim[] = [
  { claim_id: 'A', risk_score: 80, flags: [] },
  { claim_id: 'B', risk_score: 20, flags: [] },
  { claim_id: 'C', risk_score: 70, flags: [] },
  { claim_id: 'D', risk_score: 10, flags: [] },
];
const labels: FraudLabel[] = [
  { claim_id: 'A', is_fraud: true, patterns: ['duplicate'] },
  { claim_id: 'B', is_fraud: true, patterns: ['upcoding'] },
  { claim_id: 'C', is_fraud: false, patterns: [] },
  { claim_id: 'D', is_fraud: false, patterns: [] },
];

describe('calculateMetrics', () => {
  it('calculates confusion matrix and metrics at claim level', () => {
    const result = calculateMetrics(scored, labels, 50);
    expect(result.truePositives).toBe(1);
    expect(result.falsePositives).toBe(1);
    expect(result.trueNegatives).toBe(1);
    expect(result.falseNegatives).toBe(1);
    expect(result.precision).toBe(0.5);
    expect(result.recall).toBe(0.5);
    expect(result.falsePositiveRate).toBe(0.5);
  });
  it('returns zero for metrics with zero denominators', () => {
    const result = calculateMetrics([{ claim_id: 'A', risk_score: 0, flags: [] }], [{ claim_id: 'A', is_fraud: false, patterns: [] }], 50);
    expect(result.precision).toBe(0);
    expect(result.recall).toBe(0);
    expect(result.falsePositiveRate).toBe(0);
  });
  it('rejects mismatched ground truth IDs', () => {
    expect(() => calculateMetrics(scored, labels.slice(1), 50)).toThrow(/same claim IDs/);
  });
  it('rejects invalid threshold', () => expect(() => calculateMetrics(scored, labels, 101)).toThrow());
});
