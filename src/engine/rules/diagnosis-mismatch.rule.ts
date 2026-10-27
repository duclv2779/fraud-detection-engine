import type { Claim } from '../../domain/claim.types';
import type { FraudFlag, FraudRule, RuleContext } from '../../domain/fraud-rule.types';

export class DiagnosisMismatchRule implements FraudRule {
  readonly name = 'diagnosis_mismatch' as const;
  constructor(private readonly validPairs: Readonly<Record<string, readonly string[]>>, private readonly severity = 5) {}

  evaluate(claim: Claim, _context: RuleContext): FraudFlag[] {
    const valid = this.validPairs[claim.diagnosis_code];
    if (!valid) return [{ rule: this.name, severity: this.severity, evidence: `Diagnosis ${claim.diagnosis_code} has no configured diagnosis-procedure mapping; procedure(s) ${claim.procedure_codes.join(', ')} require review.` }];
    const invalid = claim.procedure_codes.filter(code => !valid.includes(code));
    if (!invalid.length) return [];
    return [{ rule: this.name, severity: this.severity, evidence: `Diagnosis ${claim.diagnosis_code} is not mapped to procedure(s) ${invalid.join(', ')}. Configured valid procedures: ${valid.join(', ')}.` }];
  }
}
