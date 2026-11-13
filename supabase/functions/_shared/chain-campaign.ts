import {createDepthAccount,metaCommand} from '../../../packages/game-rules/src/cardrpg/depth/state.ts';
import {setGameplayA6} from '../../../packages/game-rules/src/cardrpg/depth/gameplay-a6.ts';
import {startRun,enterNode,commitPreparation,finishEncounter,chooseReward,resolveNode,abandonRun} from '../../../packages/game-rules/src/cardrpg/depth/run.ts';
import {playBattle} from '../../../packages/game-rules/src/cardrpg/depth/policies.ts';
import {equipGear,salvageGear} from '../../../packages/game-rules/src/cardrpg/depth/equipment.ts';
import {syncCalendarDay,claimIdleService} from '../../../packages/game-rules/src/cardrpg/depth/bridge.ts';
import {TRADE_BY_ID,TRADE_POLICY} from '../../../packages/game-rules/src/cardrpg/trade.ts';
import type {DepthAccount,RuleResult} from '../../../packages/game-rules/src/cardrpg/depth/contract.ts';
import type {CampaignCommand,CampaignRequest} from '../../../packages/chain/src/campaign.ts';
export type {CampaignCommand,CampaignRequest} from '../../../packages/chain/src/campaign.ts';

// Server-only journal. No browser state, victory, seed, clock, stats or amount
// enters the authority. It remains disabled until its transport is integrated.
export const CAMPAIGN_SOURCE='campaign-journal-v1';
export interface CampaignOrigin {item:string;level:number;at:string}
export interface CampaignState {game:DepthAccount;origins:Record<string,CampaignOrigin>;starts?:{utcDay:number;count:number}}
export interface CampaignSnapshot {revision:number;rules_hash:string;state:CampaignState;updated_at:string}
export interface CampaignReceipt {request_hash:string;snapshot:CampaignSnapshot;inventory_id:string|null}
export interface CampaignCommit {
  player:string;wallet:string;rules:string;id:string;requestHash:string;revision:number;
  state:CampaignState;exportInstance:string|null;
}
export interface CampaignStore {
  boot(player:string,wallet:string,rules:string,state:CampaignState):Promise<CampaignSnapshot>;
  receipt(player:string,wallet:string,id:string):Promise<CampaignReceipt|null>;
  commit(input:CampaignCommit):Promise<CampaignReceipt>;
}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const label=(v:unknown)=>typeof v==='string'&&v.length>0&&v.length<=160&&v.trim()===v;
export function campaignRequest(value:unknown):CampaignRequest {
  const bad=()=>{throw new Error('campaign_request');};
  if(!object(value)||Object.keys(value).sort().join(',')!=='command,id,revision'||
    typeof value.id!=='string'||!uuid.test(value.id)||!Number.isSafeInteger(value.revision)||Number(value.revision)<0||!object(value.command))return bad();
  const c=value.command;
  let keys:string[];
  switch(c.type){
    case 'start': if(!Number.isInteger(c.chapter)||Number(c.chapter)<1||Number(c.chapter)>3)return bad();keys=['type','chapter'];break;
    case 'enter':if(!label(c.node))return bad();keys=['type','node'];break;
    case 'fight':case 'abandon':case 'idle':keys=['type'];break;
    case 'reward':if(!label(c.choice))return bad();keys=['type','choice'];break;
    case 'resolve':if(!label(c.choice)||c.target!==undefined&&!label(c.target))return bad();keys=['type','choice','target'];break;
    case 'level':if(!label(c.cat))return bad();keys=['type','cat'];break;
    case 'equip':if(!label(c.cat)||c.instance!==null&&!label(c.instance)||!['weapon','outfit','charm','relic'].includes(String(c.slot)))return bad();keys=['type','cat','instance','slot'];break;
    case 'salvage':if(!label(c.instance))return bad();keys=['type','instance'];break;
    case 'export':if(!label(c.instance)||c.normalization!=='depth-min-roll-v1')return bad();keys=['type','instance','normalization'];break;
    default:return bad();
  }
  if(Object.keys(c).some(k=>!keys.includes(k)))return bad();
  return structuredClone(value) as unknown as CampaignRequest;
}
// Stable across object-key order; request identity includes the expected revision.
function canonical(v:unknown):string {
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  if(object(v))return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
export async function campaignHash(v:unknown):Promise<string>{
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v)))),x=>x.toString(16).padStart(2,'0')).join('');
}
function ok(result:RuleResult<DepthAccount>):DepthAccount {
  if(!result.ok)throw new Error('campaign_rule:'+result.error);return result.state;
}
export function campaignStep(prior:CampaignState,command:CampaignCommand,now:number,seed:number):CampaignState {
  const state=structuredClone(prior);
  state.game=ok(syncCalendarDay(state.game,now));
  const g=state.game,c=command;
  switch(c.type){
    case 'start':{
      // A start consumes a slot before its seed is revealed. Abandon/retry cannot
      // sample unlimited seeds to pick desired rare drops. Offline play is separate.
      const utcDay=Math.floor(now/86400000),count=state.starts?.utcDay===utcDay?state.starts.count:0;
      if(count>=6)throw new Error('campaign_daily_starts');
      state.game=ok(startRun(g,c.chapter,seed,'campaign',new Date(now).toISOString().slice(0,10)));
      state.starts={utcDay,count:count+1};break;
    }
    case 'enter':state.game=ok(enterNode(g,c.node));break;
    case 'fight':{
      const ready=ok(commitPreparation(g));
      ready.run!.battle=playBattle(ready.run!.battle!,'auto');
      if(!ready.run!.battle.result)throw new Error('campaign_unfinished');
      state.game=ok(finishEncounter(ready));break;
    }
    case 'reward':state.game=ok(chooseReward(g,c.choice));break;
    case 'resolve':state.game=ok(resolveNode(g,c.choice,c.target));break;
    case 'abandon':state.game=ok(abandonRun(g));break;
    case 'idle':state.game=ok(claimIdleService(g,now));break;
    case 'level':state.game=ok(metaCommand(g,{type:'level',cardId:c.cat}));break;
    case 'equip':state.game=ok(equipGear(g,c.cat,c.instance,c.slot));break;
    case 'salvage':state.game=ok(salvageGear(g,c.instance));break;
    case 'export':{
      if(g.run&&!g.run.complete)throw new Error('campaign_in_run');
      const gear=g.gear.find(x=>x.id===c.instance),origin=state.origins[c.instance];
      const rule=gear&&Object.hasOwn(TRADE_BY_ID,gear.templateId)?TRADE_BY_ID[gear.templateId]:undefined;
      if(!gear||!rule?.tradable||rule.kind!=='equipment'||origin?.item!==gear.templateId)throw new Error('campaign_source');
      if(origin.level<TRADE_POLICY.minLevel)throw new Error('campaign_level');
      if(Object.values(g.equipment).some(slots=>Object.values(slots).includes(c.instance)))throw new Error('campaign_equipped');
      g.gear=g.gear.filter(x=>x.id!==c.instance);break;
    }
  }
  for(const gear of state.game.gear){
    if(!prior.game.gear.some(x=>x.id===gear.id)){
      if(state.origins[gear.id])throw new Error('campaign_reused_instance');
      state.origins[gear.id]={item:gear.templateId,level:Math.min(...state.game.team.map(id=>state.game.account.cards.find(c=>c.cardId===id)!.level)),at:new Date(now).toISOString()};
    }
  }
  // Removed origins remain as tombstones; an exported instance never reappears.
  return state;
}
export function createCampaign({enabled=false,rulesHash,store,now=()=>Date.now(),seed=()=>crypto.getRandomValues(new Uint32Array(1))[0]!}:{
  enabled?:boolean;rulesHash:string;store:CampaignStore;now?:()=>number;seed?:()=>number;
}) {
  return async(player:string,wallet:string,input:unknown):Promise<CampaignReceipt>=>{
    if(!enabled)throw new Error('campaign_disabled');
    if(!uuid.test(player)||!/^0x[0-9a-f]{40}$/.test(wallet)||!/^[0-9a-f]{64}$/.test(rulesHash))throw new Error('campaign_identity');
    const request=campaignRequest(input),requestHash=await campaignHash([CAMPAIGN_SOURCE,player,wallet,rulesHash,request]);
    const prior=await store.receipt(player,wallet,request.id);
    if(prior){if(prior.request_hash!==requestHash)throw new Error('campaign_conflict');return prior;}
    const clock=now();
    if(!Number.isSafeInteger(clock)||clock<0)throw new Error('campaign_clock');
    const snapshot=await store.boot(player,wallet,rulesHash,{game:setGameplayA6(createDepthAccount(seed(),clock),true),origins:{}});
    if(snapshot.rules_hash!==rulesHash)throw new Error('campaign_rules_changed');
    if(snapshot.revision!==request.revision)throw new Error('campaign_stale');
    const transitionNow=now();
    if(!Number.isSafeInteger(transitionNow)||transitionNow<clock||transitionNow<Date.parse(snapshot.updated_at))throw new Error('campaign_clock');
    const state=campaignStep(snapshot.state,request.command,transitionNow,seed());
    return store.commit({player,wallet,rules:rulesHash,id:request.id,requestHash,revision:request.revision,state,
      exportInstance:request.command.type==='export'?request.command.instance:null});
  };
}
