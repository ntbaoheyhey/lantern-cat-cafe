import type { ServerStateV2 } from '../../api/GameApiV2';

/** Claim progress controls the number of visual defeats; presentation never awards kills. */
export function claimedKills(before: ServerStateV2 | null, after: ServerStateV2): number {
  if (!before || before.progress.chapter !== after.progress.chapter) return 0;
  const p = before.progress, n = after.progress;
  return Math.max(0, (n.round - p.round) * n.killsPerRound + n.kills - p.kills);
}
