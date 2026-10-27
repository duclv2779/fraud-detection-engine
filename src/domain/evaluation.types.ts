export interface EvaluationMetrics {
  totalClaims: number;
  knownFraudClaims: number;
  predictedFraudClaims: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  falsePositiveRate: number;
  threshold: number;
  targetsMet: boolean;
}
