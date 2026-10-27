import { ScoringService } from '../../src/engine/scoring.service';
import type { RuleName, FraudFlag } from '../../src/domain/fraud-rule.types';
import type { RuleConfig } from '../../src/config/rules.config';

const config = Object.fromEntries((['duplicate', 'rapid_resubmission', 'upcoding', 'unbundling', 'phantom_billing', 'weekend_anomaly', 'diagnosis_mismatch', 'amount_clustering'] as RuleName[]).map(rule => [rule, { enabled: true, severity: rule === 'duplicate' ? 5 : 1 }])) as Record<RuleName, RuleConfig>;
const flag = (rule: RuleName): FraudFlag => ({ rule, severity: config[rule].severity, evidence: 'test evidence' });

describe('ScoringService', () => {
  it('returns zero when there are no flags', () => expect(new ScoringService(config).calculate([])).toBe(0));
  it('normalizes one highest-weight rule against enabled total weights', () => expect(new ScoringService(config).calculate([flag('duplicate')])).toBe(42));
  it('counts a rule only once even when it emits multiple flags', () => expect(new ScoringService(config).calculate([flag('duplicate'), flag('duplicate')])).toBe(42));
  it('returns 100 when every enabled rule triggers', () => expect(new ScoringService(config).calculate(Object.keys(config).map(key => flag(key as RuleName)))).toBe(100));
  it('rejects invalid severity configuration', () => {
    expect(() => new ScoringService({ ...config, duplicate: { enabled: true, severity: 8 } })).toThrow();
  });
});
