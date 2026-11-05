import { describe, expect, it } from 'vitest';
import { actCafe, advanceCafe, createCafe } from '@taskbar-hero/game-rules/client/cafe';
import { cafeEnabled, parseCafeSave } from './save';
const valid = () => ({ lastSeen: 1_800_000_000_000, state: advanceCafe(createCafe(11), 140) });
describe('isolated Sample persistence', () => {
  it('requires explicit guest opt-in, never enables a connected server game', () => {
    expect(cafeEnabled('', true)).toBe(false); expect(cafeEnabled('?demo', true)).toBe(false);
    expect(cafeEnabled('?adventure=1', true)).toBe(false); expect(cafeEnabled('?demo&adventure=1', false)).toBe(false);
    expect(cafeEnabled('?demo&adventure=1', true)).toBe(true);
  });
  it('roundtrips patrol, battle, results, sets and saved loadouts', () => {
    const save = valid(); save.state = actCafe(save.state, { type: 'saveKit', name: 'A' });
    expect(parseCafeSave(JSON.stringify(save))).toEqual(save);
    save.state = actCafe(save.state, { type: 'fight' }); expect(save.state.boss).not.toBeNull();
    expect(parseCafeSave(JSON.stringify(save))).toEqual(save);
    save.state = advanceCafe(save.state, 90); expect(save.state.lastBoss).not.toBeNull();
    expect(parseCafeSave(JSON.stringify(save))).toEqual(save);
  });
  it.each([null, '', '{', '{}', '[]', '{"state":null}', '{"lastSeen":-1,"state":{}}'])('rejects malformed envelopes: %s', raw => expect(parseCafeSave(raw)).toBeNull());
  it('rejects corrupt currencies, slots, references, duplicates, codex, phases, results and nonfinite fields', () => {
    const mutations: ((s: any) => void)[] = [s => s.state.patches = 1000, s => s.state.seconds = -1, s => s.state.seed = null,
      s => s.state.chapter = 6, s => s.state.tier = 4, s => s.state.inventory[0].slot = 'helmet', s => s.state.inventory[0].level = 99,
      s => s.state.inventory.push(s.state.inventory[0]), s => s.state.equipped.paw = 'absent', s => s.state.loadouts.A = {},
      s => s.state.discovered.push('6:scout'), s => s.state.discovered.push(s.state.discovered[0]), s => s.state.claimed.push('fake'),
      s => s.state.events.push({ at: 0, kind: 'payRelic', text: 'fake' }), s => s.state.encounter = {},
      s => s.state.boss = {}, s => s.state.lastBoss = {}, s => s.lastSeen = Infinity];
    for (const mutate of mutations) { const save = valid(); mutate(save); expect(parseCafeSave(JSON.stringify(save))).toBeNull(); }
  });
});
