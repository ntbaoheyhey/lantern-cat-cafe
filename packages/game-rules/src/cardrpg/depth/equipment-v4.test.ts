import { describe,expect,it } from 'vitest';
import { clone } from '../internal';
import { EQUIPMENT_SLOTS, RARITY_ORDER } from '../contract';
import * as R from './index';
const fresh=()=>R.setGameplayV4(R.createDepthAccount(71),true);
function rich(){const s=fresh();s.account.currencies={fish:100000,threads:10000,stamps:10000,essence:1000};s.account.chapter=3;s.cleared=[1,2,3];s.materials=100;s.seals=5;return s;}
function fill(s:R.DepthAccount,n=240){while(s.gear.length<n)s.gear.push(R.makeGear(s,'hearthloom-weapon-common',s.gear.length));return s;}
function code(s:R.DepthAccount,prefix=8){const payload=JSON.stringify(s);return `THC${prefix}.${R.saveChecksum(payload)}.${payload}`;}
function route(){return R.startRun(fresh(),1,81).state;}
describe('v4 equipment safety and compatibility',()=>{
 it('keeps each main stat bounded at every level and all four rarities strictly ordered',()=>{
  for(const level of [1,3,6,10,20,50])for(const slot of EQUIPMENT_SLOTS){
   const s=fresh();s.account.cards[0]!.level=level;
   const naked=R.rawPowerV4(R.nakedStatsV4(s,'mochi'));let last=-1;
   for(const rarity of RARITY_ORDER){const item=R.makeGear(s,`hearthloom-${slot}-${rarity}`,1),template=R.GEAR_BY_ID[item.templateId]!;
    const value=R.gearMainV4(s,'mochi',item);expect(value).toBeGreaterThan(last);last=value;
    item.enhancement=12;const weight=template.main==='attack'?2:template.main==='defense'?1.5:.2;
    expect(R.gearMainV4(s,'mochi',item)*weight).toBeLessThanOrEqual(naked*.08);
   }
  }
 });
 it('applies the selected mode rather than changing the legacy stat path',()=>{
  const old=R.createDepthAccount(71),on=R.setGameplayV4(old,true);
  const off=R.setGameplayV4(on,false);expect(R.depthStats(off,'mochi')).toEqual(R.depthStats(old,'mochi'));
  expect(R.depthStats(on,'mochi')).not.toEqual(R.depthStats(old,'mochi'));
 });
 it('compares on clones and counts a transfer loss in crew score',()=>{
  const s=fresh(),piece=R.equippedItems(s,'mochi')[0]!,before=clone(s);
  const preview=R.comparisonV4(s,'soot',piece.id)!;expect(preview.transfer).toBe('mochi');expect(s).toEqual(before);
  expect(preview.teamAfter).toBe(R.teamPowerV4(R.equipGear(s,'soot',piece.id).state));
 });
 it.each([2,4])('reports the donor bonus actually lost at the %i-piece threshold',count=>{
  let s=rich();s.gear=[];s.equipment={};
  for(const slot of EQUIPMENT_SLOTS.slice(0,count)){
   const item=R.makeGear(s,`hearthloom-${slot}-${slot==='weapon'?'legendary':'epic'}`,71);s.gear.push(item);s=R.equipGear(s,'mochi',item.id).state;
  }
  const piece=s.equipment.mochi!.weapon!,before=clone(s),preview=R.comparisonV4(s,'soot',piece)!,applied=R.equipGear(s,'soot',piece);
  expect(applied.ok).toBe(true);expect(s).toEqual(before);
  const lost=R.equipmentEffects(s,'mochi').effects.filter(e=>!R.equipmentEffects(applied.state,'mochi').effects.includes(e));
  expect(preview.transferLost).toEqual(lost);expect(lost).toEqual(['unique:doorstop',count===2?'defend-shield':'defend-link']);
  expect(preview.gained).toContain('unique:doorstop');expect(preview.teamAfter).toBe(R.teamPowerV4(applied.state));
  const same=R.comparisonV4(applied.state,'soot',piece)!;expect(same.transferLost).toEqual([]);expect(same.gained).toEqual([]);
 });
 it('restores a whole preset, transfers each item once, and preserves its plan',()=>{
  let s=fresh();s.v4!.plan={focus:'support',care:'protect'};
  s=R.saveLoadoutV4(s,0,'Quiet evening').state;const saved=clone(s.equipment),piece=R.equippedItems(s,'mochi')[0]!;
  s=R.equipGear(s,'soot',piece.id).state;s.v4!.plan.focus='leader';
  const applied=R.applyLoadoutV4(s,0);expect(applied.ok).toBe(true);expect(applied.state.equipment).toEqual(saved);expect(applied.state.v4!.plan.focus).toBe('support');
  expect(Object.values(applied.state.equipment).flatMap(Object.values).filter(id=>id===piece.id)).toHaveLength(1);
 });
 it('fails a missing or mismatched saved piece without any partial unequip or spend',()=>{
  let s=R.saveLoadoutV4(fresh(),0,'Night').state;const id=Object.values(s.v4!.loadouts![0]!.equipment.mochi!)[0]!;
  s=R.equipGear(s,'mochi',null,'weapon').state;s.gear=s.gear.filter(g=>g.id!==id);const before=clone(s);
  expect(R.applyLoadoutV4(s,0)).toMatchObject({ok:false,state:before});expect(R.previewLoadoutV4(s,0).ok).toBe(false);
 });
 it('rejects presets during a route and invalid slot/name input',()=>{
  const s=route();expect(R.saveLoadoutV4(s,0,'Shift').ok).toBe(false);
  for(const [slot,name]of [[-1,'A'],[3,'B'],[0,' '],[0,'x'.repeat(41)]] as const)expect(R.saveLoadoutV4(fresh(),slot,name).ok).toBe(false);
 });
 it('rejects crafting and the whole draw batch before advancing IDs or spending',()=>{
  const s=fill(rich(),239),before=clone(s);
  expect(R.metaCommand(s,{type:'pull',bannerId:'equipment',seed:22,count:2})).toMatchObject({ok:false,state:before});
  fill(s);const full=clone(s);expect(R.craftGear(s,'hearthloom-weapon-legendary')).toMatchObject({ok:false,state:full});
  expect(R.metaCommand(s,{type:'forge',recipeId:'sew-hearthloom-weapon'})).toMatchObject({ok:false,state:full});
 });
 it('converts mandatory full-shelf drops inside the daily threads cap without allocating IDs',()=>{
  const s=fill(fresh()),id=s.account.nextId;s.account.daily.earned.threads=88;const threads=s.account.currencies.threads;
  for(let seed=0;seed<7;seed++)expect(R.dropGear(s,'boss',seed,1)).toBeNull();
  expect(s.gear).toHaveLength(240);expect(s.account.nextId).toBe(id);expect(s.account.daily.earned.threads).toBe(90);expect(s.account.currencies.threads-threads).toBe(2);
  expect(s.account.inventory.stacks[`depth-drops-${s.account.day}`]).toBe(6);
 });
 it('imports over-cap old saves intact and does not truncate gear or stacks',()=>{
  const s=fill(rich(),243);s.account.inventory.stacks['shield-biscuit']=25;
  const loaded=R.importSave(code(s));expect(loaded).toEqual(s);
  expect(R.craftGear(loaded,'hearthloom-outfit-common').ok).toBe(false);
  expect(R.metaCommand(loaded,{type:'forge',recipeId:'pantry-shield-biscuit'}).ok).toBe(false);
 });
 it('round trips THC9 presets and imports THC8, while legacy-only exports remain THC7',()=>{
  const s=R.saveLoadoutV4(fresh(),2,'Dawn').state;
  expect(R.exportSave(s).startsWith('THC13.')).toBe(true);expect(R.importSave(R.exportSave(s))).toEqual(s);expect(R.importSave(code(s))).toEqual(s);
  expect(R.exportSave(R.createDepthAccount()).startsWith('THC7.')).toBe(true);
  const off=R.setGameplayV4(s,false);expect(R.importSave(R.exportSave(off)).v4).toEqual(s.v4);
 });
 it('rejects malformed preset maps and duplicate live gear identities',()=>{
  const s=R.saveLoadoutV4(fresh(),0,'Night').state;
  s.v4!.loadouts![0]!.equipment.mochi={weapon:'missing',outfit:'missing'};expect(()=>R.importSave(code(s))).toThrow();
  const duplicate=fresh();duplicate.gear.push(clone(duplicate.gear[0]!));expect(()=>R.importSave(code(duplicate))).toThrow();
 });
 it('enforces pantry/key/ribbon caps without consuming currency or materials',()=>{
  const s=rich();s.account.inventory.stacks['pantry-key']=99;
  expect(R.metaCommand(s,{type:'forge',recipeId:'mend-pantry-key'})).toMatchObject({ok:false,state:s});
  s.account.inventory.stacks['shield-biscuit']=20;expect(R.metaCommand(s,{type:'forge',recipeId:'pantry-shield-biscuit'})).toMatchObject({ok:false,state:s});
  s.account.inventory.stacks['cafe-ribbon']=1;expect(R.metaCommand(s,{type:'forge',recipeId:'cafe-ribbon'}).ok).toBe(false);
 });
});
describe('pantry before an automatic encounter',()=>{
 it('reserves, replaces and returns exactly one supply; failed replacement is atomic',()=>{
  let s=route();s.account.inventory.stacks['shield-biscuit']=2;s.account.inventory.stacks['cleanse-tea']=1;
  s=R.packSupplyV4(s,'shield-biscuit','mochi').state;expect(s.account.inventory.stacks['shield-biscuit']).toBe(1);
  expect(R.packSupplyV4(s,'quicken-yarn','soot')).toMatchObject({ok:false,state:s});
  s=R.packSupplyV4(s,'cleanse-tea','soot').state;expect(s.account.inventory.stacks['shield-biscuit']).toBe(2);
  expect(s.account.inventory.stacks['cleanse-tea']).toBe(0);s=R.packSupplyV4(s,null,'soot').state;
  expect(s.account.inventory.stacks['cleanse-tea']).toBe(1);expect(s.run!.packedSupply).toBeUndefined();
 });
 it('preserves the selected supply across prepare rebuilds, consumes it once at Fight, and blocks in-fight use',()=>{
  let s=route();s.account.inventory.stacks['shield-biscuit']=1;s=R.packSupplyV4(s,'shield-biscuit','mochi').state;
  s=R.enterNode(s,'0-0').state;const shield=s.run!.battle!.actors[0]!.shield;
  s=R.configurePreparation(s,s.team,s.rows,{focus:'leader',care:'protect'}).state;
  expect(s.run!.battle!.actors[0]!.shield).toBe(shield);expect(s.run!.battle!.initial.packedSupply?.id).toBe('shield-biscuit');
  s=R.commitPreparation(s).state;expect(s.run!.packedSupply).toBeUndefined();expect(R.packSupplyV4(s,'shield-biscuit','mochi').ok).toBe(false);
  const abandoned=R.abandonRun(s).state;expect(abandoned.account.inventory.stacks['shield-biscuit']).toBe(0);
 });
 it('refunds an uncommitted preparation and rejects useless milk without spending',()=>{
  let s=route();s.account.inventory.stacks['milk-tonic']=1;
  expect(R.packSupplyV4(s,'milk-tonic','mochi').ok).toBe(false);s.run!.hp.mochi!-=80;
  s=R.packSupplyV4(s,'milk-tonic','mochi').state;expect(s.account.inventory.stacks['milk-tonic']).toBe(0);expect(s.run!.hp.mochi).toBe(R.battleCats(s)[0]!.stats.hp);
  s.account.inventory.stacks['cleanse-tea']=1;s=R.packSupplyV4(s,'cleanse-tea','mochi').state;s=R.enterNode(s,'0-0').state;
  expect(R.abandonRun(s).state.account.inventory.stacks['cleanse-tea']).toBe(1);
 });
 it('caps packed route tonics at five before spending run points',()=>{
  const s=route(),run=s.run!;run.current=run.nodes.find(n=>n.kind==='shop')!.id;run.supplies=5;run.points=100;
  expect(R.resolveNode(s,'tonic')).toMatchObject({ok:false,state:s});
 });
 it('keeps crafting and salvage cycles value-losing over deterministic repeated purchases',()=>{
  let s=rich();const before=s.account.currencies.threads,fish=s.account.currencies.fish;
  for(let i=0;i<50;i++){const made=R.craftGear(s,'hearthloom-weapon-rare');expect(made.ok).toBe(true);s=made.state;s=R.salvageGear(s,s.gear.at(-1)!.id).state;}
  expect(s.account.currencies.threads).toBeLessThan(before);expect(s.account.currencies.fish).toBe(fish-50*180);
 });
});

