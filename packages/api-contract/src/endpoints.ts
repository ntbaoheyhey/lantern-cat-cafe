/** The Edge Function names the client calls (POST /functions/v1/<name>, docs/api.md). */
export const ENDPOINTS = [
  'game-state',
  'idle-claim',
  'equip',
  'boss-fight',
  'upgrade',
  'relic-forge',
  'relic-mint-report',
] as const;

export type Endpoint = (typeof ENDPOINTS)[number];

/** v2-craft and v2-boss-fight accept an optional UUID v4 requestId. Reuse it only for the
 * same action/intent; success replays the stored result. Omission retains legacy behavior. */
export const IDEMPOTENT_ENDPOINTS_V2 = ['v2-craft', 'v2-boss-fight'] as const;
