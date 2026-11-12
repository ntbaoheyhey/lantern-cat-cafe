import type {Address} from 'viem';
import type {TesterReservationRequest} from './chain-rewards.ts';
/** A cap on authorized gifts, never a promise that recipients will spend.
 * The snapshot/store dependencies are server-owned, not HTTP input. */
export interface TesterReservation {
  contract:string;player_id:string;wallet:string;nonce:string;amount:string;
}
export interface TesterPoolSnapshot {
  chainId:number;contract:Address;block:bigint;blockHash:string;timestamp:bigint;balance:bigint;
}
/** Shared by gift admission and routine-budget registration. The caller pins
 * balance and token/contract identity to this block before providing it. */
export function poolSnapshotFields(contract:Address,s:TesterPoolSnapshot,now=Date.now()) {
  const time=BigInt(Math.floor(now/1000));
  if(s.chainId!==43113||s.contract.toLowerCase()!==contract.toLowerCase()||
     !/^0x[0-9a-fA-F]{64}$/.test(s.blockHash)||s.block<0n||s.block>BigInt(Number.MAX_SAFE_INTEGER)||
     s.timestamp>time||time-s.timestamp>60n||s.balance<0n||s.balance>1_000_000_000n*10n**18n)
    throw new Error('tester_budget_snapshot');
  return {pool_balance:s.balance.toString(),block:s.block.toString(),block_hash:s.blockHash.toLowerCase()};
}
export const testerReservationRow=(r:TesterReservationRequest):TesterReservation=>({
  contract:r.contract.toLowerCase(),player_id:r.player,wallet:r.wallet.toLowerCase(),nonce:r.nonce.toString(),amount:r.amount.toString(),
});
export function createTesterBudgetReservation({contract,snapshot,reserve,now=()=>Date.now()}:{
  contract:Address;snapshot():Promise<TesterPoolSnapshot>;
  reserve(row:TesterReservation&{pool_balance:string;block:string;block_hash:string}):Promise<TesterReservation>;
  now?:()=>number;
}) {
  return async(request:TesterReservationRequest)=>{
    if(request.contract.toLowerCase()!==contract.toLowerCase()||request.amount!==20n*10n**18n)
      throw new Error('tester_budget_conflict');
    const funding=poolSnapshotFields(contract,await snapshot(),now());
    const row=testerReservationRow(request);
    const result=await reserve({...row,...funding});
    for(const key of Object.keys(row) as (keyof TesterReservation)[])
      if(row[key]!==result[key])throw new Error('tester_budget_conflict');
  };
}