describe('bounded gear triggers',()=>{
 it('records the actual v4 Defend gear contribution and preserves the legacy effect',()=>{
  for(const v4 of [false,true]){
   const s=fresh(),cats=R.battleCats(s);cats[0]!.stats.healingBp=0;cats[0]!.stats.shieldBp=0;cats[0]!.effects=['defend-shield','unique:doorstop'];cats[0]!.equipment=['hearthloom-weapon-legendary'];
   const b=R.createBattle({seed:73,chapter:1,cats,enemies:['yarn-giant'],...(v4?{gameplayV4:true}:{} )});b.actors[0]!.hp-=50;
   const before=b.actors[0]!.hp;
   expect(R.act(b,R.legalChoices(b).find(c=>c.actorId==='mochi'&&c.skillId==='defend')!)).toBe(true);
   expect(b.actors[0]!.hp-before).toBe(v4?8:25);
   if(v4)expect(b.v4!.events.filter(e=>e.kind==='gear-trigger').map(e=>e.amount)).toEqual([12,8]);else expect(b.v4).toBeUndefined();
  }
 });
 it('first-debuff tea blocks only one applied debuff and remains replay deterministic',()=>{
  const s=fresh(),b=R.createBattle({seed:7,chapter:1,cats:R.battleCats(s),enemies:['yarn-giant'],gameplayV4:true,packedSupply:{id:'cleanse-tea',catId:'mochi'}});
  const target=b.actors[0]!,source=b.actors.at(-1)!;source.effectHit=100000;
  for(let i=0;i<10&&target.bonuses.pantryCleanse;i++)R.applyStatus(b,source,target,'scald');
  expect(target.bonuses.pantryCleanse).toBe(0);expect(target.statuses.some(s=>s.id==='scald')).toBe(false);
  for(let i=0;i<10&&!target.statuses.some(s=>s.id==='scald');i++)R.applyStatus(b,source,target,'scald');
  expect(target.statuses.some(s=>s.id==='scald')).toBe(true);
 });
});
