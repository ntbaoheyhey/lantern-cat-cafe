import type {Address} from 'viem';
import {campaignHash,CAMPAIGN_SOURCE} from './chain-campaign.ts';
import type {RoutineReceipt} from './chain-routine.ts';
import {tiedRankAmounts} from '../../../packages/chain/src/rank.ts';

export interface CampaignScore {player:string;wallet:string;score:number;weeks:number}
export interface CampaignRankAward extends CampaignScore {first:number;last:number;amount:string}
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const address=/^0x[0-9a-f]{40}$/;
const hash=/^[0-9a-f]{64}$/;
const amount=(s:string)=>typeof s==='string'&&/^(0|[1-9][0-9]{0,19})$/.test(s)&&BigInt(s)<=12n*10n**18n;

/** Preserve the original1/10/25/50% slots. A tie divides the sum of the
 * occupied slots, rounded down in wei. Giving every tied account the best
 * tier would inflate a100-player1.5-ceiling pool from24.25 to150 YARN. */
export function campaignRankAwards(scores:CampaignScore[],maximum:string):CampaignRankAward[] {
  if(!amount(maximum))throw new Error('routine_amount');
  const players=new Set<string>(),wallets=new Set<string>();
  for(const s of scores){
    if(!uuid.test(s.player)||!address.test(s.wallet)||players.has(s.player)||wallets.has(s.wallet)||
      !Number.isInteger(s.weeks)||s.weeks<1||s.weeks>13||!Number.isInteger(s.score)||s.score<s.weeks||s.score>s.weeks*3)
      throw new Error('routine_scores');
    players.add(s.player);wallets.add(s.wallet);
  }
  const ordered=[...scores].sort((a,b)=>b.score-a.score||a.player.localeCompare(b.player));
  const result:CampaignRankAward[]=[],n=ordered.length;
  const amounts=tiedRankAmounts(ordered.map(s=>s.score),BigInt(maximum));
  for(let i=0;i<n;){
    let end=i+1;while(end<n&&ordered[end]!.score===ordered[i]!.score)end++;
    const equal=amounts[i]!.toString();
    for(let j=i;j<end;j++)result.push({...ordered[j]!,first:i+1,last:end,amount:equal});
    i=end;
  }
  return result;
}

export interface CampaignRewardEvidence {
  program:{contract:string;epoch:number;rules_hash:string;first_season:number;last_season:number;enabled:boolean};
  budget:{id:string;contract:string;season:number;source_id:string;rules_hash:string;boss_max:string;rank_max:string;enabled:boolean};
  boss:{player_id:string;run_id:number;revision:number;wallet:string;rules_hash:string;chapter:number;completed_at:string}|null;
  rank:{contract:string;season:number;rules_hash:string;closed_at:string;scores:CampaignScore[]}|null;
  earningBudget:{id:string;contract:string;season:number;source_id:string;rules_hash:string;rank_max:string}|null;
}

/** Service-only bridge. Receipt selectors are NOT evidence. The store reads
 * immutable campaign wins or the closed snapshot; no amount/score comes from
 * the caller. Budget registration, demand review, signing and activation stay
 * separate. Zero awards produce no payable receipt. */
export function createCampaignRewardAuthority({enabled=false,contract,epoch,rulesHash,read}:{
  enabled?:boolean;contract:Address;epoch:number;rulesHash:string;
  read(player:string,wallet:string,contract:string,kind:RoutineReceipt['kind'],period:number):Promise<CampaignRewardEvidence>;
}){
  return async(player:string,wallet:Address,receiptId:string):Promise<RoutineReceipt>=>{
    if(!enabled)throw new Error('routine_disabled');
    const match=/^([0-9a-f-]{36}):(weekly-boss|season-rank):([0-9]{1,9})$/.exec(receiptId);
    if(!match||match[1]!==player||!uuid.test(player)||!address.test(wallet.toLowerCase())||!address.test(contract.toLowerCase())||
       !hash.test(rulesHash)||!Number.isSafeInteger(epoch)||epoch<345600||(epoch-345600)%604800!==0)
      throw new Error('routine_identity');
    const kind=match[2] as RoutineReceipt['kind'],period=Number(match[3]);
    if(String(period)!==match[3])throw new Error('routine_identity');
    const e=await read(player,wallet.toLowerCase(),contract.toLowerCase(),kind,period),p=e.program,b=e.budget;
    if(!p.enabled||!b.enabled||p.contract!==contract.toLowerCase()||b.contract!==p.contract||p.epoch!==epoch||
      p.rules_hash!==rulesHash||b.rules_hash!==rulesHash||b.source_id!==CAMPAIGN_SOURCE||
      !Number.isInteger(p.first_season)||p.first_season<0||p.last_season!==p.first_season||
      !Number.isInteger(b.season)||b.season<0||!b.id||b.id.length>160||!amount(b.boss_max)||!amount(b.rank_max))
      throw new Error('routine_policy');
    let value:string,finalizedAt:number,proof:unknown;
    if(kind==='weekly-boss'){
      const f=e.boss;
      if(!f||f.player_id!==player||f.wallet!==wallet.toLowerCase()||f.rules_hash!==rulesHash||
        !Number.isInteger(f.run_id)||f.run_id<1||!Number.isInteger(f.revision)||f.revision<1||
        !Number.isInteger(f.chapter)||f.chapter<1||f.chapter>3)throw new Error('routine_authority');
      finalizedAt=Math.floor(Date.parse(f.completed_at)/1000);
      if(!Number.isSafeInteger(finalizedAt)||Math.floor((finalizedAt-345600)/604800)!==period||
        Math.floor((finalizedAt-epoch)/7862400)!==b.season||b.season!==p.first_season)
        throw new Error('routine_period');
      value=b.boss_max;proof=f;
    }else{
      const s=e.rank;
      if(!s||s.contract!==p.contract||s.rules_hash!==rulesHash||s.season!==period||period!==p.first_season||b.season!==period+1)
        throw new Error('routine_authority');
      finalizedAt=Math.floor(Date.parse(s.closed_at)/1000);
      if(!Number.isSafeInteger(finalizedAt)||finalizedAt<epoch+(period+1)*7862400)throw new Error('routine_unfinalized');
      const earned=e.earningBudget;
      if(!earned||!earned.id||earned.contract!==p.contract||earned.season!==period||
        earned.source_id!==CAMPAIGN_SOURCE||earned.rules_hash!==rulesHash||!amount(earned.rank_max))
        throw new Error('routine_earning_budget');
      // The next season funds settlement; it cannot rewrite the earned tier.
      // A smaller current cap may refuse/expire the FULL claim, never fabricate
      // a partial payout or a second nonce for the same earned event.
      const award=campaignRankAwards(s.scores,earned.rank_max).find(a=>a.player===player&&a.wallet===wallet.toLowerCase());
      if(!award)throw new Error('routine_unearned');
      value=award.amount;proof={snapshot:s,earningBudget:earned};
    }
    if(BigInt(value)===0n)throw new Error('routine_zero_award');
    return {sourceId:CAMPAIGN_SOURCE,receiptId,playerId:player,wallet,kind,earningPeriod:period,
      rulesHash,evidenceHash:await campaignHash(['campaign-reward-v1',p,b,proof]),finalizedAt,eligible:true,budgetId:b.id,amount:value};
  };
}
