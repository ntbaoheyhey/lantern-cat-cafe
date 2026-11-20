import assert from 'node:assert/strict';
export function fixtures(R,C){
const variants=['none','main','affixes','unique','set4','all'];
const trio=['mochi','soot','clover'],themes={guardian:'hearthloom',witch:'moonwick',alchemist:'mossbrew'};
function account(seed) {
 const s=R.setGameplayV4(R.createDepthAccount(seed),true);s.account.cards=trio.map(id=>({id,cardId:id,level:6,stars:1,shards:0,soulbound:true}));
 s.team=[...trio];s.gear=[];s.equipment={};s.cleared=[1,2,3];
 for(const id of trio){s.rows[id]=R.CAT_BY_ID[id].row;s.skills[id]=R.defaultSkills(s,id);
  for(const slot of C.EQUIPMENT_SLOTS){const item=R.makeGear(s,`${themes[C.CARD_BY_ID[id].role]}-${slot}-epic`,seed+C.EQUIPMENT_SLOTS.indexOf(slot)*7919);s.gear.push(item);(s.equipment[id]??={})[slot]=item.id;}}
 return s;
}
function setups(meta,seed) {
 const template=R.GEAR_BY_ID[meta.templateId],id=meta.cardId,s=account(seed);s.equipment[id]={};
 for(const slot of C.EQUIPMENT_SLOTS)if(slot!==template.slot){const g=R.makeGear(s,`${template.setId}-${slot}-epic`,seed+C.EQUIPMENT_SLOTS.indexOf(slot)*7919);s.gear.push(g);s.equipment[id][slot]=g.id;}
 const base=R.battleCats(s),power=R.teamPowerV4(s),full=structuredClone(s),g=R.makeGear(full,template.id,seed);
 full.gear.push(g);full.equipment[id][template.slot]=g.id;
 const all=R.battleCats(full),mainState=structuredClone(full),mainItem=mainState.gear.find(item=>item.id===g.id);mainItem.affixes=[];mainItem.rolls={};
 const mainStats=R.battleCats(mainState).find(c=>c.id===id).stats,before=base.find(c=>c.id===id),after=all.find(c=>c.id===id);
 const four=R.SETS.find(set=>set.id===template.setId).fourEffect;
 const isolated={none:base,all};
 for(const mode of ['main','affixes','unique','set4']){
  const cats=structuredClone(base),cat=cats.find(c=>c.id===id);cat.equipment=[...after.equipment];
  if(mode==='main')cat.stats=structuredClone(mainStats);
  if(mode==='affixes'){
   for(const key of Object.keys(cat.stats))cat.stats[key]+=after.stats[key]-mainStats[key];
   cat.bonuses=structuredClone(after.bonuses);
  }
  if(mode==='unique'&&template.unique)cat.effects=[...new Set([...cat.effects,'unique:'+template.unique])];
  if(mode==='set4')cat.effects=[...new Set([...cat.effects,four])];
  isolated[mode]=cats;
 }
 // Reconstruction checks detect accidental interference between the isolated components.
 const reconstructed=structuredClone(before);for(const key of Object.keys(reconstructed.stats))reconstructed.stats[key]=isolated.main.find(c=>c.id===id).stats[key]+isolated.affixes.find(c=>c.id===id).stats[key]-before.stats[key];
 assert.deepEqual(reconstructed.stats,after.stats);
 const effects=[...new Set([...before.effects,...isolated.unique.find(c=>c.id===id).effects,...isolated.set4.find(c=>c.id===id).effects])].sort();assert.deepEqual(effects,[...after.effects].sort());
 const value=R.teamPowerV4(full);
 return {share:(value-power)/value,setups:Object.fromEntries(variants.map(mode=>[mode,{seed,chapter:meta.chapter,challengeLevel:6,cats:isolated[mode],enemies:[R.CHAPTERS[meta.chapter-1].boss],gameplayV4:true}]))};
}

return {account,setups};}
