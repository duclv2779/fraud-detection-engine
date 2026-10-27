import type { FraudFlag } from './fraud-rule.types';

export interface ScoredClaim {
  claim_id: string;
  risk_score: number;
  flags: FraudFlag[];
}
