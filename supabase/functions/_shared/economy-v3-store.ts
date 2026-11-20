import {freshEconomy,type EconomyStore,type EconomySnapshot,type EconomySaved} from './economy-v3.ts';
/** The same transaction adapter is used by Edge Functions and local Postgres tests. */
export function economyStore(rpc:(name:string,args:Record<string,unknown>)=>Promise<unknown>):EconomyStore{return {
 read:(player,wallet)=>rpc('chain_v3_read',{p_player:player,p_wallet:wallet,p_initial:freshEconomy()}) as Promise<EconomySnapshot>,
 receipt:(player,wallet,id)=>rpc('chain_v3_receipt',{p_player:player,p_wallet:wallet,p_id:id}) as Promise<EconomySaved|null>,
 commit:p=>rpc('chain_v3_commit',{p_player:p.player,p_wallet:p.wallet,p_id:p.id,p_hash:p.hash,p_revision:p.revision,p_state:p.state,p_deed:p.deed,p_burn:p.burn,p_intent:p.intent,p_import:p.source,p_campaign_revision:p.campaignRevision}) as Promise<EconomySaved>,
};}
