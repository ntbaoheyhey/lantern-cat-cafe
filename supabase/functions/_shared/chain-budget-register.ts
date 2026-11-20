import type {Address} from 'viem';
import {poolSnapshotFields,type TesterPoolSnapshot} from './chain-tester-budget.ts';

export interface RoutineBudgetPlan {
  id:string;contract:string;season:number;source_id:string;rules_hash:string;evidence_hash:string;
  ceiling:string;boss_max:string;rank_max:string;weekly_cap:string;
}
export interface RegisteredRoutineBudget extends RoutineBudgetPlan {enabled:boolean}
/** Reviewed, internal plan -> funded disabled budget. No public route, source
 * authentication, approval, policy activation or voucher signing is implied. */
export function createRoutineBudgetRegistration({contract,snapshot,register,now=()=>Date.now()}:{
  contract:Address;snapshot():Promise<TesterPoolSnapshot>;
  register(request:{budget:RoutineBudgetPlan;pool_balance:string;block:string;block_hash:string}):Promise<RegisteredRoutineBudget>;
  now?:()=>number;
}) {
  return async(plan:RoutineBudgetPlan)=>{
    if(plan.contract!==contract.toLowerCase())throw new Error('routine_budget_contract');
    const result=await register({budget:plan,...poolSnapshotFields(contract,await snapshot(),now())});
    for(const key of Object.keys(plan) as (keyof RoutineBudgetPlan)[])
      if(result[key]!==plan[key])throw new Error('routine_budget_conflict');
    if(typeof result.enabled!=='boolean')throw new Error('routine_budget_conflict');
    return result;
  };
}
