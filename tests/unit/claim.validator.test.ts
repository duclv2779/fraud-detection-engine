import { validateClaim, validateClaims } from '../../src/data/claim.validator';

const valid = {
  claim_id: 'C1', member_id: 'M1', provider_id: 'P1', provider_name: 'Clinic', claim_date: '2024-01-08',
  claim_type: 'OUTPATIENT', diagnosis_code: 'D-ORTHO', procedure_codes: ['P-1001'], submitted_amount: 100, is_weekend: false,
};

describe('claim validation', () => {
  it('accepts a valid claim', () => expect(validateClaim(valid).claim_id).toBe('C1'));
  it('rejects inconsistent weekend flag', () => expect(() => validateClaim({ ...valid, claim_date: '2024-01-06' })).toThrow(/is_weekend/));
  it('rejects duplicate claim IDs in a dataset', () => expect(() => validateClaims([valid, valid])).toThrow(/Duplicate claim_id/));
});
