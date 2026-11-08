/** Original, in-memory squad items. No production inventory IDs or economy values. */
import type { Hero } from '../types';
export const GEAR_SLOTS = ['weapon','outfit','charm','relic'] as const;
export type GearSlot = typeof GEAR_SLOTS[number];
export const RARITIES = ['Common','Uncommon','Rare','Epic','Legendary'] as const;
export type GearRarity = typeof RARITIES[number];
export type GearStat = 'attack'|'defense'|'hp'|'crit'|'healing'|'shield'|'initiative'|'cooldown'|'statusChance';
export type GearProperty = 'chain'|'neighborShield'|'afterheal'|'firstStep'|'longBurn'|'renew'|'efficient'|'break'|'cleanseGuard'|'vampiric'|'charge'|'thorns';
export type GearSet = 'hearthloom'|'moonwick'|'mossbrew';
export interface StatLine { stat: GearStat; value: number }
export interface SquadItem {
  id:string; name:string; slot:GearSlot; rarity:GearRarity; fit:readonly Hero[];
  main:StatLine; affixes:readonly StatLine[]; property?:GearProperty; set?:GearSet;
  flavor:string; visual:number;
}
export type Loadout = Partial<Record<GearSlot,string>>;
const all:Hero[]=['guardian','witch','alchemist'];
const line=(stat:GearStat,value:number):StatLine=>({stat,value});
const item=(id:string,name:string,slot:GearSlot,rarity:GearRarity,fit:readonly Hero[],main:StatLine,
  affixes:StatLine[],property:GearProperty|undefined,set:GearSet|undefined,flavor:string,visual:number):SquadItem=>
  ({id,name,slot,rarity,fit,main,affixes,property,set,flavor,visual});
