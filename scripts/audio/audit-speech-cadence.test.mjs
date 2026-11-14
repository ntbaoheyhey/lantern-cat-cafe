import test from 'node:test';
import assert from 'node:assert/strict';
import {speechSummary, speechGates} from './audit-speech-cadence.mjs';

const ids = ['voice.mochi.ult.charge', 'voice.mochi.ult.release', 'voice.mochi.skill.mochi-1'];
const manifest = {cues: Object.fromEntries(ids.map(id => [id, [{variantId: 'take', duration: 1}]]))};
const trace = times => ({hits: times.map((at, i) => ({id: ids[i % ids.length], at,
  result: 'played', layers: [{variantId: 'take', pitch: 1}]}))});
const all = summary => ({stage1: summary, battle: summary, boss: summary});

test('accepts an ungrouped seven-second source cadence with complete required lines', () => {
  const summary = speechSummary(trace([0, 7000, 14000, 21000]), manifest);
  assert.equal(summary.medianSeconds, 7);
  assert(speechGates(all(summary)).every(g => g.pass));
});

test('rejects dense raw source starts even when grouped ultimate phrases would be seven seconds apart', () => {
  const summary = speechSummary(trace([0, 2000, 7000, 9000, 14000, 16000]), manifest);
  assert.equal(summary.medianSeconds, 2);
  assert(speechGates(all(summary)).filter(g => g.id.endsWith('raw-cadence')).every(g => !g.pass));
});

test('rejects a required ultimate interrupted by a later source and accounts for pitch', () => {
  const input = trace([0, 700, 7700, 14700]);
  const summary = speechSummary(input, manifest);
  assert.equal(summary.interruptedUltimate, 1);
  assert(speechGates(all(summary)).some(g => !g.pass));
  input.hits[0].layers[0].pitch = 2;
  assert.equal(speechSummary(input, manifest).interruptedUltimate, 0);
});

test('does not treat suppressed requests or absent speech as a passing raw cadence', () => {
  const input = trace([0, 7000, 14000]);
  input.hits[1].result = 'cadence';
  assert.equal(speechSummary(input, manifest).medianSeconds, 14);
  assert(speechGates(all(speechSummary({hits: []}, manifest))).some(g => !g.pass));
});
