import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_BY_ID } from '@taskbar-hero/game-rules/cardrpg';
import { SQUAD_ITEMS, type SquadItem } from '@taskbar-hero/game-rules/src/squad/gear/catalog';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { EquipmentAppearance } from '../../squad/turn3d/appearance';

export function project(battle: R.Battle): TurnActor[] {
  const slots = { party: 0, enemy: 0 };
  return battle.actors.map(actor => ({
    ...actor, slot: actor.side === 'enemy' && actor.hp <= 0 ? slots.enemy : slots[actor.side]++, role: (CARD_BY_ID[actor.catalogId]?.role ?? R.ENEMY_BY_ID[actor.catalogId]?.role ?? 'guard') as TurnActor['role'],
    equipment: {}, setBonuses: [], statuses: [], shieldRounds: 1, shieldAppliedRound: battle.round,
    crit: 0, auto: false, cooldownApplied: {}, turnsTaken: actor.turns, controlCount: 0, passiveReady: 0, quickenedRound: 0,
    cardRpg: { cardId: actor.catalogId, name: actor.name, stats: {} as never, properties: [], sets: [], itemIds: actor.equipment },
  }));
}
export function appearance(actor: TurnActor): EquipmentAppearance {
  const result: EquipmentAppearance = {};
  for (const id of actor.cardRpg?.itemIds ?? []) {
    const template = R.GEAR_BY_ID[id];
    if (!template) continue;
    const options = SQUAD_ITEMS.filter(item => item.slot === template.slot && item.fit.includes(actor.role as 'guardian'));
    const setIndex = R.SETS.findIndex(s => s.id === template.setId);
    const item = options[(Math.max(0, setIndex) + (template.unique ? 3 : 0)) % options.length];
    if (item) result[template.slot] = { ...item, name: template.name, cardDesign: template.unique,
      visual: template.unique ? 3 : setIndex % 4, rarity: (template.rarity[0]!.toUpperCase() + template.rarity.slice(1)) as SquadItem['rarity'] };
  }
  return result;
}
