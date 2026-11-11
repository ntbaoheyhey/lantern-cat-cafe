import { describe, expect, it } from 'vitest';
import * as R from './index';

function collection() {
  const s = R.setGameplayA6(R.createDepthAccount(11, 0), true), base = s.account.cards[0]!;
  s.account.cards = R.CATS.map(cat => ({ ...base, id: `bond-${cat.id}`, cardId: cat.id, level: 6 }));
  return s;
}
function pairBattle(pair: R.PairComboA6, enabled = true) {
  const s = collection();
  s.team = [...pair.cats, R.CATS.find(cat => !pair.cats.includes(cat.id))!.id];
  for (const id of s.team) s.rows[id] = R.CAT_BY_ID[id]!.row;
  const cats = R.battleCats(s).map(c => ({ ...c, skills: R.CAT_BY_ID[c.id]!.skills.map(skill => skill.id) }));
  return R.createBattle({ cats, seed: 17, chapter: 3, enemies: ['yarn-giant'], gameplayV4: true, skillsV5: true, ...(enabled ? { gameplayA6: true } : {}) });
}
describe('A6 collection bonds and automatic pair combos', () => {
  it('gives the whole owned roster the collection bonus independent of the fighting team', () => {
    const s = collection();
    expect(R.COLLECTION_BONDS_A6).toHaveLength(9);
    expect(R.PAIR_COMBOS_A6).toHaveLength(8);
    expect(R.collectionBonusA6(s)).toBe(450);
    const off = R.setGameplayA6(s, false);
    for (const cat of s.account.cards) {
      const base = R.depthStats(off, cat.cardId), boosted = R.depthStats(s, cat.cardId);
      expect(boosted.hp).toBe(Math.round(base.hp * 1.045));
      expect(boosted.attack).toBe(Math.round(base.attack * 1.045));
    }
    expect(R.collectionBonusA6(off)).toBe(0);
    s.team = ['panko', 'biscuit', 'velvet'];
    expect(R.collectionBonusA6(s)).toBe(450);
  });
  it('lists missing cats and counts a collection once despite duplicate instances', () => {
    const s = collection();
    s.account.cards = s.account.cards.filter(c => c.cardId !== 'clover');
    s.account.cards.push({ ...s.account.cards[0]!, id: 'duplicate' });
    const first = R.collectionBondsA6(s).find(b => b.id === 'first-lantern')!;
    expect(first.active).toBe(false); expect(first.missing).toEqual(['clover']);
    expect(R.collectionBonusA6(s)).toBe(350);
  });
  it('fires every authored pair once, preserves V5 events and replays exactly', () => {
    for (const pair of R.PAIR_COMBOS_A6) {
      const b = pairBattle(pair);
      b.actors.filter(a => a.side === 'enemy').forEach(a => { a.hp = a.maxHp = 100000; });
      // Direct trigger checks timing and once-only without changing authored replay setup.
      b.round = 2;
      const actor = b.actors.find(a => a.catalogId === pair.cats[0])!;
      const hits: string[] = [];
      const io = { damage: (_: R.Battle, __: R.Actor, target: R.Actor) => { hits.push(target.id); }, apply: () => true, shield: () => {}, heal: () => {} };
      R.triggerPairCombosA6(b, actor, io); expect(hits).toHaveLength(0);
      b.round = 3; R.triggerPairCombosA6(b, actor, io); const first = hits.length;
      expect(first).toBeGreaterThan(0); R.triggerPairCombosA6(b, actor, io); expect(hits).toHaveLength(first);
      expect(b.v4!.events.filter(e => e.kind === 'bond.combo' && e.comboId === pair.id)).toHaveLength(1);
      expect(b.v4!.events.every((e, i) => R.validBattleEventV5(e, i, true))).toBe(true);
      const played = R.playBattle(pairBattle(pair), 'auto');
      expect(R.replayBattle(played.initial, played.choices)).toEqual(played);
      expect(played.v4!.events.some(e => e.kind === 'bond.combo' && e.comboId === pair.id)).toBe(true);
    }
  });
  it('does not combo with a fallen partner or with the flag off', () => {
    for (const enabled of [false, true]) {
      const b = pairBattle(R.PAIR_COMBOS_A6[0]!, enabled); b.round = 3;
      const actor = b.actors.find(a => a.catalogId === 'mochi')!;
      b.actors.find(a => a.catalogId === 'clover')!.hp = 0;
      R.triggerPairCombosA6(b, actor, { damage: () => { throw Error('must not hit'); }, apply: () => true, shield: () => {}, heal: () => {} });
      expect(b.v4!.events.some(e => e.kind === 'bond.combo')).toBe(false);
    }
  });
  it('stops later combos if the triggering partner falls to retaliation', () => {
    const b = pairBattle(R.PAIR_COMBOS_A6.find(pair => pair.id === 'garden-afterglow')!);
    const actor = b.actors.find(a => a.catalogId === 'clover')!; b.round = 3;
    R.triggerPairCombosA6(b, actor, { damage: () => { actor.hp = 0; }, apply: () => true, shield: () => {}, heal: () => {} });
    expect(b.v4!.events.filter(e => e.kind === 'bond.combo')).toHaveLength(1);
  });
  it('round-trips a committed battle including combo events through save import', () => {
    const s = collection();
    let next = R.startRun(s, 1, 17).state;
    next = R.enterNode(next, R.availableNodes(next.run!)[0]!.id).state;
    R.playBattle(next.run!.battle!, 'auto');
    expect(R.importSave(R.exportSave(next))).toEqual(next);
  });
});
