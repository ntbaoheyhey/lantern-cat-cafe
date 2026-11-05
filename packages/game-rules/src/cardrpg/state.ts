import { CARD_BY_ID, ITEMS, QUESTS, SCARCITY } from './catalog';
import { CARD_RPG_CONFIG as C } from './config';
import { CONTRACT_VERSION, type AccountState, type ItemInstance } from './contract';
/** Internal draft builder; deliberately excluded from the public pure API. */
export function makeItem(state: AccountState, itemId: string, source: ItemInstance['source']): ItemInstance {
  const template = ITEMS.find(i => i.id === itemId);
  if (!template) throw new Error(`Unknown item ${itemId}`);
  return { id: `item-${state.nextId++}`, itemId, level: 1, enhancement: 0, affixes: template.affixes.map(a => ({ ...a })), locked: false, favourite: false, soulbound: true, source, reforgeCount: 0 };
}
export function createStarterAccount(seed = 11): AccountState {
  const s: AccountState = { version: CONTRACT_VERSION, seed: seed >>> 0, nextId: 1, day: 1, accountXp: 0, accountLevel: 1, chapter: 1, currencies: { ...C.starterBalances }, cards: ['mochi', 'soot', 'clover'].map(cardId => ({ id: cardId, cardId, level: 1, stars: 1, shards: 0, soulbound: true })), inventory: { items: [], stacks: { 'pantry-key': 1 } }, loadouts: {}, teams: [{ id: 'team-1', name: 'Cafe Opening Shift', cardIds: ['mochi', 'soot', 'clover'] }], activeTeamId: 'team-1', pity: {}, history: [], quests: Object.fromEntries(QUESTS.map(q => [q.id, { progress: 0, claimed: false }])), claimedBattleIds: [], clearedChapters: [], daily: { battles: 0, service: 0, draws: 0, earned: { fish: 0, threads: 0, stamps: 0, essence: 0 } }, scarcity: Object.fromEntries(SCARCITY.map(x => [x.id, { ...x }])), designClaims: [], nextRunId: 1, pendingRun: null };
  for (const card of s.cards) {
    const set = { guardian: 'hearthloom', witch: 'moonwick', alchemist: 'mossbrew' }[CARD_BY_ID[card.cardId]!.role];
    const weapon = makeItem(s, `${set}-weapon-common`, 'starter'), outfit = makeItem(s, `${set}-outfit-common`, 'starter');
    s.inventory.items.push(weapon, outfit); s.loadouts[card.id] = { weapon: weapon.id, outfit: outfit.id };
  }
  return s;
}
