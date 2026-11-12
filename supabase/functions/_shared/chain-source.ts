import {TRADE_BY_ID,TRADE_POLICY} from '../../../packages/game-rules/src/cardrpg/trade.ts';

/** Trusted server integration only. There is deliberately no HTTP route.
 * None of these fields, including consumptionHash, authenticate a browser save.
 * C2 must bind this adapter to an authoritative item-consumption transaction. */
export interface SourceReceipt {
  sourceId:string; receiptId:string; instanceId:string; playerId:string; wallet:string;
  itemId:string; earnedLevel:number; rulesHash:string; consumptionHash:string;
  normalizationVersion:'depth-min-roll-v1'; earnedAt:string; consumedAt:string;
}
export interface SourceResult {inventory_id:string;source_id:string;receipt_id:string}
export function createSourceIngest({enabled=false,store}:{
  enabled?:boolean;store(receipt:SourceReceipt):Promise<SourceResult>;
}) {
  return async(receipt:SourceReceipt)=>{
    if(!enabled)throw new Error('source_disabled');
    const r=receipt,rule=Object.hasOwn(TRADE_BY_ID,r.itemId)?TRADE_BY_ID[r.itemId]:undefined;
    if(!rule?.tradable||rule.kind!=='equipment'||!rule.tokenId||rule.tokenId<20000)throw new Error('source_bound_item');
    if(!Number.isSafeInteger(r.earnedLevel)||r.earnedLevel<TRADE_POLICY.minLevel)throw new Error('source_level');
    if(!/^[a-z][a-z0-9-]{1,63}$/.test(r.sourceId)||![r.receiptId,r.instanceId].every(s=>typeof s==='string'&&s.trim()===s&&s.length>=1&&s.length<=160))throw new Error('source_identity');
    if(!/^[0-9a-f-]{36}$/.test(r.playerId)||!/^0x[0-9a-f]{40}$/.test(r.wallet))throw new Error('source_player');
    if(![r.rulesHash,r.consumptionHash].every(s=>/^[0-9a-f]{64}$/.test(s)))throw new Error('source_proof');
    if(r.normalizationVersion!=='depth-min-roll-v1')throw new Error('source_normalization');
    const earned=Date.parse(r.earnedAt),consumed=Date.parse(r.consumedAt);
    if(!Number.isFinite(earned)||!Number.isFinite(consumed)||consumed<earned)throw new Error('source_time');
    // Store only the versioned whitelist; stats, client balances and flags cannot
    // leak through the adapter. The database is authoritative for timestamps.
    return store({sourceId:r.sourceId,receiptId:r.receiptId,instanceId:r.instanceId,playerId:r.playerId,
      wallet:r.wallet,itemId:r.itemId,earnedLevel:r.earnedLevel,rulesHash:r.rulesHash,
      consumptionHash:r.consumptionHash,normalizationVersion:r.normalizationVersion,
      earnedAt:new Date(earned).toISOString(),consumedAt:new Date(consumed).toISOString()});
  };
}
