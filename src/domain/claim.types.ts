export type ClaimType = 'OUTPATIENT' | 'INPATIENT' | 'DENTAL';

export interface Claim {
  claim_id: string;
  member_id: string;
  provider_id: string;
  provider_name: string;
  claim_date: string; // YYYY-MM-DD
  claim_type: ClaimType;
  diagnosis_code: string;
  procedure_codes: string[];
  submitted_amount: number;
  is_weekend: boolean;
}
