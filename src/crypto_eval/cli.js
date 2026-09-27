import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateConfig } from './config.js';

const help = `CISC 699 Crypto Signal Evaluation Starter

Usage:
  node src/crypto_eval/cli.js --help
  node src/crypto_eval/cli.js validate <configuration.json>

Implemented: proposal configuration structure validation.
Not implemented: data ingestion, indicators, backtesting, metrics, or dashboard integration.
This program does not request market data, connect to a broker, or place orders.
`;

const args = process.argv.slice(2);
if (args.length === 0 || (args.length === 1 && ['--help', '-h'].includes(args[0]))) {
  console.log(help);
} else if (args[0] === 'validate' && args.length === 2) {
  try {
    const file = resolve(args[1]);
    const config = JSON.parse(await readFile(file, 'utf8'));
    const errors = validateConfig(config);
    if (errors.length) {
      console.error('Configuration structure invalid:');
      for (const error of errors) console.error(`- ${error}`);
      process.exitCode = 1;
    } else {
      console.log('Configuration structure valid.');
      console.log('Evaluation readiness: pending dataset access and verified strategy definitions.');
      console.log('Proposal assumptions only; no historical evaluation was executed.');
    }
  } catch (error) {
    console.error(`Unable to validate configuration: ${error.message}`);
    process.exitCode = 1;
  }
} else {
  console.error('Unknown command or arguments. Use --help.');
  process.exitCode = 2;
}
