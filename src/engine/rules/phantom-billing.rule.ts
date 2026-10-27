import type { Claim } from '../../domain/claim.types';
import type { FraudFlag, FraudRule, RuleContext } from '../../domain/fraud-rule.types';
import { providerDateKey } from '../rule-context.builder';

export class PhantomBillingRule implements FraudRule {
  readonly name = 'phantom_billing' as const;
  constructor(private readonly severity = 5, private readonly threshold = 30) {}

  evaluate(claim: Claim, context: RuleContext): FraudFlag[] {
    const count = (context.claimsByProviderDate.get(providerDateKey(claim)) ?? []).length;
    if (count <= this.threshold) return [];
    return [{ rule: this.name, severity: this.severity, evidence: `Provider ${claim.provider_id} submitted ${count} claims on ${claim.claim_date}, exceeding the configured daily threshold of ${this.threshold}. This is an anomaly indicator, not proof of fraud.` }];
  }
}
