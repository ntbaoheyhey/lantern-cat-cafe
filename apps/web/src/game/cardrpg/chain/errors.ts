import { ChainApiError } from './api';
function errorCauses(error: unknown): Error[] {
  const causes: Error[] = [];
  let cause = error;
  while (cause instanceof Error && !causes.includes(cause)) {
    causes.push(cause);
    cause = cause.cause;
  }
  return causes;
}

/** Only an actual chain mismatch should tell a guest to switch networks. */
export function signInError(error: unknown): string {
  const causes = errorCauses(error), text = causes.map(cause => cause.message).join('\n');
  const named = (name: string) => causes.some(cause => cause.name === name);
  const apiError = causes.find(cause => cause instanceof ChainApiError);
  if (apiError) return apiError.message;
  if (named('UserRejectedRequestError') || causes.some(cause => (cause as Error & {code?:number}).code === 4001) || /user (rejected|denied)|signature (rejected|declined)/i.test(text)) return 'Signature declined. Try again.';
  if (named('ChainMismatchError') || causes.some(cause => cause.message === 'Switch to Fuji.')) return 'Switch to Fuji.';
  const recovery = causes.find(cause => ['Allow browser storage.', 'Guest key needs recovery.', 'Wallet changed. Sign in again.'].includes(cause.message));
  if (recovery) return recovery.message;
  if (named('ProviderNotFoundError') || named('ConnectorNotFoundError') || causes.some(cause => /^(No wallet|Wallet unavailable\. Play free\.)$/.test(cause.message))) return 'Install Core or MetaMask, or play free.';
  if (/rpc|failed to fetch|network error|fetch failed|timed out/i.test(text) || named('HttpRequestError') || named('TimeoutError')) return 'Connection unavailable. Retry or play offline.';
  return 'Sign-in offline. Retry or play offline.';
}
/** Viem's context names the chain even when the failure is gas, RPC or a revert. */
export function friendlyError(error: unknown): string {
  if (error instanceof ChainApiError) return error.message;
  if (error instanceof Error && error.name === 'EconomyRuleError') return error.message;
  const causes = errorCauses(error);
  const text = causes.map(e => e.message).join('\n');
  const named = (name: string) => causes.some(e => e.name === name);
  if (named('ChainMismatchError') || causes.some(e => e.message === 'Switch to Fuji.')) return 'Switch to Fuji.';
  if (named('InsufficientFundsError') || /insufficient funds/i.test(text)) return 'No gas. Open faucet.';
  if (/Cooldown/.test(text)) return 'Wait 10 minutes.';
  if (named('UserRejectedRequestError') || /user (rejected|denied)/i.test(text)) return 'Cancelled. Retry.';
  if (/revert|Transaction failed/i.test(text)) return 'Transaction failed. Retry.';
  if (text === 'Sign in again.') return text;
  if (text === 'Wallet changed. Sign in again.' || text === 'Guest key needs recovery.' || text === 'Allow browser storage.') return text;
  if (text === 'Invalid price.') return text;
  if (text === 'Quote changed. Retry.' || text === 'Forge changed. Retry.' || text === 'Select two Epics.') return text;
  return 'Unavailable. Retry.';
}
