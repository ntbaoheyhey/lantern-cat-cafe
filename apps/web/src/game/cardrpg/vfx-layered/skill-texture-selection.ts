/** Pair-reviewed art selected for full action integration. Keep unselected layers
 * procedural even if a loader has decoded other entries in the V5 manifest.
 * Per-file hashes and full runtime decisions live in reports/v5/CXV. */
export const V5_INTEGRATED_TEXTURES: ReadonlySet<string> = new Set([
  'mochi-slash',
  'mochi-ult-release',
  'clover-impact',
  'clover-ult-charge',
  'clover-ult-release',
  'panko-impact',
  'panko-slash',
  'panko-ult-charge',
  'panko-ult-release',
  'soot-impact',
  'soot-ult-charge',
  'soot-ult-release',
]);

export const selectedSkillTexture = (key: string): string => V5_INTEGRATED_TEXTURES.has(key) ? key : '';
