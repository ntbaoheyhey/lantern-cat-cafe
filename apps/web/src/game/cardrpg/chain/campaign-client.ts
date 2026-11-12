import type {CampaignCommand,CampaignRequest,CampaignResponse} from '@taskbar-hero/chain';
import {ChainApiError} from './api';
type Storage=Pick<globalThis.Storage,'getItem'|'setItem'|'removeItem'>;
const definitive=new Set(['campaign_stale','campaign_conflict','campaign_choice','campaign_equipped','campaign_source','campaign_level','campaign_in_run','campaign_daily_starts','invalid_request']);
/** Persist intent before sending. A timeout keeps the same ID across reloads. */
export function campaignClient(wallet:string,post:(body:unknown)=>Promise<CampaignResponse>,storage:Storage=sessionStorage){
  const key='taskbar-hero.campaign-pending.v1:'+wallet.toLowerCase();
  let busy=false;
  let loading:Promise<CampaignResponse>|undefined;
  const pending=():CampaignRequest|null=>{
    const raw=storage.getItem(key);if(!raw)return null;
    try{return JSON.parse(raw) as CampaignRequest;}catch{storage.removeItem(key);throw new Error('Request invalid. Refresh.');}
  };
  const deliver=async(request:CampaignRequest)=>{
    try{
      const response=await post({action:'command',...request});
      if(response.receipt?.id!==request.id||response.receipt.revision!==request.revision+1)throw new Error('Campaign receipt mismatch.');
      storage.removeItem(key);return response;
    }catch(error){
      // An ambiguous network/dependency failure must retain the original ID.
      if(error instanceof ChainApiError&&definitive.has(error.code))storage.removeItem(key);
      throw error;
    }
  };
  const locked=async<T>(fn:()=>Promise<T>)=>{if(busy)throw new Error('Campaign pending.');busy=true;try{return await fn();}finally{busy=false;}};
  return {
    load:()=>loading??(loading=locked(async()=>{const retry=pending();if(retry)await deliver(retry);return post({action:'state'});}).finally(()=>{loading=undefined;})),
    command:(revision:number,command:CampaignCommand)=>locked(async()=>{
      const retry=pending();if(retry)return deliver(retry);
      const request={id:crypto.randomUUID(),revision,command};
      storage.setItem(key,JSON.stringify(request));return deliver(request);
    }),
  };
}