export const SQUAD_ITEMS:readonly SquadItem[]=[
  item('g-ladle','Breakfast Ladle','weapon','Common',['guardian'],line('attack',5),[],undefined,undefined,'Every brave night starts with soup.',0),
  item('g-pan','Copper Crust Pan','weapon','Uncommon',['guardian'],line('attack',8),[line('defense',3)],undefined,'hearthloom','Seasoned by a thousand late dinners.',1),
  item('g-bell','Doorbell Bulwark','weapon','Rare',['guardian'],line('attack',10),[line('shield',.08)],'neighborShield','hearthloom','A familiar ring. A friend at your shoulder.',2),
  item('g-sun','Sunspoon Standard','weapon','Legendary',['guardian'],line('attack',16),[line('crit',.04),line('initiative',1)],'break','hearthloom','Raised when the last lamp refuses to go out.',3),
  item('g-apron','Flour-Dusted Apron','outfit','Common',['guardian'],line('hp',35),[],undefined,undefined,'A pocket for each crumb of courage.',4),
  item('g-quilt','Quilted Doorwarden','outfit','Rare',['guardian'],line('defense',7),[line('hp',30)],'thorns','hearthloom','Soft patches hide a stubborn stitch.',5),
  item('g-mantle','Second-Chair Mantle','outfit','Epic',['guardian'],line('hp',65),[line('shield',.1),line('defense',4)],'cleanseGuard','hearthloom','No one sits alone under this roof.',6),
  item('g-coat','Golden Hour Coat','outfit','Legendary',['guardian'],line('defense',12),[line('hp',50),line('initiative',1)],'firstStep','hearthloom','The first pawstep opens the cafe.',7),
  item('w-twig','Cinder-Tipped Twig','weapon','Common',['witch'],line('attack',5),[],undefined,undefined,'Still warm from yesterday’s story.',8),
  item('w-whisk','Moonmilk Whisk','weapon','Uncommon',['witch','alchemist'],line('attack',7),[line('crit',.02)],undefined,'moonwick','Stirs a small constellation into every cup.',9),
  item('w-needle','Needle Lantern','weapon','Rare',['witch'],line('attack',10),[line('crit',.03)],'chain','moonwick','One spark finds a second window.',10),
  item('w-orbit','Orbiting Tealight','weapon','Legendary',['witch'],line('attack',17),[line('crit',.04),line('statusChance',.15)],'longBurn','moonwick','A patient ember remembers its promise.',11),
  item('w-shawl','Ash-Cotton Shawl','outfit','Common',['witch'],line('hp',35),[],undefined,undefined,'A soft place for a spark to land.',12),
  item('w-cape','Inkpetal Cape','outfit','Rare',['witch'],line('defense',6),[line('hp',25)],'vampiric','moonwick','A little dusk returns as a little life.',13),
  item('w-robe','Margin-Note Robe','outfit','Epic',['witch'],line('hp',55),[line('cooldown',1),line('defense',3)],'efficient','moonwick','The best spell leaves room for another.',14),
  item('w-cloak','Starry Closing Cloak','outfit','Legendary',['witch'],line('hp',75),[line('crit',.03),line('initiative',1)],'charge','moonwick','She carries the lights home with her.',15),
  item('a-bottle','Breakfast Bottle','weapon','Common',['alchemist'],line('healing',.05),[],undefined,undefined,'A reassuring clink in a canvas pocket.',16),
  item('a-spout','Rainspout Flask','weapon','Uncommon',['alchemist','witch'],line('attack',7),[line('healing',.05)],undefined,'mossbrew','Bottled rain for a dry evening.',17),
  item('a-kettle','Last-Light Pourer','weapon','Rare',['alchemist'],line('healing',.12),[line('attack',5)],'afterheal','mossbrew','There is always one warm sip left.',18),
  item('a-garden','Pocket Conservatory','weapon','Legendary',['alchemist'],line('healing',.18),[line('shield',.1),line('attack',9)],'renew','mossbrew','A whole garden travels in this bottle.',19),
  item('a-vest','Cork-Pocket Vest','outfit','Common',['alchemist'],line('hp',35),[],undefined,undefined,'Made to survive small spills.',20),
  item('a-smock','Cloverleaf Smock','outfit','Rare',['alchemist'],line('defense',7),[line('healing',.06)],'cleanseGuard','mossbrew','Leaves sewn over every old worry.',21),
  item('a-cape','Dewdrop Capelet','outfit','Epic',['alchemist'],line('hp',60),[line('shield',.1),line('initiative',1)],'neighborShield','mossbrew','A leaf is an umbrella for a smaller friend.',22),
  item('a-coat','Spring Again Coat','outfit','Legendary',['alchemist'],line('hp',75),[line('healing',.08),line('cooldown',1)],'renew','mossbrew','Even the oldest patch can bloom.',23),
  item('c-button','Pocket Button','charm','Common',all,line('defense',3),[],undefined,undefined,'Found beneath the third chair.',24),
  item('c-bell','First-Customer Bell','charm','Rare',all,line('initiative',1),[line('hp',20)],'firstStep','hearthloom','Someone is always happy you arrived.',25),
  item('c-leaf','Pressed Promise','charm','Epic',all,line('healing',.08),[line('shield',.06)],'afterheal','mossbrew','A leaf saved inside a favorite book.',26),
  item('r-wick','Borrowed Starlight Relic','relic','Rare',all,line('crit',.03),[line('attack',4)],'charge','moonwick','A small light, carried with permission.',27),
  item('r-cup','Unbroken Saucer Relic','relic','Epic',all,line('hp',45),[line('defense',4)],'neighborShield','hearthloom','The cup broke. The promise did not.',28),
  item('r-snow','Snowmelt Hearth Relic','relic','Legendary',all,line('shield',.12),[line('healing',.08),line('initiative',1)],'efficient','mossbrew','Avalanche Relic · a flavor label, locally imagined.',29),
];
export const ITEM_BY_ID:Readonly<Record<string,SquadItem>>=Object.fromEntries(SQUAD_ITEMS.map(i=>[i.id,i]));
export const SET_NAMES:Record<GearSet,string>={hearthloom:'Hearthloom',moonwick:'Moonwick',mossbrew:'Mossbrew'};
export const PROPERTY_TEXT:Record<GearProperty,string>={
  chain:'Needle shots chain once for 50% attack.',neighborShield:'A shield also grants 24 shield to the next ally in order.',
  afterheal:'Milk Flask also grants 20 shield.',firstStep:'First action each round: +1 Initiative rank in next round’s order.',
  longBurn:'Ember Orb burns for 1 additional round.',renew:'Healing skills restore an additional 18 HP.',
  efficient:'Ultimates cost 15 less charge (minimum 70).',break:'Shield Bash adds 15 additional boss stagger.',
  cleanseGuard:'Rally, Hearthwall and Moss Flask cleanse harmful effects from their recipients.',
  vampiric:'Damaging actions heal the caster for 12 HP once.',charge:'Each action grants 6 additional ultimate charge.',
  thorns:'A shielded defender returns 10 damage once per incoming action.',
};
export const SET_TEXT:Record<GearSet,readonly [string,string]>={
  hearthloom:['2 pieces: +5 defense, +12% shielding.','3 pieces: shielding also protects the next ally.'],
  moonwick:['2 pieces: +6 attack, +3% crit.','3 pieces: ultimates cost 15 less charge.'],
  mossbrew:['2 pieces: +15% healing, +25 HP.','3 pieces: healing adds 18 HP and cleanses its target.'],
};
export function formatStat(l:StatLine):string {
  const percent=['crit','healing','shield','statusChance'].includes(l.stat);
  return `+${percent?Math.round(l.value*100):l.value}${percent?'%':''} ${l.stat==='initiative'?'Initiative':l.stat==='cooldown'?'round cooldown reduction':l.stat.replace('statusChance','burn chance')}`;
}
export function describeItem(i:SquadItem):string {return [formatStat(i.main),...i.affixes.map(formatStat),i.property?PROPERTY_TEXT[i.property]:''].filter(Boolean).join(' · ')}
