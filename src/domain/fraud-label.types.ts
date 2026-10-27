export type FraudPattern =
  | 'duplicate'
  | 'rapid_resubmission'
  | 'upcoding'
  | 'unbundling'
  | 'phantom_billing'
  | 'weekend_anomaly'
  | 'diagnosis_mismatch'
  | 'amount_clustering';

export interface FraudLabel {
  claim_id: string;
  is_fraud: boolean;
  patterns: FraudPattern[];
}
