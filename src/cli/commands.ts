import { FraudDetectionApp } from '../app';

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'pipeline';
  const seedArg = process.argv.find(arg => arg.startsWith('--seed='));
  const thresholdArg = process.argv.find(arg => arg.startsWith('--threshold='));
  const seed = seedArg ? Number(seedArg.split('=')[1]) : 20261027;
  const threshold = thresholdArg ? Number(thresholdArg.split('=')[1]) : Number(process.env.FRAUD_THRESHOLD ?? 6);
  if (!Number.isFinite(seed)) throw new Error('Seed must be a finite number.');
  const app = new FraudDetectionApp({ threshold });
  switch (command) {
    case 'generate': await app.generate(seed); break;
    case 'score': await app.score(); break;
    case 'evaluate': await app.evaluate(); break;
    case 'pipeline': await app.pipeline(seed); break;
    default:
      throw new Error(`Unknown command "${command}". Use generate, score, evaluate, or pipeline.`);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
