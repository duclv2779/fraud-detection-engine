# AI Coding Guidelines

## Project goals
Build a deterministic, explainable, rule-based insurance claim fraud scoring engine. Process 2,000 claims and implement all eight rules in the challenge.

## Architecture
- Use TypeScript strict mode and modular architecture.
- Keep domain logic independent from CLI and file I/O.
- Implement each detector behind the `FraudRule` contract (Strategy Pattern).
- Keep weights and business mappings in `src/config/`.
- Keep base claim generation and fraud injection in separate modules.
- Keep ground truth separate from claims and never pass labels into detection context or rule implementations.
- Use context/indexes to avoid repeated full-dataset scans where practical.

## Correctness and integrity
- Never fabricate metrics or claim that thresholds are met without running evaluation.
- Never tune or alter ground truth based on detector output.
- Use a deterministic seed for data generation.
- Derive `is_weekend` from `claim_date`; do not generate it independently.
- Use ISO dates (`YYYY-MM-DD`) and normalize dates consistently.
- Evidence must contain concrete values and explain why a rule triggered.
- A rule may emit multiple evidence flags, but scoring counts each rule at most once per claim.
- Handle zero standard deviation, insufficient procedure samples, missing mappings, and empty evaluation inputs explicitly.
- Do not describe a suspicious pattern as proof of fraud.

## Scoring and metrics
- Severity weights must be configurable from 1 to 5.
- Normalize the weighted sum to 0–100 using the sum of enabled rule weights.
- Keep the fraud decision threshold separate from risk score calculation.
- Compute metrics at claim level, not flag level.
- Define precision/recall/FPR behavior for zero denominators and document it.

## Testing
- Use Jest, not Vitest.
- Add tests for positive and negative cases for all rules, plus boundary and edge cases.
- Do not weaken or delete tests to hide defects.
- Run `npm test` and `npm run typecheck` before claiming the project is complete.

## Scope
- No web server, database, ORM, or frontend unless explicitly requested.
- Keep the solution simple enough to understand and run in a 4–6 hour challenge.
