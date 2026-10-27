/** Synthetic diagnosis/procedure associations for a coding challenge only. */
export const VALID_DIAGNOSIS_PROCEDURES: Record<string, string[]> = {
  'D-ORTHO': ['P-1001', 'P-1002', 'P-1010', 'P-4001'],
  'D-CARD': ['P-2001', 'P-2002', 'P-2010'],
  'D-DENT': ['P-3001', 'P-3002', 'P-3010'],
  'D-DERM': ['P-4001', 'P-4002', 'P-4010'],
  'D-RESP': ['P-5001', 'P-5002', 'P-5010'],
  'D-GI': ['P-6001', 'P-6002', 'P-6010'],
  'D-NEURO': ['P-7001', 'P-7002', 'P-7010'],
  'D-OPHTH': ['P-8001', 'P-8002', 'P-8010'],
  'D-GYN': ['P-9001', 'P-9002', 'P-9010'],
  'D-ENT': ['P-1101', 'P-1102', 'P-1110'],
  'D-GEN': ['P-1201', 'P-1202', 'P-1210'],
  'D-ONC': ['P-1301', 'P-1302', 'P-1310'],
};

export const SURGICAL_PROCEDURE_CODES = new Set([
  'P-2001', 'P-2002', 'P-4001', 'P-4002', 'P-7001', 'P-8001', 'P-9001', 'P-1301',
]);
