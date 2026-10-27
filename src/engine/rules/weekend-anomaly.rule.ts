import { isWeekend } from '../../data/claim.generator';
import type { Claim } from '../../domain/claim.types';
import type { FraudFlag, FraudRule, RuleContext } from '../../domain/fraud-rule.types';

export class WeekendAnomalyRule implements FraudRule {
  readonly name = 'weekend_anomaly' as const;
  constructor(private readonly surgicalCodes: ReadonlySet<string>, private readonly severity = 3, private readonly maxHistoricalRate = 0.05) {}

  evaluate(claim: Claim, context: RuleContext): FraudFlag[] {
    claim.is_weekend = isWeekend(claim.claim_date);
    if (!claim.is_weekend) return [];
    const surgical = claim.procedure_codes.filter(code => this.surgicalCodes.has(code));
    if (!surgical.length) return [];
    const rate = context.providerWeekendRates.get(claim.provider_id);
    if (rate === undefined || rate >= this.maxHistoricalRate) return [];
    return [{ rule: this.name, severity: this.severity, evidence: `Surgical procedure(s) ${surgical.join(', ')} billed on weekend ${claim.claim_date}; provider ${claim.provider_id} has ${(rate * 100).toFixed(2)}% weekend claim volume, below ${(this.maxHistoricalRate * 100).toFixed(0)}% threshold.` }];
  }
}
