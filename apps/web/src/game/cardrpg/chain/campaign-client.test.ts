import {it,expect,vi} from 'vitest';
import type {CampaignResponse,CampaignView,CampaignRequest} from '@taskbar-hero/chain';
import {campaignClient} from './campaign-client';
import {ChainApiError} from './api';
const wallet='0x'+'1'.repeat(40);
const memory=()=>{const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);},values};};
const view=(revision:number)=>({revision} as CampaignView);
const result=(r:CampaignRequest):CampaignResponse=>({view:view(r.revision+1),receipt:{id:r.id,revision:r.revision+1,inventory:null}});
it('retries a committed command after response loss and reload with the same ID',async()=>{
 const storage=memory(),requests:CampaignRequest[]=[];let committed:CampaignResponse;
 const first=campaignClient(wallet,async body=>{const r=body as CampaignRequest;requests.push(r);committed=result(r);throw new Error('network timeout');},storage);
 await expect(first.command(3,{type:'fight'})).rejects.toThrow('network timeout');
 expect(storage.values.size).toBe(1);
 const second=campaignClient(wallet,async body=>{
  if((body as {action:string}).action==='state')return {view:view(4),receipt:null};
  requests.push(body as CampaignRequest);return committed;
 },storage);
 expect((await second.load()).view.revision).toBe(4);
 expect(requests[1]).toEqual(requests[0]);expect(storage.values.size).toBe(0);
});
it('coalesces simultaneous state reads and locks duplicate clicks while an action is pending',async()=>{
 const storage=memory();let finish:(r:CampaignResponse)=>void=()=>{};
 const post=vi.fn(()=>new Promise<CampaignResponse>(resolve=>{finish=resolve;}));
 const client=campaignClient(wallet,post,storage),a=client.load(),b=client.load();
 expect(a).toBe(b);expect(post).toHaveBeenCalledTimes(1);
 await expect(client.command(0,{type:'fight'})).rejects.toThrow('pending');
 finish({view:view(0),receipt:null});await a;
});
it('does not send when intent persistence fails',async()=>{
 const post=vi.fn();const storage={...memory(),setItem:()=>{throw new Error('storage full');}};
 await expect(campaignClient(wallet,post,storage).command(0,{type:'start',chapter:1})).rejects.toThrow('storage full');
 expect(post).not.toHaveBeenCalled();
});
it('retains ambiguous failures and rejects an unrelated successful receipt',async()=>{
 const storage=memory(),client=campaignClient(wallet,async()=>({view:view(1),receipt:{id:'wrong',revision:1,inventory:null}}),storage);
 await expect(client.command(0,{type:'start',chapter:1})).rejects.toThrow('receipt mismatch');expect(storage.values.size).toBe(1);
});
it('clears only a definite conflict and lets refresh recover the current revision',async()=>{
 const storage=memory(),client=campaignClient(wallet,async()=>{throw new ChainApiError('campaign_stale');},storage);
 await expect(client.command(0,{type:'start',chapter:1})).rejects.toThrow('Progress changed');expect(storage.values.size).toBe(0);
});
it('keeps independent wallet intents separate',async()=>{
 const storage=memory(),post=async()=>{throw new Error('timeout');};
 for(const w of [wallet,'0x'+'2'.repeat(40)])await expect(campaignClient(w,post,storage).command(0,{type:'start',chapter:1})).rejects.toThrow('timeout');
 expect(storage.values.size).toBe(2);
});
