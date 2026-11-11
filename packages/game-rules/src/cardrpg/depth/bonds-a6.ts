import type { Actor, Battle, DepthAccount, StatusId } from './contract';
import { emitGameplayEvent } from './events-v4';

export const COLLECTION_BONDS_A6 = [
  { id: 'first-lantern', name: 'First Lantern', cats: ['mochi', 'soot', 'clover'] },
  { id: 'warm-kitchen', name: 'Warm Kitchen', cats: ['panko', 'mallow', 'biscuit'] },
  { id: 'garden-tea', name: 'Garden Tea', cats: ['clover', 'sorrel', 'marigold'] },
  { id: 'night-watch', name: 'Night Watch', cats: ['soot', 'inkcap', 'velvet'] },
  { id: 'shared-aprons', name: 'Shared Aprons', cats: ['mochi', 'brioche'] },
  { id: 'second-serving', name: 'Second Serving', cats: ['cinnamon', 'sorrel'] },
  { id: 'moon-crumbs', name: 'Moon Crumbs', cats: ['biscuit', 'velvet'] },
  { id: 'sunlit-cups', name: 'Sunlit Cups', cats: ['mallow', 'marigold'] },
  { id: 'quiet-corner', name: 'Quiet Corner', cats: ['inkcap', 'cinnamon'] },
] as const;
export function collectionBondsA6(state: DepthAccount) {
  const owned = new Set(state.account.cards.map(c => c.cardId));
  return COLLECTION_BONDS_A6.map(bond => ({ ...bond, owned: bond.cats.filter(id => owned.has(id)), missing: bond.cats.filter(id => !owned.has(id)), active: bond.cats.every(id => owned.has(id)) }));
}
/** Each completed collection adds half a percent HP/attack, even from the bench. */
export function collectionBonusA6(state: DepthAccount): number {
  if (!(state.run && !state.run.complete ? state.run.gameplayA6 : state.gameplayA6)) return 0;
  return collectionBondsA6(state).filter(b => b.active).length * 50;
}
export interface PairComboA6 {
  id: string; name: string; cats: readonly [string, string]; power: number;
  status?: StatusId; support?: 'shield' | 'heal'; description: string;
}
export const PAIR_COMBOS_A6: readonly PairComboA6[] = [
  { id: 'lantern-pledge', name: 'Lantern Pledge', cats: ['mochi', 'clover'], power: 65, support: 'shield', description: 'Strike the weakest foe and shield the team.' },
  { id: 'oven-sparks', name: 'Oven Sparks', cats: ['panko', 'mallow'], power: 90, status: 'scald', description: 'Strike and Burn the weakest foe.' },
  { id: 'mooncrumb-waltz', name: 'Mooncrumb Waltz', cats: ['biscuit', 'velvet'], power: 100, status: 'scent', description: 'Strike and Mark the weakest foe.' },
  { id: 'ink-and-ember', name: 'Ink and Ember', cats: ['soot', 'inkcap'], power: 80, status: 'brittle', description: 'Shred the weakest foe, then strike.' },
  { id: 'shared-sunrise', name: 'Shared Sunrise', cats: ['sorrel', 'cinnamon'], power: 65, support: 'heal', description: 'Strike the weakest foe and heal the team.' },
  { id: 'golden-canopy', name: 'Golden Canopy', cats: ['brioche', 'marigold'], power: 75, support: 'shield', description: 'Strike the weakest foe and shield the team.' },
  { id: 'garden-afterglow', name: 'Garden Afterglow', cats: ['clover', 'inkcap'], power: 80, status: 'snag', description: 'Strike and Bleed the weakest foe.' },
  { id: 'crumb-teapot', name: 'Crumb Teapot', cats: ['biscuit', 'sorrel'], power: 80, status: 'crumb', description: 'Strike and leave Crumbs on the weakest foe.' },
];
export const activePairCombosA6 = (team: readonly string[]) => PAIR_COMBOS_A6.filter(pair => pair.cats.every(id => team.includes(id)));
interface ComboRuntimeA6 {
  damage: (b: Battle, source: Actor, target: Actor, power: number, pressure: number) => void;
  apply: (b: Battle, source: Actor, target: Actor, id: StatusId, count?: number) => boolean;
  shield: (b: Battle, source: Actor, target: Actor, amount: number) => void;
  heal: (b: Battle, source: Actor, target: Actor, amount: number) => void;
}
/** Follow the first partner's action from round three, once per pair, with both alive. */
export function triggerPairCombosA6(b: Battle, actor: Actor, io: ComboRuntimeA6): void {
  if (!b.initial.gameplayA6 || b.initial.tutorial || b.round < 3 || actor.side !== 'party' || actor.hp <= 0) return;
  const allies = b.actors.filter(a => a.side === 'party' && a.hp > 0);
  for (const pair of activePairCombosA6(allies.map(a => a.catalogId))) {
    if (actor.hp <= 0) return;
    if (!pair.cats.every(id => allies.some(ally => ally.catalogId === id && ally.hp > 0))) continue;
    if (!pair.cats.includes(actor.catalogId) || b.procRounds[`a6Pair:${pair.id}`]) continue;
    const target = b.actors.filter(a => a.side === 'enemy' && a.hp > 0).sort((a, c) => a.hp - c.hp || a.id.localeCompare(c.id))[0];
    if (!target) return;
    b.procRounds[`a6Pair:${pair.id}`] = 1;
    if (pair.status) io.apply(b, actor, target, pair.status, 1);
    io.damage(b, actor, target, pair.power, 0);
    if (pair.support) for (const ally of allies) io[pair.support](b, actor, ally, 20);
    b.log.push({ round: b.round, actorId: actor.id, targetId: target.id, skillId: pair.id, kind: 'bond.combo', amount: 1, text: pair.name });
    emitGameplayEvent(b, { kind: 'bond.combo', actorId: actor.id, targetId: target.id, comboId: pair.id, displayName: pair.name, contributors: [...pair.cats], targets: [target.id], text: `${pair.name} · ${pair.description}` });
  }
}
