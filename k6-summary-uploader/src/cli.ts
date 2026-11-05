import { readFile } from 'node:fs/promises';
import { loadConfig } from './config.js';
import { validateSummary } from './validate.js';
import { SummaryUploader } from './influx.js';

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file || process.argv.length !== 3) throw new Error('Usage: npm run upload -- <path-to-summary.json>');
  let raw: unknown;
  try { raw = JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { throw new Error(`Unable to read/parse ${file}: ${String(error)}`); }
  const summary = validateSummary(raw);
  const result = await new SummaryUploader(loadConfig()).upload(summary);
  console.log(`Upload OK | test=${summary.testName} | testId=${summary.testId} | endpoints=${summary.endpoints.length} | points=${result.points} | timestamp_ns=${result.timestamp}`);
}
main().catch((error: unknown) => {
  console.error(`Upload FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
