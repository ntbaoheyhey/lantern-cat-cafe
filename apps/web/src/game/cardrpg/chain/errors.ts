/** Viem's context names the chain even when the failure is gas, RPC or a revert. */
export function friendlyError(error: unknown): string {
  const causes: Error[] = [];
  let cause = error;
  while (cause instanceof Error && !causes.includes(cause)) {
    causes.push(cause);
    cause = cause.cause;
  }
  const text = causes.map(e => e.message).join('\n');
  const named = (name: string) => causes.some(e => e.name === name);
  if (named('ChainMismatchError') || causes.some(e => e.message === 'Switch to Fuji.')) return 'Switch to Fuji.';
  if (named('InsufficientFundsError') || /insufficient funds/i.test(text)) return 'No gas. Open faucet.';
  if (/Cooldown/.test(text)) return 'Wait 10 minutes.';
  if (named('UserRejectedRequestError') || /user (rejected|denied)/i.test(text)) return 'Cancelled. Retry.';
  if (/revert|Transaction failed/i.test(text)) return 'Transaction failed. Retry.';
  if (text === 'Sign in again.') return text;
  if (text === 'Invalid price.') return text;
  return 'Unavailable. Retry.';
}
