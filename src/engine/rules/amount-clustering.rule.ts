import type { Claim } from '../../domain/claim.types';
import type { FraudFlag, FraudRule, RuleContext } from '../../domain/fraud-rule.types';

export class AmountClusteringRule implements FraudRule {
  readonly name = 'amount_clustering' as const;
  constructor(private readonly threshold = 50000, private readonly lowerRatio = 0.95, private readonly severity = 2) {}

  evaluate(claim: Claim, _context: RuleContext): FraudFlag[] {
    const lower = this.threshold * this.lowerRatio;
    if (claim.submitted_amount < lower || claim.submitted_amount >= this.threshold) return [];
    const ratio = (claim.submitted_amount / this.threshold) * 100;
    return [{ rule: this.name, severity: this.severity, evidence: `Amount ${claim.submitted_amount.toFixed(2)} is ${ratio.toFixed(2)}% of the ${this.threshold.toFixed(2)} auto-approval threshold (within ${((1 - this.lowerRatio) * 100).toFixed(0)}% below threshold).` }];
  }
}
