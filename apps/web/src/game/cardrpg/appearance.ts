import {ITEM_BY_ID} from '@taskbar-hero/game-rules/cardrpg';
import {SQUAD_ITEMS,ITEM_BY_ID as SQUAD_BY_ID,type SquadItem} from '@taskbar-hero/game-rules/src/squad/gear/catalog';
import type {TurnActor} from '@taskbar-hero/game-rules/src/squad/turn/types';
import type {EquipmentAppearance} from '../squad/turn3d/appearance';
const cache=new WeakMap<TurnActor,{equipment:TurnActor["equipment"];items:TurnActor["cardRpg"];value:EquipmentAppearance}>();
/** Maps stable account identities onto original sockets, preserving temporary expedition gear. */
export function accountAppearance(actor:TurnActor):EquipmentAppearance{
 const old=cache.get(actor);if(old&&old.items===actor.cardRpg&&old.equipment.weapon===actor.equipment.weapon&&old.equipment.outfit===actor.equipment.outfit&&old.equipment.charm===actor.equipment.charm&&old.equipment.relic===actor.equipment.relic)return old.value;
 const value:EquipmentAppearance={};
 for(const id of actor.cardRpg?.itemIds??[]){const item=ITEM_BY_ID[id];if(!item)continue;
  const options=SQUAD_ITEMS.filter(i=>i.slot===item.slot&&i.fit.includes(actor.role as 'guardian'|'witch'|'alchemist'));
  const title=item.rarity[0]!.toUpperCase()+item.rarity.slice(1);
  const shape=options.find(i=>item.uniqueEffect&&i.property===item.uniqueEffect)??options.find(i=>i.rarity===title)??options[0];
  if(shape)value[item.slot]={...shape,name:item.name,rarity:title as SquadItem['rarity'],flavor:item.description};
 }
 for(const [slot,id]of Object.entries(actor.equipment)){const item=SQUAD_BY_ID[id!];if(item)value[slot as keyof EquipmentAppearance]=item}
 cache.set(actor,{equipment:{...actor.equipment},items:actor.cardRpg,value});return value;
}
