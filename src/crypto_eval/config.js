/**
 * Validate the proposal configuration shape only.
 * This does not verify data availability, trading logic, or experimental validity.
 */
export function validateConfig(config) {
  const errors = [];
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!object(config)) return ['Configuration must be a JSON object.'];
  if (config.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (config.proposalOnly !== true) errors.push('This scaffold only accepts proposalOnly: true.');
  if (config.symbol !== 'BTCUSD') errors.push('The proposed pilot symbol must be BTCUSD.');
  if (config.timeframe !== '1h') errors.push('The proposed pilot timeframe must be 1h.');
  if (config.dataset !== null) errors.push('Dataset integration is not implemented; dataset must be null.');
  const expected = ['dashboard_composite', 'moving_average_crossover', 'buy_and_hold'];
  if (!Array.isArray(config.strategies) || config.strategies.length !== expected.length ||
      !expected.every(strategy => config.strategies.includes(strategy))) {
    errors.push('strategies must contain the three proposed strategy identifiers exactly once.');
  }
  if (config.strategyDefinitionStatus !== 'pending-validation') {
    errors.push('Strategy definitions have not been verified; strategyDefinitionStatus must be pending-validation.');
  }
  if (!object(config.execution)) {
    errors.push('execution must be an object.');
  } else {
    const required = {
      signalUses: 'completed-candles-only',
      fillAt: 'next-bar-open',
      positionMode: 'long-only'
    };
    for (const [key, value] of Object.entries(required)) {
      if (config.execution[key] !== value) errors.push(`execution.${key} must be ${value}.`);
    }
    for (const key of ['feeBpsPerSide', 'slippageBpsPerSide']) {
      const value = config.execution[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000) {
        errors.push(`execution.${key} must be a finite number between 0 and 1000.`);
      }
    }
  }
  if (!object(config.comparison) || config.comparison.splitPolicy !== 'chronological' ||
      config.comparison.parametersLockedBeforeEvaluation !== true) {
    errors.push('comparison must specify chronological splits and parameters locked before evaluation.');
  }
  const allowed = new Set(['schemaVersion', 'proposalOnly', 'symbol', 'timeframe', 'dataset',
    'strategies', 'strategyDefinitionStatus', 'execution', 'comparison']);
  for (const key of Object.keys(config)) {
    if (!allowed.has(key)) errors.push(`Unknown top-level field: ${key}.`);
  }
  return errors;
}
