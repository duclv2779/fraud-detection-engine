import type { Claim } from '../../domain/claim.types';
import type { FraudFlag, FraudRule, RuleContext } from '../../domain/fraud-rule.types';

export class UpcodingRule implements FraudRule {
  readonly name = 'upcoding' as const;
  constructor(private readonly severity = 5, private readonly standardDeviations = 2, private readonly minSamples = 5) {}

  evaluate(claim: Claim, context: RuleContext): FraudFlag[] {
    const flags: FraudFlag[] = [];
    for (const code of new Set(claim.procedure_codes)) {
      const stats = context.baselineProcedureStatistics.get(code) ?? context.procedureStatistics.get(code);
      if (!stats || stats.count < this.minSamples || stats.standardDeviation <= 0) continue;
      const zScore = (claim.submitted_amount - stats.mean) / stats.standardDeviation;
      if (zScore > this.standardDeviations) {
        flags.push({ rule: this.name, severity: this.severity, evidence: `Submitted amount ${claim.submitted_amount.toFixed(2)} for procedure ${code} is ${zScore.toFixed(2)} standard deviations above mean ${stats.mean.toFixed(2)} (SD ${stats.standardDeviation.toFixed(2)}, n=${stats.count}).` });
      }
    }
    return flags;
  }
}
