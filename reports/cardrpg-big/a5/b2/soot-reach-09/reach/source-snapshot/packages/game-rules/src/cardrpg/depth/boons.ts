import type { Battle, Boon } from './contract';
const groups: Array<[string, Array<[string,string,string,number]>]> = [
  ['shelter',[
    ['Door mat','openingShield','Start every encounter with 25 shield per cat.',25],
    ['Spare saucer','defendCharge','Defend grants 8 extra ultimate charge.',8],
    ['Soft lining','shieldHeal','Shield skills also heal their recipient for 8 HP.',8],
    ['Crust edge','shieldStrike','Direct hits deal 10 extra raw damage while you have a shield.',10],
    ['Shared apron','roundShield','Front-row cats gain 10 shield each round.',10],
  ]],
  ['garden',[
    ['Patient kettle','healing','Healing skills restore 12 extra HP.',12],
    ['Second leaves','steepPower','Each Steep stack heals 6 extra HP at round end.',6],
    ['Cup overflow','overhealShield','20% of unused healing becomes shield.',20],
    ['Clean strainer','healCleanse','Healing skills remove one dispellable debuff.',1],
    ['Fresh shoots','openingSteep','Begin each encounter with one Steep stack.',1],
  ]],
  ['ember',[
    ['Hot coaster','scaldPower','Each Scald stack deals 5 extra HP damage per round.',5],
    ['Red kettle','scaldCharge','Hitting a Scalded foe grants 4 extra ultimate charge.',4],
    ['Sugar crack','scaldBrittle','Applying Scald also applies one Brittle stack.',1],
    ['Long steep','scaldDuration','Scald lasts one extra round.',1],
    ['Cinder crumb','scaldCrumb','Applying Scald also plants one Crumb trail.',1],
  ]],
  ['trail',[
    ['Crumb tin','detonatePower','Detonation deals 8 extra damage per consumed stack.',8],
    ['Loose stitch','breakPressure','The first direct hit by each cat each round adds 1 break.',1],
    ['Rung bell','breakEnergy','The first enemy broken each round restores 1 energy.',1],
    ['Paper tag','markCrumb','Applying Scented also plants one Crumb trail.',1],
    ['Sweep brush','detonateSplash','Detonation deals 12 damage to each other living foe.',12],
  ]],
  ['night',[
    ['Late candle','openingCharge','Begin each encounter with 12 extra ultimate charge.',12],
    ['Returned wick','ultimateEnergy','Using an ultimate restores 1 energy after its cost.',1],
    ['Quiet velvet','killHeal','Defeating a foe heals the acting cat for 20 HP.',20],
    ['Back shelf','rearDamage','Rear-row cats deal 8 extra raw damage.',8],
    ['Soft moon','tangleRattle','Applying Tangle also applies one Rattled stack.',1],
  ]],
  ['flow',[
    ['Full pot','roundEnergy','Gain 1 extra shared energy each round.',1],
    ['Small sip','waitHeal','Pour energy also heals its user for 22 HP.',22],
    ['Measured cup','healCharge','A healing skill grants its user 5 charge.',5],
    ['Passing tray','swapShield','Row swapping grants both cats 22 shield.',22],
    ['Clear pour','cleanseEnergy','A cleanse that removes a debuff restores 1 energy once per action.',1],
  ]],
];
export const BOONS: Boon[] = groups.flatMap(([archetype,entries])=>entries.map(([name,trigger,description,value],i)=>({id:`${archetype}-${i+1}`,name,trigger,description,value,archetype,cap:2})));
export const BOON_BY_ID = Object.fromEntries(BOONS.map(b=>[b.id,b])) as Record<string,Boon>;
const replacements: Record<string, { trigger: string; value: number; description: string }> = {
  'shelter-2': { trigger:'defendHeal',value:8,description:'Defend restores up to 8 missing HP.' },
  'ember-2': { trigger:'scaldHeal',value:4,description:'The first hit each round on a Scalded foe restores 4 HP.' },
  'trail-2': { trigger:'markedDirect',value:1,description:'Direct hits against marked foes gain 1 raw damage.' },
  'trail-3': { trigger:'markedShield',value:6,description:'The first marked hit each round grants its user 6 shield.' },
  'night-1': { trigger:'openingShield',value:12,description:'Start every encounter with 12 extra shield.' },
  'night-2': { trigger:'ultimateShield',value:6,description:'An automatic ultimate grants its user 6 shield.' },
  'flow-1': { trigger:'roundShield',value:6,description:'Front-row cats gain 6 shield each round.' },
  'flow-2': { trigger:'defendHeal',value:11,description:'Defend restores up to 11 missing HP.' },
  'flow-3': { trigger:'healShield',value:5,description:'The first healed ally per action also gains 5 shield.' },
  'flow-5': { trigger:'cleanseExtraShield',value:6,description:'The first successful cleanse per action grants 6 shield.' },
};
export function boonForMode(id: string, enabled: boolean): Boon {
  const base=BOON_BY_ID[id]!;
  return enabled&&replacements[id]?{...base,...replacements[id]}:base;
}
export function boonValue(battle: Pick<Battle,'boons'> & Partial<Pick<Battle,'initial'>>, trigger: string): number {
  return Object.entries(battle.boons).reduce((total,[id,count])=>{
    const b=boonForMode(id,battle.initial?.gameplayV4===true);return total+(b?.trigger===trigger?b.value*Math.min(b.cap,count):0);
  },0);
}
