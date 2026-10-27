/** Synthetic code mappings for this challenge, not real medical billing advice. */
export interface ProcedureBundle {
  bundledCode: string;
  componentCodes: string[];
}

export const PROCEDURE_BUNDLES: ProcedureBundle[] = [
  { bundledCode: 'B-100', componentCodes: ['P-1001', 'P-1002'] },
  { bundledCode: 'B-200', componentCodes: ['P-2001', 'P-2002', 'P-2003'] },
  { bundledCode: 'B-300', componentCodes: ['P-3001', 'P-3002'] },
  { bundledCode: 'B-400', componentCodes: ['P-4001', 'P-4002', 'P-4003'] },
  { bundledCode: 'B-500', componentCodes: ['P-5001', 'P-5002'] },
  { bundledCode: 'B-600', componentCodes: ['P-6001', 'P-6002', 'P-6003'] },
];
