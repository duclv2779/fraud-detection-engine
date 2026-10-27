import type { Claim } from '../domain/claim.types';
import type { FraudLabel, FraudPattern } from '../domain/fraud-label.types';
import { PROCEDURE_BUNDLES } from '../config/bundles.config';
import { VALID_DIAGNOSIS_PROCEDURES, SURGICAL_PROCEDURE_CODES } from '../config/diagnosis-procedure.config';
import { isWeekend } from './claim.generator';

export interface InjectionResult { claims: Claim[]; labels: FraudLabel[] }

function datePlusDays(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86400000).toISOString().slice(0, 10);
}
function nextWeekend(date: string): string {
  let cursor = date;
  for (let i = 0; i < 7; i++) {
    cursor = datePlusDays(cursor, 1);
    if (isWeekend(cursor)) return cursor;
  }
  return date;
}
function nextWeekday(date: string): string {
  let cursor = date;
  for (let i = 0; i < 7; i++) {
    cursor = datePlusDays(cursor, 1);
    if (!isWeekend(cursor)) return cursor;
  }
  return date;
}

export function injectFraudPatterns(baseClaims: readonly Claim[]): InjectionResult {
  if (baseClaims.length < 207) throw new Error('Fraud injection requires at least 207 base claims.');
  const claims = baseClaims.map(claim => ({ ...claim, procedure_codes: [...claim.procedure_codes] }));
  const labelsById = new Map<string, Set<FraudPattern>>();
  const mark = (claim: Claim, pattern: FraudPattern) => {
    const patterns = labelsById.get(claim.claim_id) ?? new Set<FraudPattern>();
    patterns.add(pattern);
    labelsById.set(claim.claim_id, patterns);
  };

  // 30 duplicates: duplicate business keys while preserving unique claim IDs.
  for (let i = 0; i < 30; i++) {
    const source = claims[300 + i];
    const target = claims[i];
    // Swap IDs so the injected duplicate is the later record by canonical ID ordering.
    const originalTargetId = target.claim_id;
    target.claim_id = source.claim_id;
    source.claim_id = originalTargetId;
    target.member_id = source.member_id;
    target.provider_id = source.provider_id;
    target.provider_name = source.provider_name;
    target.claim_date = source.claim_date;
    target.diagnosis_code = source.diagnosis_code;
    target.procedure_codes = [...source.procedure_codes];
    target.submitted_amount = source.submitted_amount;
    target.is_weekend = isWeekend(target.claim_date);
    mark(target, 'duplicate');
  }

  // 30 rapid resubmissions: same member and diagnosis within seven days.
  for (let i = 30; i < 60; i++) {
    const target = claims[i];
    const source = claims[400 + (i - 30)];
    if (source.claim_date > '2024-12-24') {
      source.claim_date = '2024-06-01';
      source.is_weekend = isWeekend(source.claim_date);
    }
    const originalTargetId = target.claim_id;
    target.claim_id = source.claim_id;
    source.claim_id = originalTargetId;
    target.member_id = source.member_id;
    target.diagnosis_code = source.diagnosis_code;
    target.claim_date = datePlusDays(source.claim_date, 1 + (i % 6));
    target.is_weekend = isWeekend(target.claim_date);
    mark(target, 'rapid_resubmission');
  }

  // 30 upcoding claims. Procedure statistics are calculated by the detector on the
  // resulting population; inject amounts well above the normal generated range.
  for (let i = 60; i < 90; i++) {
    const target = claims[i];
    target.procedure_codes = [claims[500 + (i - 60)].procedure_codes[0]];
    target.submitted_amount = 100000 + (i - 60) * 1000;
    mark(target, 'upcoding');
  }

  // 25 unbundling cases, using configured component mappings.
  for (let i = 90; i < 115; i++) {
    const bundle = PROCEDURE_BUNDLES[(i - 90) % PROCEDURE_BUNDLES.length];
    claims[i].procedure_codes = [...bundle.componentCodes];
    claims[i].submitted_amount = 1500 + (i - 90) * 100;
    mark(claims[i], 'unbundling');
  }

  // 25 flagged claims in a provider/date cluster of 32 claims (>30 threshold).
  const phantomProvider = 'PR-050';
  const phantomDate = '2024-06-12';
  for (let i = 115; i < 140; i++) {
    const claim = claims[i];
    claim.provider_id = phantomProvider;
    claim.provider_name = 'Summit Health';
    claim.claim_date = phantomDate;
    claim.is_weekend = false;
    mark(claim, 'phantom_billing');
  }
  for (let i = 200; i < 207; i++) {
    claims[i].provider_id = phantomProvider;
    claims[i].provider_name = 'Summit Health';
    claims[i].claim_date = phantomDate;
    claims[i].is_weekend = false;
  }

  // 20 weekend surgical anomalies. Spread across providers and move their other
  // generated claims to weekdays so historical weekend volume stays below 5%.
  for (let i = 140; i < 160; i++) {
    const target = claims[i];
    const providerId = `PR-${String(i - 139).padStart(3, '0')}`;
    target.provider_id = providerId;
    target.claim_date = datePlusDays('2024-06-01', (i - 140) * 7);
    target.is_weekend = true;
    target.procedure_codes = [[...SURGICAL_PROCEDURE_CODES][(i - 140) % SURGICAL_PROCEDURE_CODES.size]];
    target.diagnosis_code = 'D-GEN';
    for (const other of claims) {
      if (other.claim_id !== target.claim_id && other.provider_id === providerId && isWeekend(other.claim_date)) {
        other.claim_date = nextWeekday(other.claim_date);
        other.is_weekend = false;
      }
    }
    mark(target, 'weekend_anomaly');
  }

  // 20 diagnosis/procedure mismatches: known procedure paired with unrelated diagnosis.
  for (let i = 160; i < 180; i++) {
    claims[i].diagnosis_code = 'D-CARD';
    claims[i].procedure_codes = ['P-1301'];
    mark(claims[i], 'diagnosis_mismatch');
  }

  // 20 claims just below the auto-approval threshold.
  for (let i = 180; i < 200; i++) {
    claims[i].submitted_amount = 47500 + (i - 180) * 125;
    mark(claims[i], 'amount_clustering');
  }

  const labels: FraudLabel[] = claims.map(claim => {
    const patterns = [...(labelsById.get(claim.claim_id) ?? new Set<FraudPattern>())];
    return { claim_id: claim.claim_id, is_fraud: patterns.length > 0, patterns };
  });
  return { claims, labels };
}
