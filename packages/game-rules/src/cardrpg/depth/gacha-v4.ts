import { Rng, deriveSeed } from '../../rng';
import { CARDS } from '../catalog';
import { CARD_RPG_CONFIG as C } from '../config';
import { RARITY_ORDER, type GachaResult } from '../contract';
import { bannerById, emptyPity, getBannerOdds, getDrawPool, pull } from '../gacha';
import { integer, progress, requireRule, spend } from '../internal';
import { GEAR, GEAR_BY_ID, makeGear } from './equipment';
import { GEAR_CAP_V4 } from './equipment-v4';
import { gameplayV4 } from './gameplay-v4';
import { CAT_BY_ID } from './catalog';
import { requireHome, transactDepth } from './state';
import type { DepthAccount } from './contract';
import type { GameplayEventV4 } from './events-v4';

export const SELECTOR_COST_V4 = 60;
export function selectorMarksV4(s: DepthAccount): number { return s.v4?.selectorMarks ?? 0; }
function safeAdd(a:number,b:number):number { requireRule(Number.isSafeInteger(a+b)&&a+b>=0,'MAX_LEVEL','This saved balance is full.');return a+b; }
function recordReveals(s:DepthAccount,results:GachaResult[]):void {
 const v=s.v4!;v.selectorMarks=safeAdd(selectorMarksV4(s),results.length);
 v.revealSequence??=0;v.reveals??=[];
 for(const r of results){
  const sequence=v.revealSequence;v.revealSequence=safeAdd(sequence,1);
  const event:GameplayEventV4={version:1,sequence,round:0,kind:'earned-reveal',bannerId:r.bannerId,draw:r.index,itemId:r.cardId??r.itemId!,rarity:r.rarity,duplicate:r.shards,pityBefore:r.pityBefore,pityAfter:r.rarity==='legendary'?0:r.pityBefore+1,text:`Earned invitation ${r.index}: ${r.cardId??r.itemId}${r.shards?` → ${r.shards} shards`:''}.`};
  v.reveals.push(event);
 }
 v.reveals=v.reveals.slice(-60);
}
/** Mutates only the enclosing atomic draft; no animation controls acquisition. */
export function drawInvitationsV4(s:DepthAccount,bannerId:string,seed:number,count=1):GachaResult[] {
 requireHome(s);requireRule(gameplayV4(s)&&!!s.v4,'NOT_READY','Enable Gameplay v4 first.');
 const b=bannerById(bannerId);let results:GachaResult[];
 requireRule(integer(count,1,C.maxBatch)&&integer(seed,0,0xffffffff),'INVALID_AMOUNT','Choose 1–10 invitations and an unsigned seed.');
 requireRule(s.account.daily.draws+count<=C.maxDrawsPerDay,'DAILY_CAP','Daily invitation limit reached.');
 safeAdd(selectorMarksV4(s),count);
 if(b.kind==='cat'){
  const r=pull(bannerId,s.account,seed,count);requireRule(r.ok,'INVALID_AMOUNT',r.ok?'':r.error.message);
  s.account=r.state;results=r.value;
 }else{
  requireRule(s.gear.length+count<=GEAR_CAP_V4,'MAX_LEVEL','Make room for the entire basket before spending.');
  spend(s.account,Object.fromEntries(Object.entries(b.cost).map(([k,v])=>[k,v*count])));
  const pity=s.account.pity[b.pityGroup]??=emptyPity(),rng=new Rng(deriveSeed(seed,pity.totalPulls));results=[];
  for(let n=0;n<count;n++){
   const oddsBp=getBannerOdds(b,pity),rarity=rng.weighted(oddsBp,RARITY_ORDER);
   let pool=GEAR.filter(g=>g.rarity===rarity);const fresh=pool.filter(g=>!s.gear.some(i=>i.templateId===g.id));if(fresh.length)pool=fresh;
   const template=pool[rng.int(0,pool.length-1)]!,duplicate=s.gear.some(g=>g.templateId===template.id);
   const gear=makeGear(s,template.id,deriveSeed(seed,s.account.nextId));s.gear.push(gear);
   const result:GachaResult={index:safeAdd(pity.totalPulls,1),bannerId,rarity,itemId:template.id,instanceId:gear.id,duplicate,shards:0,pityBefore:pity.sinceLegendary,oddsBp,soulbound:true,tradeable:false};
   pity.totalPulls=result.index;pity.sinceLegendary=rarity==='legendary'?0:pity.sinceLegendary+1;s.account.daily.draws++;
   results.push(result);s.account.history.push(result);progress(s.account,'draws');
  }
  s.account.history=s.account.history.slice(-C.historyLimit);
 }
 for(const c of s.account.cards){requireRule(Number.isSafeInteger(c.shards),'MAX_LEVEL','Shard balance is full.');if(!s.skills[c.cardId]){s.skills[c.cardId]=CAT_BY_ID[c.cardId]!.skills.slice(0,3).map(k=>k.id);s.rows[c.cardId]=CAT_BY_ID[c.cardId]!.row;}}
 recordReveals(s,results);return results;
}
export function getDrawPoolV4(s:DepthAccount,bannerId:string){
 const b=bannerById(bannerId);if(b.kind==='cat')return getDrawPool(s.account,bannerId);
 const odds=getBannerOdds(b,s.account.pity[b.pityGroup]??emptyPity());
 return RARITY_ORDER.flatMap(rarity=>{const pool=GEAR.filter(g=>g.rarity===rarity),fresh=pool.filter(g=>!s.gear.some(i=>i.templateId===g.id)),actual=fresh.length?fresh:pool;return actual.map(g=>({id:g.id,rarity,probability:odds[rarity]/10000/actual.length}));});
}
export function selectorEligibilityV4(s:DepthAccount,kind:'cat'|'gear',id:string):string|null {
 if(!gameplayV4(s)||!s.v4)return 'Enable Gameplay v4 first.';
 if(s.run&&!s.run.complete)return 'Finish the current route.';
 if(selectorMarksV4(s)<SELECTOR_COST_V4)return `Earn ${SELECTOR_COST_V4-selectorMarksV4(s)} more selector marks.`;
 if(kind==='cat'){
  if(!CARDS.some(c=>c.id===id))return 'Choose a companion.';
  if(s.account.cards.some(c=>c.cardId===id)&&!CARDS.every(c=>s.account.cards.some(o=>o.cardId===c.id)))return 'Choose an uncollected companion first.';
 }else{
  const g=GEAR_BY_ID[id];if(!g)return 'Choose an equipment template.';
  if(s.gear.length>=GEAR_CAP_V4)return 'The equipment shelf is full (240).';
  if(s.account.chapter<g.chapter)return `Reach chapter ${g.chapter}.`;
  if(g.rarity==='legendary'&&!s.masteries.includes(g.chapter))return `Complete chapter ${g.chapter} mastery for this legendary template.`;
 }
 return null;
}
export function chooseSelectorV4(state:DepthAccount,kind:'cat'|'gear',id:string){return transactDepth(state,s=>{
 requireRule(kind==='cat'||kind==='gear','INVALID_AMOUNT','Choose companion or equipment.');
 const reason=selectorEligibilityV4(s,kind,id);requireRule(!reason,'NOT_READY',reason??'');
 if(kind==='cat'){
  const cat=CARDS.find(c=>c.id===id)!,owned=s.account.cards.find(c=>c.cardId===id);
  if(owned)owned.shards=safeAdd(owned.shards,C.rarity[cat.rarity].shards);
  else{s.account.cards.push({id,cardId:id,level:1,stars:1,shards:0,soulbound:true});s.account.loadouts[id]={};s.rows[id]=CAT_BY_ID[id]!.row;s.skills[id]=CAT_BY_ID[id]!.skills.slice(0,3).map(k=>k.id);}
 }else s.gear.push(makeGear(s,id,deriveSeed(s.account.seed,s.account.nextId)));
 s.v4!.selectorMarks=selectorMarksV4(s)-SELECTOR_COST_V4;
});}
