const recoveryMessages: Record<string, string> = {
  daily_limit: 'Daily limit. Try tomorrow.',
  ip_limit: 'Guest limit. Try later.',
  sponsor_low: 'No gas. Open faucet.',
  gas_unavailable: 'Gas unavailable. Retry.',
  no_item: 'Item unavailable. Refresh.',
  no_intent: 'Seal unavailable. Refresh.',
  bound_item: 'Item cannot be sealed.',
  level_or_inventory: 'Check item and level.',
  seal_unpaid: 'Seal unpaid. Retry.',
  cosmetic_unpaid: 'Unpaid. Retry.',
  cosmetic_locked: 'Style locked. Refresh.',
  no_judge_pass: 'Get a judge pass.',
  tester_budget_exhausted: 'Test grants exhausted.',
  tester_budget_unavailable: 'Test grants unavailable.',
  tester_pool_low: 'Test grants unavailable.',
  request_timeout: 'Request timed out. Retry.',
  invalid_request: 'Request invalid. Refresh.',
  invalid_action: 'Request invalid. Refresh.',
  request_too_large: 'Request invalid. Refresh.',
  campaign_disabled:'Campaign unavailable.',campaign_rules_changed:'Campaign updating.',
  campaign_stale:'Progress changed. Retry.',campaign_conflict:'Request changed. Refresh.',
  campaign_daily_starts:'Daily limit. Try tomorrow.',campaign_choice:'Choose another action.',
  campaign_equipped:'Unequip first.',campaign_source:'Item unavailable. Refresh.',
  campaign_level:'Earn at level 2.',campaign_in_run:'Finish this route.',
  routine_disabled:'Rewards unavailable.',routine_unearned:'Win a boss first.',routine_zero_award:'No rank award.',
  routine_unfinalized:'Season still open.',routine_period:'Period changed. Retry.',routine_cap:'Claim cap reached.',
  routine_budget:'Reward budget exhausted.',routine_expired:'Reward quote expired.',routine_pool:'Rewards unavailable.',
};
export class ChainApiError extends Error {
  constructor(readonly code: string) { super(Object.hasOwn(recoveryMessages, code) ? recoveryMessages[code] : 'Unavailable. Retry.'); this.name = 'ChainApiError'; }
}
export async function chainPost<T>(name: string, token: string, body: unknown = {}): Promise<T> {
  const base = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/,'');
  if (!base) throw new Error('Service unavailable.');
  const response = await fetch(`${base}/functions/v1/${name}`, {method:'POST',
    headers:{'content-type':'application/json',authorization:`Bearer ${token}`}, body:JSON.stringify(body), signal:AbortSignal.timeout(25_000)});
  if (!response.ok) {
    if (response.status === 401) throw new Error('Sign in again.');
    const result: unknown = await response.json().catch(() => null);
    const code = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string' ? result.error : '';
    if(code==='economy_rule'&&result&&typeof result==='object'&&'message' in result&&typeof result.message==='string')throw Object.assign(new Error(result.message.slice(0,160)),{name:'EconomyRuleError'});
    throw new ChainApiError(code);
  }
  return response.json() as Promise<T>;
}
