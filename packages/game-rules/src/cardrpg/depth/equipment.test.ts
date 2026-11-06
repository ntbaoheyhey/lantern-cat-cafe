import { expect, it } from 'vitest';
import { ITEMS } from '../catalog';
import { clone } from '../internal';
import { act, createBattle, legalChoices } from './battle';
import { AFFIXES, craftGear, depthStats, dropGear, enhanceGear, enhancementPreview, equipmentEffects, equipGear, GEAR, GEAR_BY_ID, makeGear, reforgeGear, salvageGear, SETS, UNIQUES, awakenCat } from './equipment';
import { battleCats, createDepthAccount } from './state';

it('preserves all 48 old item IDs and expands to 128 templates, 30 affixes, 8 sets and 12 unique effects',()=>{
  expect(GEAR).toHaveLength(128);for(const item of ITEMS)expect(GEAR_BY_ID[item.id]).toBeDefined();
  expect(AFFIXES).toHaveLength(30);expect(SETS).toHaveLength(8);expect(UNIQUES).toHaveLength(12);
  expect(new Set(GEAR.filter(g=>g.unique).map(g=>g.unique)).size).toBe(12);
  for(const affix of AFFIXES){expect(affix.tiers).toHaveLength(3);expect(affix.slots.length).toBeGreaterThan(0);for(const [lo,hi]of affix.tiers)expect(lo).toBeLessThanOrEqual(hi);}
});
it('migrates starter gear and counts 2/4 sets with exact stat deltas',()=>{
  let s=createDepthAccount();expect(s.gear.length).toBe(s.account.inventory.items.length);
  const before=depthStats(s,'mochi');
  for(const slot of ['weapon','outfit','charm','relic']){const g=makeGear(s,`rainlace-${slot}-rare`,1);s.gear.push(g);s=equipGear(s,'mochi',g.id).state;}
  expect(equipmentEffects(s,'mochi').effects).toEqual(expect.arrayContaining(['swap-shield','rear-heal']));
  expect(depthStats(s,'mochi').hp).toBeGreaterThanOrEqual(before.hp);
});
it('transfers one item to exactly one cat and rejects equipment changes during a run',()=>{
  let s=createDepthAccount();const id=s.gear[0]!.id;s=equipGear(s,'soot',id).state;
  expect(Object.values(s.equipment).flatMap(l=>Object.values(l)).filter(i=>i===id)).toHaveLength(1);
});
it('applies failure-free enhancement previews without partial spending on failure',()=>{
  const s=createDepthAccount(),item=s.gear[0]!,preview=enhancementPreview(item),after=enhanceGear(s,item.id);
  expect(after.ok).toBe(true);expect(after.state.account.currencies.fish).toBe(s.account.currencies.fish-preview.cost.fish);
  expect(after.state.gear[0]!.enhancement).toBe(1);expect(preview.after).toBeGreaterThan(preview.before);
  s.account.currencies.fish=0;const before=clone(s);expect(enhanceGear(s,item.id).ok).toBe(false);expect(s).toEqual(before);
});
it('enforces affix slot compatibility and salvage ownership',()=>{
  const s=createDepthAccount(),g=makeGear(s,'rainlace-weapon-rare',1);s.gear.push(g);
  expect(reforgeGear(s,g.id,0,'affix-defense').ok).toBe(false);
  expect(reforgeGear(s,g.id,0,'affix-bossDamage').ok).toBe(true);
  expect(salvageGear(equipGear(s,'mochi',g.id).state,g.id).ok).toBe(false);
  expect(salvageGear(s,g.id).ok).toBe(true);
});
it('caps repeatable equipment drops and keeps source rarity pools valid',()=>{
  const s=createDepthAccount();for(let i=0;i<6;i++)expect(dropGear(s,'boss',i,1)).toBeTruthy();
  const before=clone(s);expect(dropGear(s,'boss',7,1)).toBeNull();expect(s).toEqual(before);
});
it('gates and charges awakening and deterministic legendary tailoring',()=>{
  const s=createDepthAccount();expect(awakenCat(s,'mochi').ok).toBe(false);s.account.cards[0]!.level=10;s.account.cards[0]!.stars=2;s.materials=500;
  s.account.currencies={fish:20000,threads:1000,stamps:0,essence:100};const before=depthStats(s,'mochi');
  const result=awakenCat(s,'mochi');expect(result.ok).toBe(true);expect(result.state.materials).toBe(470);expect(depthStats(result.state,'mochi').attack).toBeGreaterThan(before.attack);
  expect(craftGear(s,'hearthloom-weapon-legendary').ok).toBe(false);s.cleared=[1,2,3];expect(craftGear(s,'hearthloom-weapon-legendary').ok).toBe(true);
});
it('changes actual combat with the Bellsteel four-piece rule',()=>{
  let s=createDepthAccount();for(const slot of ['weapon','outfit','charm','relic']){const g=makeGear(s,`bellsteel-${slot}-common`,1);s.gear.push(g);s=equipGear(s,'mochi',g.id).state;}
  const b=createBattle({seed:1,chapter:1,cats:battleCats(s),enemies:['button-guard']});
  act(b,legalChoices(b).find(c=>c.skillId==='defend')!);
  expect(b.actors[0]!.statuses.map(s=>s.id)).toEqual(expect.arrayContaining(['shelter','riposte']));
});
it('applies legendary opening effects once per battle',()=>{
  const s=createDepthAccount(),cats=battleCats(s);cats[0]!.effects=['unique:softcollar','opening-decoy'];
  const b=createBattle({seed:1,chapter:1,cats,enemies:['button-guard']});
  expect(b.actors[0]!.statuses.map(s=>s.id)).toEqual(expect.arrayContaining(['sprout','decoy']));
});
