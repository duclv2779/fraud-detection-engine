import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_FRAUD_THRESHOLD, RULE_CONFIG } from './config/rules.config';
import { generateBaseClaims } from './data/claim.generator';
import { injectFraudPatterns } from './data/fraud.injector';
import { ClaimRepository } from './data/claim.repository';
import { GroundTruthRepository } from './data/ground-truth.repository';
import { buildRuleContextWithBaseline } from './engine/rule-context.builder';
import { createRules } from './engine/rule-factory';
import { FraudEngine } from './engine/fraud-engine';
import { ScoringService } from './engine/scoring.service';
import { calculateMetrics } from './evaluation/metrics.service';
import type { ScoredClaim } from './domain/scored-claim.types';
import { writeMetrics, writeRankedClaimsCsv, writeScoredClaims } from './reporting/report.writer';

export interface AppOptions { rootDir?: string; seed?: number; threshold?: number }

export class FraudDetectionApp {
  private readonly rootDir: string;
  private readonly dataDir: string;
  private readonly reportsDir: string;
  private readonly claimRepository = new ClaimRepository();
  private readonly groundTruthRepository = new GroundTruthRepository();
  private readonly threshold: number;

  constructor(options: AppOptions = {}) {
    this.rootDir = options.rootDir ?? process.cwd();
    this.dataDir = join(this.rootDir, 'data');
    this.reportsDir = join(this.rootDir, 'reports');
    this.threshold = options.threshold ?? DEFAULT_FRAUD_THRESHOLD;
    if (this.threshold < 0 || this.threshold > 100) throw new Error('Threshold must be between 0 and 100.');
  }

  async generate(seed = 20261027): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const baselineClaims = generateBaseClaims({ count: 2000, seed });
    const { claims, labels } = injectFraudPatterns(baselineClaims);
    await Promise.all([
      this.claimRepository.saveCsv(join(this.dataDir, 'claims.csv'), claims),
      this.claimRepository.saveJson(join(this.dataDir, 'claims.json'), claims),
      this.claimRepository.saveJson(join(this.dataDir, 'baseline_claims.json'), baselineClaims),
      this.groundTruthRepository.save(join(this.dataDir, 'ground_truth.json'), labels),
    ]);
    const fraudCount = labels.filter(label => label.is_fraud).length;
    console.log(`Generated ${claims.length} claims; ${fraudCount} unique claims labelled fraudulent (seed=${seed}).`);
    console.log(`Dataset: ${join(this.dataDir, 'claims.csv')}`);
    console.log(`Ground truth: ${join(this.dataDir, 'ground_truth.json')}`);
  }

  async score(): Promise<void> {
    await mkdir(this.reportsDir, { recursive: true });
    const claims = await this.claimRepository.loadCsv(join(this.dataDir, 'claims.csv'));
    const baseline = await this.claimRepository.loadJson(join(this.dataDir, 'baseline_claims.json'));
    const context = buildRuleContextWithBaseline(claims, baseline);
    const scoringService = new ScoringService(RULE_CONFIG);
    const engine = new FraudEngine(createRules(), scoringService);
    const scored = engine.scoreClaims(claims, context);
    await Promise.all([
      writeScoredClaims(join(this.reportsDir, 'scored_claims.json'), scored),
      writeRankedClaimsCsv(join(this.reportsDir, 'ranked_claims.csv'), scored),
    ]);
    console.log(`Scored and ranked ${scored.length} claims.`);
    console.log(`Scored output: ${join(this.reportsDir, 'scored_claims.json')}`);
  }

  async evaluate(): Promise<void> {
    const scored = JSON.parse(await (await import('node:fs/promises')).readFile(join(this.reportsDir, 'scored_claims.json'), 'utf8')) as ScoredClaim[];
    const labels = await this.groundTruthRepository.load(join(this.dataDir, 'ground_truth.json'));
    const metrics = calculateMetrics(scored, labels, this.threshold);
    await writeMetrics(join(this.reportsDir, 'metrics.json'), metrics);
    console.log(JSON.stringify(metrics, null, 2));
    console.log(`Metrics report: ${join(this.reportsDir, 'metrics.json')}`);
  }

  async pipeline(seed = 20261027): Promise<void> {
    const start = Date.now();
    await this.generate(seed);
    await this.score();
    await this.evaluate();
    console.log(`Pipeline completed in ${((Date.now() - start) / 1000).toFixed(2)} seconds.`);
  }
}
