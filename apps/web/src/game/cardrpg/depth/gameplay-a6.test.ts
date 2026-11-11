import { expect, it } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from './model';

it('uses x1/x2/x3 in A6 and gates skip on earned stage stars', () => {
  const m = new DepthModel(true, true, true, true);
  m.start(1); m.enter('0-0');
  expect(m.battle!.initial.gameplayA6).toBe(true);
  const before = JSON.stringify(m.battle);
  m.skip(); expect(JSON.stringify(m.battle)).toBe(before);
  m.cycleSpeed(); expect(m.state.settings.speed).toBe(2);
  m.cycleSpeed(); expect(m.state.settings.speed).toBe(3);
  expect(R.importSave(R.exportSave(m.state)).settings.speed).toBe(3);
  m.cycleSpeed(); expect(m.state.settings.speed).toBe(1);
  const run = m.state.run!, node = run.nodes.find(n => n.id === run.current)!;
  const key = R.nodeStarKeyV4(run, node);
  m.state.v4!.journey!.stars[key] = { key, chapter: run.chapter, band: run.challengeLevel!, nodeId: node.id, kind: node.kind, conditions: [true, true, true] };
  expect(m.canSkip).toBe(true); m.skip(); expect(m.screen).toBe('result');
});

it('keeps auto-continue off until chosen and pauses on defeat', () => {
  const m = new DepthModel(true, true, true, true);
  expect(m.autoContinue).toBe(false);
  m.start(1); m.enter('0-0'); m.battle!.result = 'enemy';
  m.autoContinue = true; const before = JSON.stringify(m.state);
  m.continueBattle(); expect(JSON.stringify(m.state)).toBe(before);
});
