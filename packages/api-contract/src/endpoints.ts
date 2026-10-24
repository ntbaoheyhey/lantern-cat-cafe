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
