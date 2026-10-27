import type { RuleConfig } from '../config/rules.config';
import type { FraudFlag, RuleName } from '../domain/fraud-rule.types';

export class ScoringService {
  constructor(private readonly config: Record<RuleName, RuleConfig>) {
    for (const [name, rule] of Object.entries(config)) {
      if (!Number.isInteger(rule.severity) || rule.severity < 1 || rule.severity > 5) {
        throw new Error(`Invalid severity for ${name}: expected integer from 1 to 5.`);
      }
    }
  }

  calculate(flags: readonly FraudFlag[]): number {
    const enabled = Object.entries(this.config).filter(([, config]) => config.enabled);
    const denominator = enabled.reduce((sum, [, config]) => sum + config.severity, 0);
    if (denominator === 0 || flags.length === 0) return 0;
    const uniqueTriggeredRules = new Set(flags.map(flag => flag.rule));
    const rawScore = enabled.reduce((sum, [name, config]) => {
      return sum + (uniqueTriggeredRules.has(name as RuleName) ? config.severity : 0);
    }, 0);
    return Math.max(0, Math.min(100, Math.round((rawScore / denominator) * 100)));
  }
}
