import {keccak256,toBytes,type Address} from 'viem';

/** Preparatory seam only: no HTTP endpoint, private key or automatic signing.
 * Both callbacks are trusted server dependencies, never browser-supplied data.
 * A successful reservation does not attest demand, fund the pool or enable claims. */
export interface RoutineReceipt {
  sourceId:string;receiptId:string;playerId:string;wallet:Address;
  kind:'weekly-boss'|'season-rank';earningPeriod:number;rulesHash:string;evidenceHash:string;
  finalizedAt:number;eligible:boolean;budgetId:string;amount:string;
}
export interface RoutineSnapshot {
  chainId:number;contract:Address;block:number;blockHash:string;timestamp:number;
  epoch:number;season:number;week:number;routineCap:string;
}
export interface RoutineReservation {
  source_id:string;receipt_id:string;player_id:string;wallet:string;kind:RoutineReceipt['kind'];
  earning_period:number;rules_hash:string;evidence_hash:string;budget_id:string;amount:string;contract:string;policy_cap:string;
  season:number;week:number;nonce:string;expiry:number;observed_at:number;
}
export const routineNonce=(r:Pick<RoutineReceipt,'sourceId'|'receiptId'>)=>
  BigInt(keccak256(toBytes(JSON.stringify(['taskbar-hero:routine:v1',r.sourceId,r.receiptId]))));
const addr=/^0x[0-9a-fA-F]{40}$/,hash=/^[0-9a-f]{64}$/;
const uint=(n:unknown):n is number=>Number.isSafeInteger(n)&&Number(n)>=0;
export function createRoutinePreparation({enabled=false,contract,authority,snapshot,reserve}:{
  enabled?:boolean;contract:Address;
  authority(player:string,wallet:Address,receiptId:string):Promise<RoutineReceipt>;
  snapshot():Promise<RoutineSnapshot>;
  reserve(request:RoutineReservation):Promise<RoutineReservation>;
}) {
  return async(player:string,wallet:Address,receiptId:string)=>{
    if(!enabled)throw new Error('routine_disabled');
    if(!addr.test(contract)||!addr.test(wallet)||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(player)||
       typeof receiptId!=='string'||receiptId.length<1||receiptId.length>160||receiptId.trim()!==receiptId)
      throw new Error('routine_identity');
    const r=await authority(player,wallet,receiptId);
    if(r.eligible!==true||r.playerId!==player||!addr.test(r.wallet)||r.wallet.toLowerCase()!==wallet.toLowerCase()||r.receiptId!==receiptId)
      throw new Error('routine_authority');
    if(!/^[a-z][a-z0-9-]{1,63}$/.test(r.sourceId)||!hash.test(r.rulesHash)||!hash.test(r.evidenceHash)||
       !uint(r.earningPeriod)||!uint(r.finalizedAt)||!['weekly-boss','season-rank'].includes(r.kind)||
       !/^[1-9][0-9]{0,19}$/.test(r.amount)||typeof r.budgetId!=='string'||!r.budgetId.trim())
      throw new Error('routine_receipt');
    const s=await snapshot();
    if(s.chainId!==43113||!addr.test(s.contract)||s.contract.toLowerCase()!==contract.toLowerCase()||
       !/^0x[0-9a-fA-F]{64}$/.test(s.blockHash)||![s.block,s.timestamp,s.epoch,s.season,s.week].every(uint)||
       s.epoch<345600||s.epoch>s.timestamp||(s.epoch-345600)%604800!==0||
       s.week!==Math.floor((s.timestamp-345600)/604800)||s.season!==Math.floor((s.timestamp-s.epoch)/(13*604800))||
       !/^(0|[1-9][0-9]{0,19})$/.test(s.routineCap)||BigInt(s.routineCap)>12n*10n**18n)
      throw new Error('routine_snapshot');
    if(r.finalizedAt>s.timestamp||r.amount==='0'||BigInt(r.amount)>BigInt(s.routineCap))throw new Error('routine_cap');
    if(r.kind==='weekly-boss'&&r.earningPeriod!==s.week||r.kind==='season-rank'&&r.earningPeriod!==s.season-1)
      throw new Error('routine_period');
    const earliest=r.kind==='weekly-boss'?345600+s.week*604800:s.epoch+s.season*13*604800;
    if(r.finalizedAt<earliest)throw new Error('routine_unfinalized');
    const expiry=Math.min(s.timestamp+600,345600+(s.week+1)*604800-1,s.epoch+(s.season+1)*13*604800-1);
    const request:RoutineReservation={source_id:r.sourceId,receipt_id:r.receiptId,player_id:player,wallet:wallet.toLowerCase(),
      kind:r.kind,earning_period:r.earningPeriod,rules_hash:r.rulesHash,evidence_hash:r.evidenceHash,
      budget_id:r.budgetId,amount:r.amount,contract:contract.toLowerCase(),policy_cap:s.routineCap,
      season:s.season,week:s.week,nonce:routineNonce(r).toString(),expiry,observed_at:s.timestamp};
    const stored=await reserve(request);
    for(const k of Object.keys(request) as (keyof RoutineReservation)[])
      if(k!=='expiry'&&k!=='observed_at'&&stored[k]!==request[k])throw new Error('routine_store_conflict');
    if(!uint(stored.expiry)||!uint(stored.observed_at)||stored.expiry<s.timestamp||stored.expiry>expiry||
       stored.observed_at>s.timestamp||stored.expiry>stored.observed_at+600)throw new Error('routine_expired');
    return {reservation:stored,claim:{player:wallet,amount:BigInt(stored.amount),season:BigInt(stored.season),
      nonce:BigInt(stored.nonce),expiry:BigInt(stored.expiry)},snapshot:s,preparationOnly:true as const};
  };
}
