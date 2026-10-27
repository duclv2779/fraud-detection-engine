import type { Claim } from '../domain/claim.types';
import type { ScoredClaim } from '../domain/scored-claim.types';
import type { FraudFlag, FraudRule, RuleContext } from '../domain/fraud-rule.types';
import { ScoringService } from './scoring.service';

export class FraudEngine {
  constructor(private readonly rules: readonly FraudRule[], private readonly scoringService: ScoringService) {}

  scoreClaim(claim: Claim, context: RuleContext): ScoredClaim {
    const flags: FraudFlag[] = this.rules.flatMap(rule => rule.evaluate(claim, context));
    return { claim_id: claim.claim_id, risk_score: this.scoringService.calculate(flags), flags };
  }

  scoreClaims(claims: readonly Claim[], context: RuleContext): ScoredClaim[] {
    return claims.map(claim => this.scoreClaim(claim, context))
      .sort((a, b) => b.risk_score - a.risk_score || a.claim_id.localeCompare(b.claim_id));
  }
}
