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
  no_judge_pass: 'Get a judge pass.',
  request_timeout: 'Request timed out. Retry.',
  invalid_request: 'Request invalid. Refresh.',
  invalid_action: 'Request invalid. Refresh.',
  request_too_large: 'Request invalid. Refresh.',
};
export class ChainApiError extends Error {
  constructor(code: string) { super(Object.hasOwn(recoveryMessages, code) ? recoveryMessages[code] : 'Unavailable. Retry.'); this.name = 'ChainApiError'; }
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
    throw new ChainApiError(code);
  }
  return response.json() as Promise<T>;
}
