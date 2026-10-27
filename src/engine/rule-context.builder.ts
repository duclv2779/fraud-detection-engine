import type { Claim } from '../domain/claim.types';
import type { RuleContext } from '../domain/fraud-rule.types';
import { buildProcedureStatistics } from './statistics';

export function memberDiagnosisKey(claim: Pick<Claim, 'member_id' | 'diagnosis_code'>): string {
  return `${claim.member_id}::${claim.diagnosis_code}`;
}
export function providerDateKey(claim: Pick<Claim, 'provider_id' | 'claim_date'>): string {
  return `${claim.provider_id}::${claim.claim_date}`;
}
export function duplicateKey(claim: Pick<Claim, 'member_id' | 'provider_id' | 'claim_date' | 'diagnosis_code'>): string {
  return JSON.stringify([claim.member_id, claim.provider_id, claim.claim_date, claim.diagnosis_code]);
}

export function buildRuleContext(claims: readonly Claim[]): RuleContext {
  const claimsByMemberDiagnosis = new Map<string, Claim[]>();
  const claimsByDuplicateKey = new Map<string, Claim[]>();
  const claimsByProviderDate = new Map<string, Claim[]>();
  for (const claim of claims) {
    const memberKey = memberDiagnosisKey(claim);
    const memberGroup = claimsByMemberDiagnosis.get(memberKey) ?? [];
    memberGroup.push(claim);
    claimsByMemberDiagnosis.set(memberKey, memberGroup);

    const duplicateGroupKey = duplicateKey(claim);
    const duplicateGroup = claimsByDuplicateKey.get(duplicateGroupKey) ?? [];
    duplicateGroup.push(claim);
    claimsByDuplicateKey.set(duplicateGroupKey, duplicateGroup);

    const providerKey = providerDateKey(claim);
    const providerGroup = claimsByProviderDate.get(providerKey) ?? [];
    providerGroup.push(claim);
    claimsByProviderDate.set(providerKey, providerGroup);
  }

  const procedureStatistics = buildProcedureStatistics(claims);
  // Baseline is a snapshot of all amounts before injection when the generator passes
  // a baseline context. The standalone builder uses the supplied data as its baseline.
  return {
    claims,
    claimsByMemberDiagnosis,
    claimsByDuplicateKey,
    claimsByProviderDate,
    procedureStatistics,
    providerWeekendRates: calculateProviderWeekendRates(claims),
    baselineProcedureStatistics: procedureStatistics,
  };
}

export function calculateProviderWeekendRates(claims: readonly Claim[]): Map<string, number> {
  const totals = new Map<string, number>();
  const weekends = new Map<string, number>();
  for (const claim of claims) {
    totals.set(claim.provider_id, (totals.get(claim.provider_id) ?? 0) + 1);
    if (claim.is_weekend) weekends.set(claim.provider_id, (weekends.get(claim.provider_id) ?? 0) + 1);
  }
  return new Map([...totals.entries()].map(([provider, total]) => [provider, (weekends.get(provider) ?? 0) / total] as const));
}

export function buildRuleContextWithBaseline(claims: readonly Claim[], baselineClaims: readonly Claim[]): RuleContext {
  const context = buildRuleContext(claims);
  context.baselineProcedureStatistics = buildProcedureStatistics(baselineClaims);
  return context;
}
