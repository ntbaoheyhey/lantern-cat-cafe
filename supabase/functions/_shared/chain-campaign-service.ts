import {createDepthAccount} from '../../../packages/game-rules/src/cardrpg/depth/state.ts';
import {setGameplayA6} from '../../../packages/game-rules/src/cardrpg/depth/gameplay-a6.ts';
import {availableNodes,EVENTS} from '../../../packages/game-rules/src/cardrpg/depth/run.ts';
import {boonForMode} from '../../../packages/game-rules/src/cardrpg/depth/boons.ts';
import {TRADE_BY_ID,TRADE_POLICY} from '../../../packages/game-rules/src/cardrpg/trade.ts';
import type {CampaignView,CampaignResponse} from '../../../packages/chain/src/campaign.ts';
import {createCampaign,type CampaignSnapshot,type CampaignStore} from './chain-campaign.ts';
import {ChainRequestError} from './chain-http.ts';

/** Explicit projection: never serialize server saves, seeds or battle internals. */
export function campaignView(snapshot:CampaignSnapshot,now:number):CampaignView {
  const {game:g,origins,starts}=snapshot.state,r=g.run,home=!r||r.complete;
  const choices:CampaignView['choices']=[];
  const add=(label:string,command:CampaignView['choices'][number]['command'],hint?:string)=>choices.push({label,command,...(hint?{hint}:{})});
  const remaining=Math.max(0,6-(starts?.utcDay===Math.floor(now/86400000)?starts.count:0));
  let phase:CampaignView['phase']=!r?'home':r.complete?(r.won?'won':'lost'):'route';
  if(home&&remaining)for(let chapter=1;chapter<=3;chapter++){if(chapter===1||g.cleared.includes(chapter-1))add('Start '+chapter,{type:'start',chapter});}
  else if(r&&!r.complete){
    if(r.battle){phase='fight';add('Fight',{type:'fight'});}
    else if(r.rewardChoices.length){phase='reward';r.rewardChoices.forEach(choice=>{
      if(choice.startsWith('skill:'))add('Upgrade',{type:'reward',choice},choice.slice(6)+' · +1');
      else {const boon=boonForMode(choice,!!r.gameplayV4);add(boon.name,{type:'reward',choice},boon.description);}
    });}
    else if(!r.current)availableNodes(r).forEach(n=>add(n.kind,{type:'enter',node:n.id}));
    else {
      phase='event';const node=r.nodes.find(n=>n.id===r.current)!;
      if(node.kind==='event')EVENTS.find(e=>e.id===node.eventId)!.choices.filter(c=>c.cost<=r.points).forEach(c=>add(c.id,{type:'resolve',choice:c.id},c.description));
      else if(node.kind==='treasure'){add('Points',{type:'resolve',choice:'points'});add('Charm',{type:'resolve',choice:'charm'});}
      else if(node.kind==='campfire')add('Heal',{type:'resolve',choice:'heal'});
      else if(node.kind==='shop')add('Leave',{type:'resolve',choice:'leave'});
    }
  }
  return {revision:snapshot.revision,rules:snapshot.rules_hash,day:g.account.day,remaining,chapter:g.account.chapter,
    phase,steps:r?.visited.length??0,points:r?.points??0,choices,
    crew:g.team.map(id=>({id,level:g.account.cards.find(c=>c.cardId===id)!.level})),
    gear:g.gear.map(gear=>{const rule=TRADE_BY_ID[gear.templateId],origin=origins[gear.id];
      const equipped=Object.values(g.equipment).some(slots=>Object.values(slots).includes(gear.id));
      return {instance:gear.id,item:gear.templateId,equipped,
        eligible:home&&!equipped&&rule?.tradable===true&&rule.kind==='equipment'&&origin?.item===gear.templateId&&origin.level>=TRADE_POLICY.minLevel};})};
}
export function createCampaignService({enabled=false,rulesHash,store,now=()=>Date.now(),seed=()=>crypto.getRandomValues(new Uint32Array(1))[0]!}:{
  enabled?:boolean;rulesHash:string;store:CampaignStore;now?:()=>number;seed?:()=>number;
}){
  const act=createCampaign({enabled,rulesHash,store,now,seed});
  return async(player:string,wallet:string,input:Record<string,unknown>):Promise<CampaignResponse>=>{
    try{
      if(!enabled)throw new ChainRequestError('campaign_disabled');
      if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(player)||!/^0x[0-9a-f]{40}$/.test(wallet)||!/^[0-9a-f]{64}$/.test(rulesHash))throw new ChainRequestError('unauthenticated');
      if(input.action==='state'&&Object.keys(input).length===1){
        const clock=now();
        const snapshot=await store.boot(player,wallet,rulesHash,{game:setGameplayA6(createDepthAccount(seed(),clock),true),origins:{}});
        if(snapshot.rules_hash!==rulesHash)throw new ChainRequestError('campaign_rules_changed');
        return {view:campaignView(snapshot,clock),receipt:null};
      }
      if(input.action!=='command'||Object.keys(input).sort().join(',')!=='action,command,id,revision')throw new ChainRequestError('invalid_request');
      const {action:_,...request}=input;
      const receipt=await act(player,wallet,request);
      return {view:campaignView(receipt.snapshot,now()),receipt:{id:String(input.id),revision:receipt.snapshot.revision,inventory:receipt.inventory_id}};
    }catch(error){
      if(error instanceof ChainRequestError)throw error;
      const message=error instanceof Error?error.message:'';
      if(message.startsWith('campaign_rule:'))throw new ChainRequestError('campaign_choice');
      if(message==='campaign_request')throw new ChainRequestError('invalid_request');
      if(['campaign_disabled','campaign_rules_changed','campaign_stale','campaign_conflict','campaign_daily_starts','campaign_equipped','campaign_source','campaign_level','campaign_in_run'].includes(message))
        throw new ChainRequestError(message as ConstructorParameters<typeof ChainRequestError>[0]);
      throw new Error('campaign_unavailable');
    }
  };
}
