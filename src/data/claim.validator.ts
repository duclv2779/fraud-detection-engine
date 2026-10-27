import { z } from 'zod';
import type { Claim } from '../domain/claim.types';
import { isWeekend } from './claim.generator';

const ClaimSchema = z.object({
  claim_id: z.string().min(1),
  member_id: z.string().min(1),
  provider_id: z.string().min(1),
  provider_name: z.string().min(1),
  claim_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  claim_type: z.enum(['OUTPATIENT', 'INPATIENT', 'DENTAL']),
  diagnosis_code: z.string().min(1),
  procedure_codes: z.array(z.string().min(1)).min(1),
  submitted_amount: z.number().finite().nonnegative(),
  is_weekend: z.boolean(),
});

export function validateClaim(value: unknown): Claim {
  const claim = ClaimSchema.parse(value) as Claim;
  const date = new Date(`${claim.claim_date}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== claim.claim_date) {
    throw new Error(`Invalid claim_date: ${claim.claim_date}`);
  }
  const weekday = date.getUTCDay();
  const derivedWeekend = weekday === 0 || weekday === 6;
  claim.is_weekend = isWeekend(claim.claim_date);
  if (claim.is_weekend !== derivedWeekend) {
    throw new Error(`is_weekend does not match claim_date for ${claim.claim_id}`);
  }
  return claim;
}

export function validateClaims(values: unknown[]): Claim[] {
  const claims = values.map(validateClaim);
  const ids = new Set<string>();
  for (const claim of claims) {
    if (ids.has(claim.claim_id)) throw new Error(`Duplicate claim_id: ${claim.claim_id}`);
    ids.add(claim.claim_id);
  }
  return claims;
}
