import type { RuleName } from '../domain/fraud-rule.types';

export interface RuleConfig {
  enabled: boolean;
  severity: number;
}

export const RULE_CONFIG: Record<RuleName, RuleConfig> = {
  duplicate: { enabled: true, severity: 5 },
  rapid_resubmission: { enabled: true, severity: 3 },
  upcoding: { enabled: true, severity: 5 },
  unbundling: { enabled: true, severity: 4 },
  phantom_billing: { enabled: true, severity: 5 },
  weekend_anomaly: { enabled: true, severity: 3 },
  diagnosis_mismatch: { enabled: true, severity: 5 },
  amount_clustering: { enabled: true, severity: 2 },
};

export const DEFAULT_FRAUD_THRESHOLD = 6;
export const TARGET_RECALL = 0.7;
export const MAX_FALSE_POSITIVE_RATE = 0.2;
