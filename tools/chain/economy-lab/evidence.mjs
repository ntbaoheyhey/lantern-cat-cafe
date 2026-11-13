import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {hashConfig, nativePolicy, canonical} from './search-core.mjs';

/** Historical insertion-order hashes remain verifiable. Never repair a missing
 * config by substituting the current policy or the winning candidate. */
export function verifiedConfig(row) {
  assert(row.config && typeof row.config === 'object', 'Missing measured config');
  const hash = hashConfig(row.config);
  const legacy = createHash('sha256').update(JSON.stringify(row.config)).digest('hex');
  assert(row.configHash === hash || row.configHash === legacy, 'Config record hash mismatch');
  assert(row.scenarioScores?.length === 18, 'Incomplete scenario evidence');
  assert(new Set(row.scenarioScores.map(s => s.id)).size === 18, 'Repeated scenarios');
  assert(row.seeds >= 40, 'Unconfirmed fast-search seeds');
  for (const scenario of row.scenarioScores) {
    assert(scenario.seeds === row.seeds, 'Scenario seed count differs');
    for (const level of ['median', 'p10', 'p90']) {
      for (const metric of ['burnClaims', 'starRatio', 'casualLegendaryDay', 'heavyLegendaryDay', 'botRegularHourlyRatio']) {
        assert(Number.isFinite(scenario.quantiles?.[level]?.[metric]), 'Missing measured quantile');
      }
    }
  }
  return {...row, configHash:hash, recordedHash:row.configHash};
}

export function comparablePolicy(a, b) {
  return JSON.stringify(canonical(nativePolicy(a))) === JSON.stringify(canonical(nativePolicy(b)));
}

export const worstDistances = row => Object.fromEntries(
  ['T-a', 'T-b', 'T-c', 'T-d', 'T-e', 'T-f', 'T-g'].map(key => [key,
    Math.max(...row.scenarioScores.map(s => s.distances[key] ?? Infinity)),
  ]),
);

/** Membership is reported honestly even when fewer than twenty candidates lie
 * on the nondominated front. The review table still shows the best twenty. */
export function frontier(rows) {
  const distances=rows.map(worstDistances);
  return rows.map((row,i)=>({...row, worstDistances:distances[i], dominated:distances.some((other,j)=>
    j!==i && Object.keys(other).every(k=>other[k]<=distances[i][k]) &&
    Object.keys(other).some(k=>other[k]<distances[i][k])),
  }));
}
