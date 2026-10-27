import type { Claim } from '../../domain/claim.types';
import type { FraudFlag, FraudRule, RuleContext } from '../../domain/fraud-rule.types';
import { memberDiagnosisKey } from '../rule-context.builder';

export class RapidResubmissionRule implements FraudRule {
  readonly name = 'rapid_resubmission' as const;
  constructor(private readonly severity = 3, private readonly windowDays = 7) {}

  evaluate(claim: Claim, context: RuleContext): FraudFlag[] {
    const group = context.claimsByMemberDiagnosis.get(memberDiagnosisKey(claim)) ?? [];
    const claimTime = Date.parse(`${claim.claim_date}T00:00:00Z`);
    const close = group.filter(other => {
      if (other.claim_id === claim.claim_id) return false;
      const otherTime = Date.parse(`${other.claim_date}T00:00:00Z`);
      const difference = claimTime - otherTime;
      return difference >= 0 && difference <= this.windowDays * 86400000;
    });
    if (!close.length) return [];
    const nearest = close.sort((a, b) => Math.abs(Date.parse(`${a.claim_date}T00:00:00Z`) - Date.parse(`${claim.claim_date}T00:00:00Z`))
      - Math.abs(Date.parse(`${b.claim_date}T00:00:00Z`) - Date.parse(`${claim.claim_date}T00:00:00Z`)))[0];
    const days = Math.abs(Date.parse(`${nearest.claim_date}T00:00:00Z`) - Date.parse(`${claim.claim_date}T00:00:00Z`)) / 86400000;
    return [{ rule: this.name, severity: this.severity, evidence: `Same member ${claim.member_id} and diagnosis ${claim.diagnosis_code} submitted again ${days} day(s) from claim ${nearest.claim_id}; configured window is ${this.windowDays} days.` }];
  }
}
