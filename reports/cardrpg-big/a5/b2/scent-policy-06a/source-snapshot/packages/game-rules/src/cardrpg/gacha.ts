import { Rng, deriveSeed } from '../rng';
import { BANNERS, CARDS, ITEMS } from './catalog';
import { CARD_RPG_CONFIG as C } from './config';
import { RARITY_ORDER, type AccountState, type GachaBanner, type GachaResult, type Odds, type PityState, type Result } from './contract';
import { integer, noBattle, progress, requireRule, spend, transact } from './internal';
import { makeItem } from './state';
export const emptyPity = (): PityState => ({ sinceLegendary: 0, featuredGuaranteed: false, totalPulls: 0 });
export function bannerById(id: string): GachaBanner { const b = BANNERS.find(b => b.id === id); requireRule(b, 'UNKNOWN_ID', 'Banner not found.'); return b; }
/** Next-pull CONDITIONAL odds. Soft pity starts ON pull 41; hard pity ON pull 60. */
export function getBannerOdds(banner: GachaBanner | string, pity: PityState = emptyPity()): Odds {
  const b = typeof banner === 'string' ? bannerById(banner) : banner;
  requireRule(integer(pity.sinceLegendary, 0, b.hardPity - 1), 'INVALID_AMOUNT', 'Pity is outside this banner range.');
  const next = pity.sinceLegendary + 1;
  if (next >= b.hardPity) return { common: 0, rare: 0, epic: 0, legendary: 10000 };
  const legendary = Math.min(10000, b.oddsBp.legendary + Math.max(0, next - b.softPity + 1) * b.softStepBp);
  const remaining = 10000 - legendary, denominator = 10000 - b.oddsBp.legendary;
  const rare = Math.floor(b.oddsBp.rare * remaining / denominator), epic = Math.floor(b.oddsBp.epic * remaining / denominator);
  return { common: remaining - rare - epic, rare, epic, legendary };
}
export function pull(bannerId: string, state: AccountState, seed: number, count = 1): Result<GachaResult[]> {
  return transact(state, (s, events) => {
    noBattle(s); const b = bannerById(bannerId);
    requireRule(integer(count, 1, C.maxBatch) && integer(seed, 0, 0xffffffff), 'INVALID_AMOUNT', 'Choose 1–10 draws and an unsigned integer seed.');
    requireRule(s.daily.draws + count <= C.maxDrawsPerDay, 'DAILY_CAP', 'Local daily draw cap reached.');
    spend(s, Object.fromEntries(Object.entries(b.cost).map(([k,v]) => [k, v * count])));
    const pity = s.pity[b.pityGroup] ??= emptyPity(), results: GachaResult[] = [];
    const rng = new Rng(deriveSeed(seed, pity.totalPulls));
    for (let n = 0; n < count; n++) {
      const oddsBp = getBannerOdds(b, pity), rarity = rng.weighted(oddsBp, RARITY_ORDER);
      const result: GachaResult = { index: pity.totalPulls + 1, bannerId, rarity, duplicate: false, shards: 0, pityBefore: pity.sinceLegendary, oddsBp, soulbound: true, tradeable: false };
      if (b.kind === 'cat') {
        let pool = CARDS.filter(c => c.rarity === rarity);
        if (rarity === 'legendary' && b.featuredCardId) {
          const featured = pity.featuredGuaranteed || rng.int(0, 9999) < b.featuredRateBp;
          pool = pool.filter(c => featured ? c.id === b.featuredCardId : c.id !== b.featuredCardId);
          pity.featuredGuaranteed = !featured;
        }
        const unowned = pool.filter(c => !s.cards.some(o => o.cardId === c.id));
        if (unowned.length) pool = unowned;
        requireRule(pool.length > 0, 'NOT_READY', 'This banner has an empty rarity pool.');
        const card = pool[rng.int(0, pool.length - 1)]!, owned = s.cards.find(c => c.cardId === card.id);
        result.cardId = card.id;
        if (owned) { result.duplicate = true; result.shards = C.rarity[rarity].shards; owned.shards += result.shards; }
        else { s.cards.push({ id: card.id, cardId: card.id, level: 1, stars: 1, shards: 0, soulbound: true }); s.loadouts[card.id] = {}; }
      } else {
        let pool = ITEMS.filter(i => i.rarity === rarity);
        const unowned = pool.filter(i => !s.inventory.items.some(o => o.itemId === i.id));
        if (unowned.length) pool = unowned;
        const item = pool[rng.int(0, pool.length - 1)]!;
        result.duplicate = s.inventory.items.some(i => i.itemId === item.id);
        const instance = makeItem(s, item.id, 'draw'); s.inventory.items.push(instance);
        result.itemId = item.id; result.instanceId = instance.id;
      }
      pity.sinceLegendary = rarity === 'legendary' ? 0 : pity.sinceLegendary + 1; pity.totalPulls++; s.daily.draws++;
      s.history.push(result); s.history = s.history.slice(-C.historyLimit); results.push(result); events.push({ type: 'pull.revealed', result }); progress(s, 'draws');
    }
    return results;
  });
}
/** Item-level probability display, including collection protection and featured guarantee. */
export function getDrawPool(state: AccountState, bannerId: string): { id: string; rarity: string; probability: number }[] {
  const b = bannerById(bannerId), p = state.pity[b.pityGroup] ?? emptyPity(), odds = getBannerOdds(b,p);
  return RARITY_ORDER.flatMap(rarity => {
    const rows = (b.kind === 'cat' ? CARDS : ITEMS).filter(x => x.rarity === rarity);
    const owned = (id: string) => b.kind === 'cat' ? state.cards.some(c => c.cardId === id) : state.inventory.items.some(i => i.itemId === id);
    const group = (pool: typeof rows, chance: number) => { const fresh = pool.filter(x => !owned(x.id)); const actual = fresh.length ? fresh : pool; return actual.map(x => ({ id:x.id, rarity, probability: odds[rarity] / 10000 * chance / actual.length })); };
    if (rarity === 'legendary' && b.featuredCardId) { const chance = p.featuredGuaranteed ? 1 : b.featuredRateBp / 10000; return [...group(rows.filter(x => x.id === b.featuredCardId),chance), ...group(rows.filter(x => x.id !== b.featuredCardId),1-chance)]; }
    return group(rows,1);
  });
}
