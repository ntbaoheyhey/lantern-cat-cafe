import { afterEach, expect, it, vi } from 'vitest';
import { CARD_BY_ID } from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from './model';
import { bestRoleTeam, gearComparison, nextChallenge, readTeamPresets, TEAM_PRESETS_KEY, teamPower } from './meta-presentation';
import { appearance, project } from './scene-actors';

afterEach(() => vi.unstubAllGlobals());

it('validates each preset independently and rejects malformed or unsupported preferences', () => {
  const state = R.createDepthAccount();
  const preset = { name: 'Evening', team: state.team, rows: state.rows };
  const raw = (slots: unknown[]) => JSON.stringify({ version: 1, slots });
  expect(readTeamPresets(raw([preset, { ...preset, team: ['mochi', 'mochi', 'clover'] }, preset])))
    .toEqual([preset, null, preset]);
  expect(readTeamPresets(raw([{ ...preset, rows: { mochi: 'rear', soot: 'rear', clover: 'rear' } }]))).toEqual([null, null, null]);
  expect(readTeamPresets(raw([{ ...preset, team: ['mochi', 'soot', '__proto__'] }]))).toEqual([null, null, null]);
  for (const value of [null, 'damaged', 'null', '{"version":2,"slots":[]}']) {
    expect(readTeamPresets(value)).toEqual([null, null, null]);
  }
});

it('persists browser presets and applies them through current team validation', () => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value) });
  const model = new DepthModel(false);
  model.saveTeamPreset(0);
  expect(data.has(TEAM_PRESETS_KEY)).toBe(true);
  const restored = new DepthModel(false);
  expect(restored.teamPresets[0]?.team).toEqual(model.state.team);
  restored.state.rows.soot = 'front';
  restored.loadTeamPreset(0);
  expect(restored.state.rows.soot).toBe('rear');
  restored.start(1);
  const before = structuredClone(restored.state);
  restored.loadTeamPreset(0);
  expect(restored.error).toBe(true);
  expect(restored.state).toEqual(before);
});

it('keeps offline presets in the visit and reports unavailable browser storage', () => {
  const getItem = vi.fn(() => { throw Error('blocked'); });
  const setItem = vi.fn(() => { throw Error('blocked'); });
  vi.stubGlobal('localStorage', { getItem, setItem });
  const offline = new DepthModel(true);
  offline.saveTeamPreset(0);
  expect(offline.notice).toContain('offline visit');
  expect(getItem).not.toHaveBeenCalled();
  expect(setItem).not.toHaveBeenCalled();
  const online = new DepthModel(false);
  online.saveTeamPreset(1);
  expect(online.notice).toContain('Browser storage is unavailable');
  expect(online.teamPresets[1]).toBeTruthy();
});

it('rejects presets containing companions absent from the current imported account', () => {
  const model = new DepthModel(true);
  model.teamPresets[0] = { name: 'Old collection', team: ['mochi', 'soot', 'briar'],
    rows: { mochi: 'front', soot: 'rear', briar: 'rear' } };
  const before = structuredClone(model.state);
  model.loadTeamPreset(0);
  expect(model.error).toBe(true);
  expect(model.state).toEqual(before);
});

it('selects distinct owned companions with one of each role and stable power scores', () => {
  const model = new DepthModel(true);
  expect(bestRoleTeam(model.state)).toEqual(['mochi', 'soot', 'clover']);
  model.shortcut('unlock');
  const best = bestRoleTeam(model.state);
  expect(best).toHaveLength(3);
  expect(new Set(best.map(id => R.CAT_BY_ID[id]!.role)).size).toBe(3);
  expect(teamPower(model.state, best)).toBeGreaterThanOrEqual(teamPower(model.state));
  expect(bestRoleTeam(model.state)).toEqual(best);
});

it('uses the real equip transaction for deltas without mutating the account', () => {
  const state = R.createDepthAccount();
  const item = R.makeGear(state, 'hearthloom-weapon-legendary', 23);
  state.gear.push(item);
  const before = structuredClone(state);
  const comparison = gearComparison(state, 'mochi', item.id);
  const result = R.equipGear(state, 'mochi', item.id);
  expect(comparison.error).toBe('');
  expect(comparison.stats).toEqual(R.depthStats(result.state, 'mochi'));
  expect(comparison.delta?.attack).toBe(comparison.stats!.attack - R.depthStats(state, 'mochi').attack);
  expect(state).toEqual(before);
  expect(gearComparison(state, 'missing', item.id).stats).toBeNull();
});

it('derives reference encounter power from existing enemies without starting a route', () => {
  const state = R.createDepthAccount();
  const before = structuredClone(state);
  const challenge = nextChallenge(state);
  expect(challenge.enemyPower).toBeGreaterThan(0);
  expect(challenge.chapter.id).toBe(1);
  expect(challenge.exact).toBe(false);
  expect(state).toEqual(before);
});

it('passes named legendary designs to all four existing model sockets', () => {
  const state = R.createDepthAccount();
  for (const slot of ['weapon', 'outfit', 'charm', 'relic'] as const) {
    const item = R.makeGear(state, `hearthloom-${slot}-legendary`, 11);
    state.gear.push(item);
    state.equipment.mochi ??= {};
    state.equipment.mochi[slot] = item.id;
  }
  const actor = project(R.createBattle({ seed: 11, chapter: 1, cats: R.battleCats(state), enemies: ['button-guard'] }))[0]!;
  const visual = appearance(actor);
  expect(Object.keys(visual)).toHaveLength(4);
  expect(Object.values(visual).every(item => item.rarity === 'Legendary' && item.cardDesign)).toBe(true);
  expect(actor.role).toBe(CARD_BY_ID.mochi!.role);
});
