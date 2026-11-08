export const MATERIAL_IDS = [
  'yarn',
  'fluffTuft',
  'shinyButton',
  'catnipCrystal',
  'starlightScale',
  'moonPearl',
  'catKey',
] as const;
export type MaterialId = (typeof MATERIAL_IDS)[number];

export interface MaterialDef {
  id: MaterialId;
  name: string;
  /** 0 = base (Yarn), 1..4 = crafting tiers; 'relic' and 'key' are special. */
  tier: 0 | 1 | 2 | 3 | 4 | 'relic' | 'key';
  /** Most a player can hold. */
  maxStack: number;
  /** v1 field this material is stored in today (Yarn is the existing shards). */
  v1Field?: 'shards' | 'bossKeys';
}

export const MATERIALS: readonly MaterialDef[] = [
  { id: 'yarn', name: 'Yarn', tier: 0, maxStack: 999_999, v1Field: 'shards' },
  { id: 'fluffTuft', name: 'Fluff Tuft', tier: 1, maxStack: 99_999 },
  { id: 'shinyButton', name: 'Shiny Button', tier: 2, maxStack: 99_999 },
  { id: 'catnipCrystal', name: 'Catnip Crystal', tier: 3, maxStack: 9_999 },
  { id: 'starlightScale', name: 'Starlight Scale', tier: 4, maxStack: 9_999 },
  { id: 'moonPearl', name: 'Moon Pearl', tier: 'relic', maxStack: 999 },
  { id: 'catKey', name: 'Cat Key', tier: 'key', maxStack: 5, v1Field: 'bossKeys' },
];
