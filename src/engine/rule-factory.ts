import { RULE_CONFIG } from '../config/rules.config';
import { PROCEDURE_BUNDLES } from '../config/bundles.config';
import { VALID_DIAGNOSIS_PROCEDURES, SURGICAL_PROCEDURE_CODES } from '../config/diagnosis-procedure.config';
import type { FraudRule } from '../domain/fraud-rule.types';
import { DuplicateClaimRule } from './rules/duplicate.rule';
import { RapidResubmissionRule } from './rules/rapid-resubmission.rule';
import { UpcodingRule } from './rules/upcoding.rule';
import { UnbundlingRule } from './rules/unbundling.rule';
import { PhantomBillingRule } from './rules/phantom-billing.rule';
import { WeekendAnomalyRule } from './rules/weekend-anomaly.rule';
import { DiagnosisMismatchRule } from './rules/diagnosis-mismatch.rule';
import { AmountClusteringRule } from './rules/amount-clustering.rule';

export function createRules(): FraudRule[] {
  const candidates: FraudRule[] = [
    new DuplicateClaimRule(RULE_CONFIG.duplicate.severity),
    new RapidResubmissionRule(RULE_CONFIG.rapid_resubmission.severity),
    new UpcodingRule(RULE_CONFIG.upcoding.severity),
    new UnbundlingRule(PROCEDURE_BUNDLES, RULE_CONFIG.unbundling.severity),
    new PhantomBillingRule(RULE_CONFIG.phantom_billing.severity),
    new WeekendAnomalyRule(SURGICAL_PROCEDURE_CODES, RULE_CONFIG.weekend_anomaly.severity),
    new DiagnosisMismatchRule(VALID_DIAGNOSIS_PROCEDURES, RULE_CONFIG.diagnosis_mismatch.severity),
    new AmountClusteringRule(50000, 0.95, RULE_CONFIG.amount_clustering.severity),
  ];
  return candidates.filter(rule => RULE_CONFIG[rule.name].enabled);
}
