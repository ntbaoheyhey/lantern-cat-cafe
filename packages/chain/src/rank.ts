/** A finite percentile pool: ties share the slots they occupy, in integer wei.
 * Callers supply unique identities separately. Returned order matches input. */
export function tiedRankAmounts(scores: readonly number[], maximum: bigint): bigint[] {
  if (maximum < 0n || maximum > 12n * 10n ** 18n ||
      scores.some(score => !Number.isSafeInteger(score) || score < 1 || score > 39))
    throw new Error('routine_scores');
  const ordered = scores.map((score, index) => ({score, index})).sort((a, b) => b.score - a.score);
  const result = scores.map(() => 0n), n = scores.length;
  for (let start = 0; start < n;) {
    let end = start + 1;
    while (end < n && ordered[end]!.score === ordered[start]!.score) end++;
    let pool = 0n;
    for (let position = start + 1; position <= end; position++) {
      const weight = position * 100 <= n ? 6 : position * 10 <= n ? 4 : position * 4 <= n ? 2 : position * 2 <= n ? 1 : 0;
      pool += maximum * BigInt(weight) / 6n;
    }
    const equal = pool / BigInt(end - start);
    for (let i = start; i < end; i++) result[ordered[i]!.index] = equal;
    start = end;
  }
  return result;
}
