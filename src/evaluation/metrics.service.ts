import type { FraudLabel } from '../domain/fraud-label.types';
import type { ScoredClaim } from '../domain/scored-claim.types';
import type { EvaluationMetrics } from '../domain/evaluation.types';
import { MAX_FALSE_POSITIVE_RATE, TARGET_RECALL } from '../config/rules.config';

export function calculateMetrics(
  scoredClaims: readonly ScoredClaim[],
  labels: readonly FraudLabel[],
  threshold: number,
): EvaluationMetrics {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) throw new Error('Threshold must be between 0 and 100.');
  const labelById = new Map(labels.map(label => [label.claim_id, label]));
  const scoreIds = new Set(scoredClaims.map(claim => claim.claim_id));
  if (scoreIds.size !== scoredClaims.length) throw new Error('Scored claims contain duplicate claim_id values.');
  if (labelById.size !== labels.length) throw new Error('Ground truth contains duplicate claim_id values.');
  if (scoreIds.size !== labelById.size || [...scoreIds].some(id => !labelById.has(id))) {
    throw new Error('Scored claims and ground truth must contain exactly the same claim IDs.');
  }

  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;
  let knownFraudClaims = 0;
  let predictedFraudClaims = 0;
  for (const scored of scoredClaims) {
    const isFraud = labelById.get(scored.claim_id)!.is_fraud;
    const predicted = scored.risk_score >= threshold;
    if (isFraud) knownFraudClaims++;
    if (predicted) predictedFraudClaims++;
    if (isFraud && predicted) truePositives++;
    else if (!isFraud && predicted) falsePositives++;
    else if (!isFraud && !predicted) trueNegatives++;
    else falseNegatives++;
  }
  const precision = truePositives + falsePositives === 0 ? 0 : truePositives / (truePositives + falsePositives);
  const recall = truePositives + falseNegatives === 0 ? 0 : truePositives / (truePositives + falseNegatives);
  const falsePositiveRate = falsePositives + trueNegatives === 0 ? 0 : falsePositives / (falsePositives + trueNegatives);
  return {
    totalClaims: scoredClaims.length,
    knownFraudClaims,
    predictedFraudClaims,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    precision: round4(precision),
    recall: round4(recall),
    falsePositiveRate: round4(falsePositiveRate),
    threshold,
    targetsMet: recall >= TARGET_RECALL && falsePositiveRate <= MAX_FALSE_POSITIVE_RATE,
  };
}

function round4(value: number): number { return Math.round(value * 10000) / 10000; }
