import { CARDS, CARD_BY_ID, QUESTS, RECIPES } from './catalog';
import { CARD_RPG_CONFIG as C } from './config';
import { CHAIN_NOTICE, type AccountState, type ForgeRecipe, type Preview, type Result, type Reward } from './contract';
import { afford, grant, integer, noBattle, preview, progress, requireRule, spend, transact } from './internal';
import { makeItem } from './state';
export function previewForge(s: AccountState, recipeId: string): Preview<ForgeRecipe> { return preview(() => {
  noBattle(s); const r = RECIPES.find(r => r.id === recipeId); requireRule(r, 'UNKNOWN_ID', 'Recipe not found.');
  requireRule(s.chapter >= r.requiredChapter, 'NOT_READY', 'Clear the first chapter to unlock this recipe.');
  afford(s, r.cost);
  for (const [id, amount] of Object.entries(r.materials)) requireRule((s.inventory.stacks[id] ?? 0) >= amount, 'INSUFFICIENT_FUNDS', `Need ${amount} ${id}.`);
  if (r.outputStackId === 'cafe-ribbon') requireRule(!s.inventory.stacks[r.outputStackId], 'ALREADY_CLAIMED', 'The ribbon is already in your collection.');
  if (r.scarcityId) {
    const x = s.scarcity[r.scarcityId]; requireRule(x, 'UNKNOWN_ID', 'Design series not found.');
    requireRule(!s.designClaims.includes(x.id), 'ALREADY_CLAIMED', 'One design eligibility per account and series this season.');
    requireRule(integer(x.issuedDesign, 0, x.globalCap) && integer(x.seasonIssuedDesign, 0, x.seasonCap), 'SUPPLY_CAP', 'Invalid design supply counters.');
    requireRule(x.issuedDesign < x.globalCap && x.seasonIssuedDesign < x.seasonCap, 'SUPPLY_CAP', 'This design series has no remaining issuance.');
  }
  return r;
}); }
export function forge(state: AccountState, recipeId: string): Result<string> { return transact(state, (s, events) => {
  const p = previewForge(s, recipeId); requireRule(p.ok, p.ok ? 'NOT_READY' : p.error.code, p.ok ? '' : p.error.message); const r = p.value;
  spend(s, r.cost); for (const [id, amount] of Object.entries(r.materials)) s.inventory.stacks[id]! -= amount;
  if (r.scarcityId) { const x = s.scarcity[r.scarcityId]!; x.issuedDesign++; x.seasonIssuedDesign++; s.designClaims.push(x.id); events.push({ type: 'relic.designClaimed', scarcityId: x.id, notice: CHAIN_NOTICE }); return x.id; }
  const id = r.outputItemId ? (() => { const i = makeItem(s, r.outputItemId, 'forge'); s.inventory.items.push(i); return i.id; })() : r.outputStackId!;
  if (r.outputStackId) s.inventory.stacks[r.outputStackId] = (s.inventory.stacks[r.outputStackId] ?? 0) + 1;
  events.push({ type: 'item.forged', id }); return id;
}); }
export function claimQuest(state: AccountState, questId: string): Result<Reward> { return transact(state, (s, events) => {
  const q = QUESTS.find(q => q.id === questId), p = s.quests[questId]; requireRule(q && p, 'UNKNOWN_ID', 'Quest not found.');
  requireRule(!p.claimed, 'ALREADY_CLAIMED', 'Quest reward already claimed.'); requireRule(p.progress >= q.target, 'NOT_READY', 'Quest objectives are incomplete.');
  p.claimed = true; const reward = grant(s, q.reward, q.cadence !== 'achievement', events); events.push({ type: 'reward.claimed', id: q.id, reward }); return reward;
}); }
export function advanceLocalDay(state: AccountState): Result { return transact(state, (s, events) => {
  noBattle(s); s.day++; s.daily = { battles: 0, service: 0, draws: 0, earned: { fish: 0, threads: 0, stamps: 0, essence: 0 } };
  for (const q of QUESTS) if (q.cadence === 'daily' || q.cadence === 'weekly' && (s.day - 1) % 7 === 0) s.quests[q.id] = { progress: 0, claimed: false };
  events.push({ type: 'day.advanced', day: s.day });
}); }
export function claimCafeService(state: AccountState, minutes: number): Result<Reward> { return transact(state, (s, events) => {
  noBattle(s); requireRule(integer(minutes, C.service.minutesPerClaim), 'INVALID_AMOUNT', 'Cafe service needs at least ten whole minutes.');
  const claims = Math.min(Math.floor(minutes / C.service.minutesPerClaim), C.service.maxClaims - s.daily.service);
  requireRule(claims > 0, 'DAILY_CAP', 'Both local cafe services are complete.'); s.daily.service += claims; progress(s, 'service', claims);
  const reward = grant(s, { currencies: Object.fromEntries(Object.entries(C.service.reward).map(([k,v]) => [k, v * claims])), xp: 0 }, true, events);
  events.push({ type: 'reward.claimed', id: `service-day-${s.day}-${s.daily.service}`, reward }); return reward;
}); }
export function selectTeam(state: AccountState, cardIds: string[]): Result { return transact(state, s => {
  noBattle(s); requireRule(cardIds.length === 3 && new Set(cardIds).size === 3, 'INVALID_TEAM', 'Choose three different cats.');
  const cards = cardIds.map(id => s.cards.find(c => c.id === id)); requireRule(cards.every(Boolean), 'INVALID_TEAM', 'Every team member must be owned.');
  requireRule(new Set(cards.map(c => CARD_BY_ID[c!.cardId]!.role)).size === 3, 'INVALID_TEAM', 'Choose one guardian, one witch and one alchemist.');
  const t = s.teams.find(t => t.id === s.activeTeamId)!; t.cardIds = [...cardIds];
}); }
export function collectionProgress(s: AccountState): { owned: number; total: number; percent: number } { return { owned: s.cards.length, total: CARDS.length, percent: s.cards.length / CARDS.length * 100 }; }
/** Pure ERC-1155-compatible JSON projection. No voucher, mint call or supply proof is fabricated. */
export function relicDesignMetadata(s: AccountState, scarcityId: string) {
  const x = s.scarcity[scarcityId]; requireRule(x, 'UNKNOWN_ID', 'Design series not found.');
  return { name: x.name, description: CHAIN_NOTICE, image: `relics/${x.relicId}.svg`, attributes: [{ trait_type: 'Rarity', value: C.rarity[x.rarity].name }, { trait_type: 'Status', value: CHAIN_NOTICE }], properties: { chainId: 43113, relicId: x.relicId, rarityIndex: x.rarityIndex, globalCap: x.globalCap, seasonCap: x.seasonCap, mintedSoFar: 0, eligible: s.designClaims.includes(x.id), binding: 'soulbound-preview', enforcement: 'local simulation only; existing contract has no supply cap' } };
}

export function exchangeShards(state: AccountState, cardId: string, batches: number): Result<Reward> { return transact(state, (s,events) => {
  noBattle(s); requireRule(integer(batches,1,12), 'INVALID_AMOUNT', 'Exchange one to twelve batches.');
  const card=s.cards.find(c=>c.id===cardId); requireRule(card, 'UNKNOWN_ID', 'Cat not found.');
  requireRule(card.stars===C.level.maxStars, 'NOT_READY', 'Reach five stars before exchanging spare shards.');
  requireRule(card.shards>=batches*C.shardExchange.shards, 'INSUFFICIENT_FUNDS', 'Not enough spare shards.');
  requireRule(s.daily.earned.essence+batches*C.shardExchange.essence<=C.dailyCaps.essence, 'DAILY_CAP', 'Daily essence cap reached.');
  card.shards-=batches*C.shardExchange.shards;
  const reward=grant(s,{currencies:{essence:batches*C.shardExchange.essence},xp:0},true,events);
  events.push({type:'reward.claimed',id:'spare-shards',reward});return reward;
}); }
