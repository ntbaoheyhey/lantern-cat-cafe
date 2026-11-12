import {expect,it,vi} from 'vitest';
import {mnemonicToAccount} from 'viem/accounts';
import {toHex,recoverTypedDataAddress,type Address,type PublicClient} from 'viem';
import {createCampaignClaim} from '../../functions/_shared/chain-campaign-claim.ts';
import {CLAIM_TYPES,claimDomain} from '../../functions/_shared/chain-rewards.ts';
import type {RoutineReservation} from '../../functions/_shared/chain-routine.ts';
import {readChainBody,chainFailure,routineError} from '../../functions/_shared/chain-http.ts';
// Public Anvil fixture only; no environment credentials.
const signer=mnemonicToAccount('test test test test test test test test test test test junk');
const addr=(n:number)=>('0x'+n.toString(16).padStart(40,'0')) as Address;
const player='c0000000-0000-4000-8000-000000000001',wallet=addr(1),contract=addr(2),token=addr(3),rules='a'.repeat(64),U=10n**18n;
function fixture(){
 let stamp=1794480000,used=false,record:RoutineReservation|null=null;
 const epoch=stamp-(stamp-345600)%604800;
 const reads:Record<string,unknown>={seasonEpoch:BigInt(epoch),currentRoutineBudget:12n*U,weeklyCap:32n*U,
  yarn:token,signer:signer.address,balanceOf:100n*U,claimedInWeek:0n,routineClaimedInWeek:0n};
 const client={getChainId:vi.fn(async()=>43113),getBlock:vi.fn(async()=>({number:1n,hash:'0x'+'b'.repeat(64),timestamp:BigInt(stamp)})),
  readContract:vi.fn(async({functionName}:{functionName:string})=>functionName==='usedNonces'?used:reads[functionName])};
 const read=vi.fn(async()=>({program:{contract,epoch,rules_hash:rules,first_season:0,last_season:0,enabled:true},
  budget:{id:'budget-v1',contract,season:0,source_id:'campaign-journal-v1',rules_hash:rules,boss_max:(15n*U/10n).toString(),rank_max:(15n*U/10n).toString(),enabled:true},
  boss:{player_id:player,run_id:1,revision:20,wallet,rules_hash:rules,chapter:1,completed_at:new Date((stamp-1)*1000).toISOString()},
  rank:null,earningBudget:null}));
 const reserve=vi.fn(async(r:RoutineReservation)=>{record??=r;return record;});
 const renew=vi.fn(async(r:RoutineReservation)=>r);
 const stored=vi.fn(async()=>record);
 const deps={enabled:true,contract,token,key:toHex(signer.getHdKey().privateKey!),rulesHash:rules,
  client:client as unknown as PublicClient,read,reserve,renew,stored,now:()=>stamp*1000};
 return {deps,client,reads,read,reserve,renew,stored,advance:(n:number)=>{stamp+=n;},paid:()=>{used=true;},
  claim:(action:'quote'|'claim'='claim')=>createCampaignClaim(deps)(player,wallet,action,'weekly-boss')};
}
it('quotes immutable earned terms without reserving, and signs a full Claim only after funding/reservation',async()=>{
 const f=fixture(),q=await f.claim('quote');expect(q.quote.amount).toBe('1500000000000000000');expect(q).not.toHaveProperty('signature');expect(f.reserve).not.toHaveBeenCalled();
 const r=await f.claim();expect(r.quote).toEqual(q.quote);expect(f.reserve).toHaveBeenCalledTimes(1);
 if(!('claim' in r)||!r.signature)throw new Error('missing signature');
 expect(await recoverTypedDataAddress({domain:claimDomain(contract),types:CLAIM_TYPES,primaryType:'Claim',message:r.claim!,signature:r.signature})).toBe(signer.address);
 expect(r.claim!.expiry).toBe(BigInt(f.deps.now()/1000+600));
 expect(await f.claim()).toEqual(r);expect(new Set(f.reserve.mock.calls.map(([r])=>r.nonce)).size).toBe(1);
});
it('recovers a completed claim after expiry without reading new authority or re-signing',async()=>{
 const f=fixture(),r=await f.claim();f.paid();f.advance(601);f.read.mockClear();f.reserve.mockClear();
 const recovered=await f.claim();expect(recovered.quote).toEqual({...r.quote,used:true});
 expect(recovered).not.toHaveProperty('signature');expect(f.read).not.toHaveBeenCalled();expect(f.reserve).not.toHaveBeenCalled();
});
it('renews an unpaid expired authorization with the same economic promise and nonce; quotes do not renew',async()=>{
 const f=fixture(),first=await f.claim();f.advance(601);
 const quote=await f.claim('quote');expect(quote.quote).toEqual(first.quote);expect(f.renew).not.toHaveBeenCalled();
 const renewed=await f.claim();expect(renewed.quote).toEqual(first.quote);
 expect(renewed.claim!.expiry).toBe(first.claim!.expiry+601n);expect(f.renew).toHaveBeenCalledTimes(1);
 f.paid();await f.claim();expect(f.renew).toHaveBeenCalledTimes(1);
});
it('refuses unsupported chains, wrong token/signer, stale/forked snapshots before consuming budget',async()=>{
 for(const change of [
  (f:ReturnType<typeof fixture>)=>f.client.getChainId.mockResolvedValue(1),
  (f:ReturnType<typeof fixture>)=>{f.reads.yarn=addr(4);},
  (f:ReturnType<typeof fixture>)=>{f.reads.signer=addr(4);},
  (f:ReturnType<typeof fixture>)=>{f.deps.now=()=>1794480000*1000+31000;},
  (f:ReturnType<typeof fixture>)=>{f.client.getBlock.mockResolvedValueOnce({number:1n,hash:'0x'+'c'.repeat(64),timestamp:1794480000n});},
 ]){const f=fixture();change(f);await expect(f.claim()).rejects.toThrow();expect(f.reserve).not.toHaveBeenCalled();}
});
it('never signs or reserves partial payouts, spent weekly room, or an unfunded amount',async()=>{
 for(const [field,value] of [['currentRoutineBudget',U],['routineClaimedInWeek',11n*U],['claimedInWeek',31n*U],['balanceOf',U]] as const){
  const f=fixture();f.reads[field]=value;await expect(f.claim()).rejects.toThrow();expect(f.reserve).not.toHaveBeenCalled();
 }
 const f=fixture();f.reserve.mockRejectedValueOnce(new Error('routine_budget'));await expect(f.claim()).rejects.toThrow('routine_budget');
});
it('disabled operation touches no authority, chain, key or reservation',async()=>{
 const f=fixture();await expect(createCampaignClaim({...f.deps,enabled:false,key:'0x'})(player,wallet,'claim','weekly-boss')).rejects.toThrow('routine_disabled');
 expect(f.client.getChainId).not.toHaveBeenCalled();expect(f.read).not.toHaveBeenCalled();expect(f.reserve).not.toHaveBeenCalled();
});
it('HTTP callers choose only reward kind; beneficiary, period, score and amount cannot be supplied',async()=>{
 const req=(body:unknown)=>new Request('https://local.test',{method:'POST',body:JSON.stringify(body)});
 for(const action of ['quote','claim'])expect(await readChainBody(req({action,kind:'weekly-boss'}),'chain-campaign-reward')).toEqual({action,kind:'weekly-boss'});
 for(const extra of [{amount:'1'},{period:1},{wallet},{score:39},{kind:'tester'},{action:'state'}])
  await expect(readChainBody(req({action:'claim',kind:'weekly-boss',...extra}),'chain-campaign-reward')).rejects.toThrow();
 expect(chainFailure(routineError(new Error('routine_cap')),'routine_unavailable')).toEqual({status:409,body:{error:'routine_cap'}});
 expect(chainFailure(routineError(new Error('private RPC response')),'routine_unavailable')).toEqual({status:503,body:{error:'routine_unavailable'}});
});
