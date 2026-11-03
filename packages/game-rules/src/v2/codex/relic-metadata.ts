/** Existing first-party names from apps/web/public/relics/{1,2,3,4}.json.
 * The rules registry pins token IDs but has no names. This small presentation projection avoids
 * importing web JSON into Edge Functions; generator tests fail on any metadata/name drift. */
export const RELIC_NAMES: Readonly<Record<number, string>> = {
  1: 'Paw Charm',
  2: 'Silver Bell',
  3: 'Moon Collar',
  4: 'Golden Maneki',
};
