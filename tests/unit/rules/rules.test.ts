import type { Claim } from '../../../src/domain/claim.types';
import type { RuleContext } from '../../../src/domain/fraud-rule.types';
import { buildRuleContext } from '../../../src/engine/rule-context.builder';
import { DuplicateClaimRule } from '../../../src/engine/rules/duplicate.rule';
import { RapidResubmissionRule } from '../../../src/engine/rules/rapid-resubmission.rule';
import { UpcodingRule } from '../../../src/engine/rules/upcoding.rule';
import { UnbundlingRule } from '../../../src/engine/rules/unbundling.rule';
import { PhantomBillingRule } from '../../../src/engine/rules/phantom-billing.rule';
import { WeekendAnomalyRule } from '../../../src/engine/rules/weekend-anomaly.rule';
import { DiagnosisMismatchRule } from '../../../src/engine/rules/diagnosis-mismatch.rule';
import { AmountClusteringRule } from '../../../src/engine/rules/amount-clustering.rule';
import { PROCEDURE_BUNDLES } from '../../../src/config/bundles.config';
import { VALID_DIAGNOSIS_PROCEDURES } from '../../../src/config/diagnosis-procedure.config';

function claim(overrides: Partial<Claim> = {}): Claim {
  const date = overrides.claim_date ?? '2024-01-08';
  return {
    claim_id: 'CLM-00001', member_id: 'M-001', provider_id: 'PR-001', provider_name: 'Test Clinic',
    claim_date: date, claim_type: 'OUTPATIENT', diagnosis_code: 'D-ORTHO', procedure_codes: ['P-1001'],
    submitted_amount: 1000, is_weekend: [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay()), ...overrides,
  };
}
function context(claims: Claim[]): RuleContext { return buildRuleContext(claims); }

describe('DuplicateClaimRule', () => {
  it('flags a later duplicate claim', () => {
    const first = claim({ claim_id: 'CLM-00001' });
    const later = claim({ claim_id: 'CLM-00002' });
    expect(new DuplicateClaimRule().evaluate(later, context([first, later]))).toHaveLength(1);
  });
  it('does not flag the canonical first claim', () => {
    const first = claim({ claim_id: 'CLM-00001' });
    const later = claim({ claim_id: 'CLM-00002' });
    expect(new DuplicateClaimRule().evaluate(first, context([first, later]))).toHaveLength(0);
  });
  it('does not flag a different member', () => {
    const a = claim(); const b = claim({ claim_id: 'CLM-00002', member_id: 'M-002' });
    expect(new DuplicateClaimRule().evaluate(b, context([a, b]))).toHaveLength(0);
  });
});

describe('RapidResubmissionRule', () => {
  it('flags same member and diagnosis within seven days', () => {
    const old = claim({ claim_date: '2024-01-01' });
    const recent = claim({ claim_id: 'CLM-00002', claim_date: '2024-01-08' });
    expect(new RapidResubmissionRule().evaluate(recent, context([old, recent]))).toHaveLength(1);
  });
  it('does not flag a claim outside seven days', () => {
    const old = claim({ claim_date: '2024-01-01' });
    const recent = claim({ claim_id: 'CLM-00002', claim_date: '2024-01-09' });
    expect(new RapidResubmissionRule().evaluate(recent, context([old, recent]))).toHaveLength(0);
  });
  it('does not flag the earlier claim', () => {
    const old = claim({ claim_date: '2024-01-01' });
    const recent = claim({ claim_id: 'CLM-00002', claim_date: '2024-01-05' });
    expect(new RapidResubmissionRule().evaluate(old, context([old, recent]))).toHaveLength(0);
  });
});

