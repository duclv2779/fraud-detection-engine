# Fraud Detection Scoring Engine

A deterministic, rule-based insurance claim fraud scoring engine built with Node.js, TypeScript, and Jest. The dataset and diagnosis/procedure mappings are synthetic and intended only for this coding challenge.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
npm run typecheck
npm test
```

## Run the pipeline

```bash
npm run pipeline
```

The pipeline generates 2,000 claims, injects known fraud patterns, scores and ranks the claims, then reports metrics. You can use a different deterministic seed or decision threshold:

```bash
npm run pipeline -- --seed=12345 --threshold=6
```

Individual steps are available:

```bash
npm run generate -- --seed=12345
npm run score
npm run evaluate -- --threshold=6
```

`--threshold` controls classification for evaluation only. It does not change the underlying risk score. The current default threshold is 6 and should be treated as a starting point to evaluate, not a guarantee that metric targets are met.

## Outputs

Generated files are written to:

- `data/claims.csv` — dataset matching the challenge schema
- `data/claims.json` — same claims in JSON format
- `data/baseline_claims.json` — pre-injection baseline used for procedure statistics
- `data/ground_truth.json` — labels and fraud patterns, kept separate from detector inputs
- `reports/scored_claims.json` — ranked claim scores and itemized evidence
- `reports/ranked_claims.csv` — flattened ranked results
- `reports/metrics.json` — confusion matrix, precision, recall, FPR, and target status

Generated data and reports are git-ignored by default. If the submission requires committed artifacts, remove the relevant ignore entries or force-add the generated files before pushing.

## Implemented rules

1. Duplicate claim: same member, provider, date, and diagnosis.
2. Rapid re-submission: same member and diagnosis within seven days, considering a later claim relative to an earlier claim.
3. Upcoding: amount more than two standard deviations above the pre-injection baseline mean for a procedure, requiring at least five baseline samples.
4. Unbundling: component procedure set exists without its configured bundled code.
5. Phantom billing: provider has more than 30 claims on a date.
6. Weekend anomaly: a configured surgical procedure occurs on a weekend for a provider with under 5% weekend claim volume.
7. Diagnosis-procedure mismatch: procedure is not present in the configured synthetic mapping for the diagnosis.
8. Amount clustering: amount is in the inclusive lower range of 47,500 to below 50,000.

## Scoring

Each enabled rule contributes its configured severity once per claim, even if the rule emits multiple evidence entries. The sum is normalized by the sum of enabled rule weights to produce a score from 0 to 100. A score is not a probability of fraud. The decision threshold used by evaluation is configured independently.

## Metrics

- Precision = TP / (TP + FP)
- Recall = TP / (TP + FN)
- FPR = FP / (FP + TN)

A zero denominator returns `0` for that metric. `targetsMet` is true only when recall is at least 0.70 and FPR is at most 0.20. Metrics are computed at claim level, not flag level.

## Tests

```bash
npm test
npm run test:coverage
npm run typecheck
```

The synthetic mappings are illustrative and are not clinical or real-world billing guidance.
