import type { Claim } from '../../domain/claim.types';
import type { FraudFlag, FraudRule, RuleContext } from '../../domain/fraud-rule.types';
import type { ProcedureBundle } from '../../config/bundles.config';

export class UnbundlingRule implements FraudRule {
  readonly name = 'unbundling' as const;
  constructor(private readonly bundles: readonly ProcedureBundle[], private readonly severity = 4) {}

  evaluate(claim: Claim, _context: RuleContext): FraudFlag[] {
    const codes = new Set(claim.procedure_codes);
    const matches = this.bundles.filter(bundle => bundle.componentCodes.every(code => codes.has(code)) && !codes.has(bundle.bundledCode));
    return matches.map(bundle => ({
      rule: this.name,
      severity: this.severity,
      evidence: `Claim includes component procedures [${bundle.componentCodes.join(', ')}] that map to bundle ${bundle.bundledCode}, but the bundled code is absent.`,
    }));
  }
}
