import type { Claim } from '../../domain/claim.types';
import type { FraudFlag, FraudRule, RuleContext } from '../../domain/fraud-rule.types';
import { duplicateKey } from '../rule-context.builder';

export class DuplicateClaimRule implements FraudRule {
  readonly name = 'duplicate' as const;
  constructor(private readonly severity = 5) {}

  evaluate(claim: Claim, context: RuleContext): FraudFlag[] {
    const group = context.claimsByDuplicateKey.get(duplicateKey(claim)) ?? [];
    if (group.length <= 1) return [];
    const first = [...group].sort((a, b) => a.claim_id.localeCompare(b.claim_id))[0];
    // Flag later IDs in a duplicated key group; this avoids marking the canonical record.
    if (claim.claim_id === first.claim_id) return [];
    return [{ rule: this.name, severity: this.severity, evidence: `Claim duplicates ${group.length - 1} other claim(s) for member ${claim.member_id}, provider ${claim.provider_id}, date ${claim.claim_date}, diagnosis ${claim.diagnosis_code}.` }];
  }
}
