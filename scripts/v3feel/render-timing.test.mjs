import test from 'node:test';
import assert from 'node:assert/strict';
import {renderedTiming} from './render-timing.mjs';

const plan = {key: 1, actorId: 'cat', skillId: 'basic', tier: 'basic',
  clockStart: 1, duration: 800, impact: 350, beats: [{duration: 250}]};
const frame = (t, elapsed, key = 1) => ({t, action: {key, elapsed}});

test('a correct plan cannot hide late rendered contact or recovery', () => {
  const result = renderedTiming(plan, [frame(1.02, 20), frame(1.25, 250),
    frame(1.50, 350), frame(1.90, 790), frame(1.94, 0, 2)]);
  assert.equal(result.plannedImpactMs, 350);
  assert.equal(result.observedImpactMs, 500);
  assert.ok(Math.abs(result.observedDurationMs - 940) < 1e-8);
  assert.equal(result.observedAnticipationEndMs, 250);
});

test('a truncated action never gets an invented end or contact', () => {
  const result = renderedTiming(plan, [frame(1.02, 20), frame(1.25, 250)]);
  assert.equal(result.observedDurationMs, null);
  assert.equal(result.observedImpactMs, null);
  assert.equal(result.boundaryTruncated, true);
});

test('presentation ordinals distinguish a round tick reusing the rules action ID', () => {
  const frames = [frame(1.02, 20), frame(1.35, 350), frame(1.79, 790), frame(1.8, 0, 2)]
    .map(f => ({...f, action: {...f.action, id: 77}}));
  const result = renderedTiming(plan, frames);
  assert.ok(Math.abs(result.observedDurationMs - 800) < 1e-8);
  assert.ok(Math.abs(result.observedImpactMs - 350) < 1e-8);
  assert.equal(result.boundaryTruncated, false);
  assert.equal(renderedTiming({...plan, key: 7}, frames), null);
});
