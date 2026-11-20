import { reserveDesignPreview as legacyReserveDesignPreview } from './bridge';
import { gameplayV4 } from './gameplay-v4';
import { requireRule } from '../internal';
import { requireHome, transactDepth } from './state';
import type { DepthAccount } from './contract';
import { EDITIONS, createIssuanceLedger, applyIssuance, type AuthorityContext, type EditionId, type IssuanceCommand, type IssuanceLedger, type Reservation } from './scarcity';
export const localEditionAccount=(s:DepthAccount)=>`local-${s.account.seed}`;
function legacyLedger(s:DepthAccount,now:number):IssuanceLedger {
 const accountId=localEditionAccount(s),season=new Date(now).toISOString().slice(0,7),reservations:Reservation[]=[];
 const lifetime={'moon-collar':0,'golden-maneki':0},seasonal={...lifetime};
 for(const edition of Object.keys(EDITIONS) as EditionId[]){
  const old=s.account.scarcity[edition];lifetime[edition]=old?.issuedDesign??0;seasonal[edition]=old?.seasonIssuedDesign??0;
  if(s.designClaims.includes(edition)||s.account.designClaims.includes(edition))reservations.push({id:`legacy:${edition}`,edition,accountId,season,sequence:0,status:'live',legacy:true});
 }
 return createIssuanceLedger(`save-${s.account.seed}`,now,{lifetime,seasonal,reservations});
}
export function editionLedgerV4(s:DepthAccount,now=Date.now()):IssuanceLedger { return s.v4?.issuance??legacyLedger(s,now); }
export function editionContextV4(s:DepthAccount,ledger:IssuanceLedger,now:number):AuthorityContext {
 const accountId=localEditionAccount(s);
 const earned=Object.entries(s.account.inventory.stacks).filter(([k,v])=>/^depth-seal-\d+$/.test(k)&&v>0).map(([key])=>({id:`${accountId}:${key}`,day:Number(key.slice(11)),source:'boss-day' as const}));
 const legacyCount=s.v4?.legacySealCount??Math.max(0,s.seals-earned.length);
 const legacy=Array.from({length:Math.min(legacyCount,10000)},(_,i)=>({id:`${accountId}:legacy:${i}`,day:1000000+i,source:'legacy-local' as const}));
 // Current balance excludes seals already used in tailoring. Select only that many
 // still-unspent receipts; a reserved proof can never be selected again.
 const effort=[...earned,...legacy].filter(p=>!ledger.consumedProofIds.includes(p.id)&&!s.v4?.spentEffortIds?.includes(p.id)).slice(0,s.seals);
 return {accountId,now,effort,chapterOne:s.cleared.includes(1),allMasteries:[1,2,3].every(c=>s.masteries.includes(c)),towerBest:s.towerBest};
}
export function issueEditionV4(state:DepthAccount,command:IssuanceCommand,now=Date.now()) { return transactDepth(state,s=>{
 requireHome(s);requireRule(gameplayV4(s)&&!!s.v4,'NOT_READY','Enable Gameplay v4 first.');
 let ledger:IssuanceLedger;try{ledger=editionLedgerV4(s,now);}catch(e){requireRule(false,'NOT_READY',e instanceof Error?e.message:'Legacy local supply is inconsistent.');}
 requireRule(command.accountId===localEditionAccount(s),'NOT_READY','Wrong local account.');
 const earned=Object.keys(s.account.inventory.stacks).filter(k=>/^depth-seal-\d+$/.test(k)&&s.account.inventory.stacks[k]!>0).length;
 s.v4!.legacySealCount??=Math.max(0,s.seals-earned);
 const result=applyIssuance(ledger!,command,editionContextV4(s,ledger!,now));requireRule(result.ok,'NOT_READY',result.ok?'':result.error);
 if(result.replayed)return;
 if(command.kind==='reserve') {const cost=EDITIONS[command.edition].seals;requireRule(Number.isSafeInteger(s.seals)&&s.seals>=cost,'INSUFFICIENT_FUNDS','More boss seals are required.');s.seals-=cost;}
 s.v4!.issuance=result.ledger;
 });
}

/** Tailoring consumes proof identity with the seal balance, in its existing transaction. */
export function spendSealProofsV4(s:DepthAccount,count:number):void {
 if(!s.gameplayV4&&!s.run?.gameplayV4)return;
 const ledger=s.v4?.issuance??createIssuanceLedger('effort',0),earned=Object.keys(s.account.inventory.stacks).filter(k=>/^depth-seal-\d+$/.test(k)&&s.account.inventory.stacks[k]!>0).length;
 s.v4!.legacySealCount??=Math.max(0,s.seals-earned);
 const eligible=editionContextV4(s,ledger,0).effort;
 requireRule(eligible.length>=count,'INSUFFICIENT_FUNDS','More unspent seal receipts are required.');
 s.v4!.spentEffortIds??=[];s.v4!.spentEffortIds.push(...eligible.slice(0,count).map(p=>p.id));
}

/** Keep the legacy API from bypassing v4 receipt accounting; OFF remains exact. */
export function reserveDesignPreviewV4Guard(state:DepthAccount,id:string){
 if(!gameplayV4(state))return legacyReserveDesignPreview(state,id);
 return transactDepth(state,()=>requireRule(false,'NOT_READY','Use the local edition ledger to reserve a design.'));
}