describe('UpcodingRule', () => {
  it('flags amount above mean plus two standard deviations', () => {
    const baseline = Array.from({ length: 10 }, (_, i) => claim({ claim_id: `B-${i}`, submitted_amount: 1000 + i * 10 }));
    const target = claim({ claim_id: 'HIGH', submitted_amount: 5000 });
    expect(new UpcodingRule().evaluate(target, { ...context([...baseline, target]), baselineProcedureStatistics: context(baseline).procedureStatistics })).toHaveLength(1);
  });
  it('does not flag when baseline has too few samples', () => {
    const baseline = [claim({ submitted_amount: 1000 }), claim({ claim_id: 'B2', submitted_amount: 1100 })];
    const target = claim({ claim_id: 'HIGH', submitted_amount: 5000 });
    expect(new UpcodingRule().evaluate(target, { ...context([...baseline, target]), baselineProcedureStatistics: context(baseline).procedureStatistics })).toHaveLength(0);
  });
});

describe('UnbundlingRule', () => {
  it('flags all configured components without bundled code', () => {
    const target = claim({ procedure_codes: ['P-1001', 'P-1002'] });
    expect(new UnbundlingRule(PROCEDURE_BUNDLES).evaluate(target, context([target]))).toHaveLength(1);
  });
  it('does not flag an unrelated single procedure', () => {
    const target = claim({ procedure_codes: ['P-1010'] });
    expect(new UnbundlingRule(PROCEDURE_BUNDLES).evaluate(target, context([target]))).toHaveLength(0);
  });
});

describe('PhantomBillingRule', () => {
  it('flags a provider with more than 30 claims in a day', () => {
    const group = Array.from({ length: 31 }, (_, i) => claim({ claim_id: `C-${i}`, claim_date: '2024-01-08' }));
    expect(new PhantomBillingRule().evaluate(group[0], context(group))).toHaveLength(1);
  });
  it('does not flag exactly 30 claims', () => {
    const group = Array.from({ length: 30 }, (_, i) => claim({ claim_id: `C-${i}` }));
    expect(new PhantomBillingRule().evaluate(group[0], context(group))).toHaveLength(0);
  });
});

describe('WeekendAnomalyRule', () => {
  it('flags a surgical procedure on weekend for low-weekend provider', () => {
    const target = claim({ claim_date: '2024-01-06', is_weekend: true, procedure_codes: ['P-2001'] });
    const weekday = Array.from({ length: 30 }, (_, i) => claim({ claim_id: `W-${i}`, claim_date: '2024-01-08', is_weekend: false }));
    expect(new WeekendAnomalyRule(new Set(['P-2001'])).evaluate(target, context([target, ...weekday]))).toHaveLength(1);
  });
  it('does not flag a non-surgical procedure', () => {
    const target = claim({ claim_date: '2024-01-06', is_weekend: true, procedure_codes: ['P-1001'] });
    expect(new WeekendAnomalyRule(new Set(['P-2001'])).evaluate(target, context([target]))).toHaveLength(0);
  });
});

describe('DiagnosisMismatchRule', () => {
  it('flags procedure not associated with diagnosis', () => {
    const target = claim({ diagnosis_code: 'D-CARD', procedure_codes: ['P-1301'] });
    expect(new DiagnosisMismatchRule(VALID_DIAGNOSIS_PROCEDURES).evaluate(target, context([target]))).toHaveLength(1);
  });
  it('accepts a configured valid pair', () => {
    const target = claim({ diagnosis_code: 'D-ORTHO', procedure_codes: ['P-1001'] });
    expect(new DiagnosisMismatchRule(VALID_DIAGNOSIS_PROCEDURES).evaluate(target, context([target]))).toHaveLength(0);
  });
});

describe('AmountClusteringRule', () => {
  it('flags lower inclusive boundary 47500', () => {
    expect(new AmountClusteringRule().evaluate(claim({ submitted_amount: 47500 }), context([]))).toHaveLength(1);
  });
  it('flags amount just below 50000', () => {
    expect(new AmountClusteringRule().evaluate(claim({ submitted_amount: 49999 }), context([]))).toHaveLength(1);
  });
  it('does not flag 50000 or amounts below lower boundary', () => {
    const rule = new AmountClusteringRule();
    expect(rule.evaluate(claim({ submitted_amount: 50000 }), context([]))).toHaveLength(0);
    expect(rule.evaluate(claim({ submitted_amount: 47499 }), context([]))).toHaveLength(0);
  });
});
