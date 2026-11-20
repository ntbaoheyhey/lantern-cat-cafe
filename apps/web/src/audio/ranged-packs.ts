import {CAT_BY_ID,ENEMY_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';

// Shared with the battle scheduler so preload and contact use the same palette.
export const BATTLE_ELEMENTS:Readonly<Record<string,string>>={mochi:'holy',soot:'ember',clover:'garden',panko:'heavy',biscuit:'lightning',inkcap:'shadow',velvet:'ice',cinnamon:'fire',brioche:'hearth',sorrel:'tide',marigold:'nature',mallow:'moon'};
export const ALL_RANGED_PACKS=['v4-ranged-ember','v4-ranged-heavy','v4-ranged-shadow','v4-ranged-tide'] as const;

/** Missing or unfamiliar actors keep full coverage; known melee/healers need no ranged pack. */
export function rangedPacksForRoster(actors?:readonly string[]):readonly string[]{
 if(!actors?.length)return ALL_RANGED_PACKS;
 const packs=new Set<string>();
 for(const actor of actors){
  const owner=actor.replace(/^party-/,'').replace(/^foe-\d+-/,''),unit=CAT_BY_ID[owner]??ENEMY_BY_ID[owner];
  if(!unit)return ALL_RANGED_PACKS;
  if(unit.combatClass!=='ranged')continue;
  const element=BATTLE_ELEMENTS[owner]??'heavy',pack=`v4-ranged-${element==='ice'?'tide':element}`;
  if(!ALL_RANGED_PACKS.some(known=>known===pack))return ALL_RANGED_PACKS;
  packs.add(pack);
 }
 return [...packs].sort();
}
