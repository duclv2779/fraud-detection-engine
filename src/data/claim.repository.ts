import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import type { Claim } from '../domain/claim.types';
import { validateClaims } from './claim.validator';

const COLUMNS = ['claim_id', 'member_id', 'provider_id', 'provider_name', 'claim_date', 'claim_type', 'diagnosis_code', 'procedure_codes', 'submitted_amount', 'is_weekend'];

export class ClaimRepository {
  async saveJson(path: string, claims: readonly Claim[]): Promise<void> {
    await writeFile(path, `${JSON.stringify(claims, null, 2)}\n`, 'utf8');
  }

  async loadJson(path: string): Promise<Claim[]> {
    const value: unknown = JSON.parse(await readFile(path, 'utf8'));
    if (!Array.isArray(value)) throw new Error(`Expected an array in ${path}`);
    return validateClaims(value);
  }

  async saveCsv(path: string, claims: readonly Claim[]): Promise<void> {
    const rows = claims.map(claim => ({ ...claim, procedure_codes: JSON.stringify(claim.procedure_codes) }));
    const csv = stringify(rows, { header: true, columns: COLUMNS });
    await writeFile(path, csv, 'utf8');
  }

  async loadCsv(path: string): Promise<Claim[]> {
    const csv = await readFile(path, 'utf8');
    const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
    const values = rows.map(row => ({
      ...row,
      procedure_codes: JSON.parse(row.procedure_codes) as string[],
      submitted_amount: Number(row.submitted_amount),
      is_weekend: row.is_weekend === 'true',
    }));
    return validateClaims(values);
  }
}
