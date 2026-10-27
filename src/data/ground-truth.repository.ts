import { readFile, writeFile } from 'node:fs/promises';
import type { FraudLabel } from '../domain/fraud-label.types';

export class GroundTruthRepository {
  async save(path: string, labels: readonly FraudLabel[]): Promise<void> {
    await writeFile(path, `${JSON.stringify(labels, null, 2)}\n`, 'utf8');
  }

  async load(path: string): Promise<FraudLabel[]> {
    const value: unknown = JSON.parse(await readFile(path, 'utf8'));
    if (!Array.isArray(value)) throw new Error(`Expected an array in ${path}`);
    return value as FraudLabel[];
  }
}
