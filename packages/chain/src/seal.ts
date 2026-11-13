/** Versioned experiments, never an inferred market valuation. The server chooses
 * the policy; pending reservations keep their original exact cost. */
export type SealPricePolicy = 'standard-v1' | 'basket-trial-v1';
export function readSealPolicy(value: unknown): SealPricePolicy {
  // Older servers omit the field and use the original10% policy.
  if (value === undefined || value === 'standard-v1') return 'standard-v1';
  if (value === 'basket-trial-v1') return value;
  throw new Error('Quote changed. Retry.');
}
export function sealPrice(referenceYarn: number, policy: SealPricePolicy = 'standard-v1'): bigint {
  const checked = readSealPolicy(policy);
  if (!Number.isSafeInteger(referenceYarn) || referenceYarn <= 0) throw new Error('Quote changed. Retry.');
  return BigInt(referenceYarn) * 10n ** 18n * (checked === 'basket-trial-v1' ? 500n : 1000n) / 10000n;
}
