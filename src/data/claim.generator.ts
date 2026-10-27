import type { Claim, ClaimType } from '../domain/claim.types';
import { VALID_DIAGNOSIS_PROCEDURES } from '../config/diagnosis-procedure.config';

const PROVIDER_NAMES = ['Northstar Medical', 'Harbor Clinic', 'Cedar Hospital', 'Summit Health', 'Lakeside Care'];
const DIAGNOSES = ['D-ORTHO', 'D-CARD', 'D-DENT', 'D-DERM', 'D-RESP', 'D-GI', 'D-NEURO', 'D-OPHTH', 'D-GYN', 'D-ENT', 'D-GEN', 'D-ONC'];
const PROCEDURES = [...new Set(Object.values(VALID_DIAGNOSIS_PROCEDURES).flat())];
const DIAGNOSES_BY_PROCEDURE = new Map<string, string[]>(PROCEDURES.map(code => [code, Object.entries(VALID_DIAGNOSIS_PROCEDURES).filter(([, codes]) => codes.includes(code)).map(([diagnosis]) => diagnosis)]));

export interface GeneratorOptions { count?: number; seed?: number }

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function isWeekend(dateString: string): boolean {
  const date = new Date(`${dateString}T00:00:00Z`);
  const day = date.getUTCDay();

  return day === 0 || day === 6;
}

export function generateBaseClaims(options: GeneratorOptions = {}): Claim[] {
  const count = options.count ?? 2000;
  const random = seededRandom(options.seed ?? 20261027);
  const randomInt = (max: number) => Math.floor(random() * max);
  const start = Date.UTC(2024, 0, 1);
  const end = Date.UTC(2024, 11, 31);
  const claims: Claim[] = [];
  for (let i = 0; i < count; i++) {
    const claimDate = new Date(start + randomInt(end - start + 1)).toISOString().slice(0, 10);
    const procedure = PROCEDURES[randomInt(PROCEDURES.length)];
    const claimType: ClaimType[] = ['OUTPATIENT', 'INPATIENT', 'DENTAL'];
    claims.push({
      claim_id: `CLM-${String(i + 1).padStart(5, '0')}`,
      member_id: `M-${String(randomInt(500) + 1).padStart(3, '0')}`,
      provider_id: `PR-${String(randomInt(50) + 1).padStart(3, '0')}`,
      provider_name: PROVIDER_NAMES[randomInt(PROVIDER_NAMES.length)],
      claim_date: claimDate,
      claim_type: claimType[randomInt(claimType.length)],
      diagnosis_code: (DIAGNOSES_BY_PROCEDURE.get(procedure) ?? DIAGNOSES)[randomInt((DIAGNOSES_BY_PROCEDURE.get(procedure) ?? DIAGNOSES).length)],
      procedure_codes: [procedure],
      submitted_amount: Math.round((500 + random() * 12000) * 100) / 100,
      is_weekend: isWeekend(claimDate),
    });
  }
  return claims;
}

export const GENERATOR_DIAGNOSES = DIAGNOSES;
export const GENERATOR_PROCEDURES = PROCEDURES;
