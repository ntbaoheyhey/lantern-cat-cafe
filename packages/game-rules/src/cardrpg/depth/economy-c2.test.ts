import {expect,it} from 'vitest';
import * as R from './index';
import {RECIPES} from '../catalog';
import {CARD_RPG_CONFIG} from '../config';
import {Rng} from '../../rng';
import {clone} from '../internal';

const fresh=()=>R.setFormationC2(R.setGameplayA6(R.setGameplayV4(R.createDepthAccount(90001,0),true),true));
it('keeps Bellsteel Riposte bounded without adding a gear taunt, preserving native Panko and legacy replays',()=>{
 for(const c2 of [true,false])for(const cardId of ['mochi','panko']){
  const s=fresh(),setup={seed:71,chapter:1,cats:R.battleCats(s),enemies:['button-guard'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:c2};
  const battle=R.createBattle(setup),mochi=battle.actors.find(a=>a.id===cardId)!;
  mochi.setEffects=['defend-riposte'];
  for(let turn=0;turn<2;turn++){
   battle.queue=[mochi.id];mochi.cooldowns={};mochi.statuses=[];
   expect(R.act(battle,{actorId:mochi.id,skillId:'defend',targetId:mochi.id})).toBe(true);
   expect(mochi.statuses.some(s=>s.id==='shelter')).toBe(!c2);
   const native=cardId==='panko'?1:0,equipment=!c2||turn===0?1:0;
   expect(mochi.statuses.find(s=>s.id==='riposte')?.stacks??0).toBe(native+equipment);
  }
  const next=R.createBattle(setup).actors.find(a=>a.id===cardId)!;
  expect(next.bonuses.bellsteelShelters).toBeUndefined();
  expect(next.bonuses.bellsteelRipostes).toBeUndefined();
 }
});
it('bounds the Rain Bell to one debuff stack per swap and preserves the legacy full-status cleanse',()=>{
 for(const c2 of [true,false]){
  const s=fresh();s.account.cards.forEach(c=>{c.level=6;c.stars=1;});
  const b=R.createBattle({seed:71,chapter:1,cats:R.battleCats(s),enemies:['button-guard'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:c2});
  const actor=b.actors.find(a=>a.id==='mochi')!,source=b.actors.find(a=>a.side==='enemy')!;
  actor.setEffects=['unique:rainbell'];actor.statuses=[{id:'scald',stacks:3,remaining:3,source:source.id},{id:'scent',stacks:1,remaining:2,source:source.id}];
  b.queue=[actor.id];b.energy=10;actor.cooldowns={};
  const choice=R.legalChoices(b).find(c=>c.skillId==='mochi-3'&&c.targetId!==actor.id);
  expect(choice).toBeDefined();expect(R.act(b,choice!)).toBe(true);
  expect(actor.statuses.find(s=>s.id==='scald')?.stacks??0).toBe(c2?2:0);
  expect(actor.statuses.find(s=>s.id==='scent')?.stacks).toBe(1);
 }
});
it('quotes the C2 Rain Bell stack limit and Bellsteel trigger without changing legacy item text',()=>{
 expect(R.gearStoryV4('hearthloom-relic-legendary',true)).toBe('Swapping clears 1 debuff stack.');
 expect(R.effectTextV4('unique:rainbell',true)).toBe(R.gearStoryV4('hearthloom-relic-legendary',true));
 expect(R.gearStoryV4('hearthloom-relic-legendary')).toBe('Swapping clears one of your debuffs.');
 const set=R.SETS.find(s=>s.id==='bellsteel')!;
 expect(R.setTextV4(set,true,true).four).toBe('Defend: Riposte 1× per battle.');
 expect(R.setTextV4(set,true,false).four).toContain('Shelter');
});
it('discloses normalized live source odds, including exhausted daily drops and exact templates',()=>{
 const s=fresh();
 for(const kind of ['battle','elite','boss'] as const)for(const chapter of [1,2,3]){
  const q=R.gearDropPreview(s,kind,chapter);
  expect(Object.values(q.base).reduce<number>((n,x)=>n+x,0)).toBe(10000);
  expect(q.pool.reduce((n,x)=>n+x.probability,0)).toBeCloseTo(1,12);
  expect(q.pool.every(p=>R.GEAR_BY_ID[p.id]!.chapter<=chapter)).toBe(true);
 }
 for(let i=0;i<6;i++)expect(R.dropGear(s,'boss',i,1)).not.toBeNull();
 expect(R.dropGear(s,'boss',7,1)).toBeNull();
 const q=R.gearDropPreview(s,'boss',1);expect(q.remaining).toBe(0);
 expect(q.pool.every(p=>p.probability===0)).toBe(true);
});
it('preserves the legacy rarity roll order and template pool for old saves',()=>{
 for(const kind of ['battle','elite','boss'] as const)for(let seed=1;seed<=80;seed++){
  const s=R.setGameplayV4(R.createDepthAccount(seed,0),true),rng=new Rng(seed),roll=rng.int(0,9999);
  const rarity=kind==='boss'?(roll<1000?'legendary':roll<8000?'epic':'rare'):kind==='elite'?(roll<300?'legendary':roll<3000?'epic':'rare'):(roll<500?'epic':roll<3500?'rare':'common');
  const pool=R.GEAR.filter(g=>g.chapter<=2&&g.rarity===rarity);
  expect(R.dropGear(s,kind,seed,2)).toBe(pool[rng.int(0,pool.length-1)]!.id);
 }
});
it('keeps the earned 24-pull guarantee and separate cat price when pacing gear invitations',()=>{
 const s=fresh();s.account.currencies.stamps=10000;
 const b=R.invitationBannerV4('equipment',s);
 expect(b.cost.stamps).toBe(R.ECONOMY_C2.equipmentInvitation.stamps);
 expect(R.invitationBannerV4('standard',s).cost.stamps).toBe(60);
 s.account.pity[b.pityGroup]={sinceLegendary:23,totalPulls:23,featuredGuaranteed:false};
 const q=R.metaCommand(s,{type:'pull',bannerId:'equipment',seed:7,count:1});
 expect(q.ok).toBe(true);expect(q.state.account.history.at(-1)!.rarity).toBe('legendary');
 expect(s.account.currencies.stamps-q.state.account.currencies.stamps).toBe(b.cost.stamps);
 expect(R.getDrawPoolV4(s,'equipment').every(p=>p.probability===0||p.rarity==='legendary')).toBe(true);
});
it('uses the same advertised tailoring cost through the legacy recipe entry point',()=>{
 const s=fresh();s.account.chapter=3;s.account.currencies={fish:10000,threads:10000,stamps:10000,essence:1000};
 const recipe=RECIPES.find(r=>r.outputItemId&&R.GEAR_BY_ID[r.outputItemId]?.rarity==='epic')!;
 expect(recipe).toBeDefined();
 const before=clone(s),direct=R.craftGear(s,recipe.outputItemId!),oldEntry=R.metaCommand(s,{type:'forge',recipeId:recipe.id});
 expect(oldEntry.ok).toBe(true);expect(oldEntry.state).toEqual(direct.state);expect(s).toEqual(before);
 for(const [key,n] of Object.entries(R.gearCostV4(recipe.outputItemId!,s)))expect(s.account.currencies[key as keyof typeof s.account.currencies]-direct.state.account.currencies[key as keyof typeof s.account.currencies]).toBe(n);
});
it('consumes ten distinct seals atomically, without accepting a forged balance as an extra receipt',()=>{
 const s=fresh();s.account.chapter=3;s.cleared=[1,2,3];s.materials=200;s.seals=10;
 s.account.currencies={fish:10000,threads:10000,stamps:10000,essence:1000};s.v4!.legacySealCount=0;
 for(let day=1;day<=9;day++)s.account.inventory.stacks[`depth-seal-${day}`]=1;
 const id='hearthloom-weapon-legendary';expect(R.craftGear(s,id).state).toBe(s);
 s.account.inventory.stacks['depth-seal-10']=1;
 const before=clone(s),q=R.craftGear(s,id);
 expect(q.ok).toBe(true);expect(q.state.v4!.spentEffortIds).toHaveLength(10);
 expect(new Set(q.state.v4!.spentEffortIds).size).toBe(10);expect(q.state.seals).toBe(0);expect(q.state.materials).toBe(0);expect(s).toEqual(before);
 s.account.currencies.essence=0;expect(R.craftGear(s,id).state).toBe(s);
});
it('prices Legendary selectors at their own quoted mark cost, keeping cat choices unchanged',()=>{
 const s=fresh();s.masteries=[1];s.v4!.selectorMarks=71;
 const id='hearthloom-weapon-legendary';expect(R.selectorCostV4(s,'gear',id)).toBe(72);
 expect(R.selectorCostV4(s,'cat','mochi')).toBe(24);expect(R.chooseSelectorV4(s,'gear',id).state).toBe(s);
 s.v4!.selectorMarks=72;const q=R.chooseSelectorV4(s,'gear',id);expect(q.ok).toBe(true);
 expect(q.state.v4!.selectorMarks).toBe(0);expect(q.state.account.pity).toEqual(s.account.pity);
});
it('recovers a useful full-shelf drop even after the earned-thread cap is exhausted',()=>{
 const s=fresh();while(s.gear.length<R.GEAR_CAP_V4)s.gear.push(R.makeGear(s,R.GEAR[0]!.id,s.gear.length));
 s.account.daily.earned.threads=R.depthCaps(s).threads;
 const seed=61,rng=new Rng(seed),roll=rng.int(0,9999),b=R.ECONOMY_C2.drops.battle;
 const rarity=roll<b.epic?'epic':roll<b.epic+b.rare?'rare':'common',before=s.account.currencies.threads;
 expect(R.dropGear(s,'battle',seed,1)).toBeNull();expect(s.gear).toHaveLength(R.GEAR_CAP_V4);
 expect(s.account.currencies.threads-before).toBe(CARD_RPG_CONFIG.rarity[rarity].salvage);
});
