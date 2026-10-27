import type { Claim } from './claim.types';
import type { FraudPattern } from './fraud-label.types';

export type RuleName = FraudPattern;

export interface FraudFlag {
  rule: RuleName;
  severity: number;
  evidence: string;
}

export interface ProcedureStatistics {
  mean: number;
  standardDeviation: number;
  count: number;
}

export interface RuleContext {
  claims: readonly Claim[];
  claimsByMemberDiagnosis: Map<string, Claim[]>;
  claimsByDuplicateKey: Map<string, Claim[]>;
  claimsByProviderDate: Map<string, Claim[]>;
  procedureStatistics: Map<string, ProcedureStatistics>;
  providerWeekendRates: Map<string, number>;
  baselineProcedureStatistics: Map<string, ProcedureStatistics>;
}

export interface FraudRule {
  readonly name: RuleName;
  evaluate(claim: Claim, context: RuleContext): FraudFlag[];
}
