import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaTiming} from './media-timing.mjs';
const plan = {key: 1, actorId: 'cat', skillId: 'basic', tier: 'basic', impact: 350,
  duration: 800, beats: [{duration: 250}]};
const renders = [0,250,350,799].map(elapsed => ({action:{key:1,elapsed}})).concat({action:null});
test('repeated compositor frames expose a stall despite a correct plan and render schedule', () => {
  const pictures = [[1,0],[1.25,1],[1.35,1],[1.5,2],[1.9,3],[1.95,4]].map(([t,renderFrame])=>({t,renderFrame}));
  const result=mediaTiming(plan,pictures,renders);
  assert.equal(result.clockContactMs,500);
  assert.equal(result.durationMs,950);
  assert.equal(result.consecutive,true);
});
test('does not grant complete timing across unreadable markers or a cropped endpoint', () => {
  const unknown=mediaTiming(plan,[{t:1,renderFrame:0},{t:1.2,renderFrame:null},{t:1.4,renderFrame:2},{t:1.8,renderFrame:4}],renders);
  assert.equal(unknown.unknownInside,true);assert.equal(unknown.durationMs,null);
  const cropped=mediaTiming(plan,[{t:1,renderFrame:0},{t:1.4,renderFrame:2}],renders);
  assert.equal(cropped.boundaryTruncated,true);assert.equal(cropped.durationMs,null);
});
