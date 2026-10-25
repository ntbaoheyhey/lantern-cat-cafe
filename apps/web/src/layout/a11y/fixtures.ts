import { vi } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import type {
  GainsV2,
  ItemV2,
  LootV2,
  ServerStateV2,
} from '../../api/GameApiV2';
import type { ClassPickerProps } from '../classpicker/ClassPicker';
import type { ForgePanelProps, ForgePanelRelic } from '../forge/ForgePanel';
import type { LootSummaryProps } from '../loot/LootSummary';
import type { ChestRevealProps } from '../loot/ChestReveal';
import type { WelcomeBackProps } from '../loot/WelcomeBack';
import type { BossGatePanelProps } from '../boss/BossGatePanel';

// ---------------------------------------------------------------------------
// Realistic sample items with valid registry keys and UUID-style row ids
// ---------------------------------------------------------------------------

export const SAMPLE_SWORD_TWIG: ItemV2 = {
  id: '10000000-0000-0000-0000-000000000001',
  itemKey: 'wpn.sword.twig',
  slot: 'weapon',
  weaponType: 'sword',
  rarity: 'common',
  level: 1,
  bonus: [],
  locked: false,
  equipped: false,
};

export const SAMPLE_SWORD_TIN: ItemV2 = {
  id: '10000000-0000-0000-0000-000000000002',
  itemKey: 'wpn.sword.tin',
  slot: 'weapon',
  weaponType: 'sword',
  rarity: 'uncommon',
  level: 3,
  bonus: [{ stat: 'critChance', value: 0.02 }],
  locked: false,
  equipped: false,
};

export const SAMPLE_HELMET_COZY: ItemV2 = {
  id: '10000000-0000-0000-0000-000000000003',
  itemKey: 'arm.cozy.helmet.common',
  slot: 'helmet',
  rarity: 'common',
  level: 2,
  bonus: [],
  locked: true,
  equipped: false,
};

export const SAMPLE_BOOTS_COZY_EQUIPPED: ItemV2 = {
  id: '10000000-0000-0000-0000-000000000004',
  itemKey: 'arm.cozy.boots.common',
  slot: 'boots',
  rarity: 'common',
  level: 2,
  bonus: [],
  locked: false,
  equipped: true,
};

export const SAMPLE_BELL_COLLAR: ItemV2 = {
  id: '10000000-0000-0000-0000-000000000005',
  itemKey: 'acc.bell.common',
  slot: 'collar',
  rarity: 'common',
  level: 1,
  bonus: [],
  locked: false,
  equipped: false,
};

// ---------------------------------------------------------------------------
// Loot & Gains builders
// ---------------------------------------------------------------------------

export function sampleLootV2(overrides?: Partial<LootV2>): LootV2 {
  return {
    fish: 1250,
    yarn: 25,
    keys: 1,
    materials: {
      fluffTuft: 4,
      shinyButton: 2,
    },
    items: [SAMPLE_SWORD_TWIG, SAMPLE_SWORD_TIN],
    autoSalvaged: [],
    ...overrides,
  };
}

export function emptyLootV2(): LootV2 {
  return {
    fish: 0,
    yarn: 0,
    keys: 0,
    materials: {},
    items: [],
    autoSalvaged: [],
  };
}

export function sampleGainsV2(overrides?: Partial<GainsV2>): GainsV2 {
  return {
    ...sampleLootV2(),
    xp: 450,
    levelsGained: 1,
    ...overrides,
  };
}

export function emptyGainsV2(): GainsV2 {
  return {
    ...emptyLootV2(),
    xp: 0,
    levelsGained: 0,
  };
}

// ---------------------------------------------------------------------------
// ServerStateV2 builder for BossGatePanel and general state tests
// ---------------------------------------------------------------------------

export function sampleServerStateV2(overrides?: Partial<{
  classId: ServerStateV2['cat']['classId'];
  level: number;
  chapter: number;
  round: number;
  kills: number;
  killsPerRound: number;
  gated: boolean;
  neededPower: number;
  keys: number;
  cooldownUntil: number | null;
  clearedChapters: number[];
}>): ServerStateV2 {
  const currentChapter = overrides?.chapter ?? 1;
  const cleared = (overrides?.clearedChapters ?? []).map((ch) => ({
    chapter: ch,
    cleared: true,
    wins: 1,
  }));

  return {
    cat: {
      classId: overrides?.classId !== undefined ? overrides.classId : 'warrior',
      level: overrides?.level ?? 10,
      xp: 40,
      xpToNext: 100,
    },
    progress: {
      chapter: currentChapter,
      round: overrides?.round ?? 10,
      kills: overrides?.kills ?? 6,
      killsPerRound: overrides?.killsPerRound ?? 6,
      gated: overrides?.gated ?? false,
      neededPower: overrides?.neededPower ?? 0,
    },
    currencies: {
      fish: 5000,
      yarn: 120,
      keys: overrides?.keys !== undefined ? overrides.keys : 1,
    },
    materials: {
      fluffTuft: 25,
      shinyButton: 12,
      catnipCrystal: 8,
      starlightScale: 4,
      moonPearl: 2,
    },
    inventory: [
      SAMPLE_SWORD_TWIG,
      SAMPLE_SWORD_TIN,
      SAMPLE_HELMET_COZY,
      SAMPLE_BOOTS_COZY_EQUIPPED,
      SAMPLE_BELL_COLLAR,
    ],
    bagLimit: 200,
    equipped: {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: SAMPLE_BOOTS_COZY_EQUIPPED.id,
      collar: null,
      earring: null,
      ring: null,
      charm: null,
    },
    unlockedSlots: ['weapon', 'helmet', 'armor', 'gloves', 'boots'],
    bosses: {
      chapters: cleared,
      cooldownUntil: overrides?.cooldownUntil !== undefined ? overrides.cooldownUntil : null,
    },
    forge: {
      blockedBy: null,
      forgedToday: false,
      pending: null,
      today: null,
    },
    founder: false,
    serverTime: 1000,
  };
}

// ---------------------------------------------------------------------------
// Component Props Builders
// ---------------------------------------------------------------------------

export function classPickerProps(overrides?: Partial<ClassPickerProps>): ClassPickerProps {
  return {
    classes: v2.CLASSES,
    selected: 'warrior',
    locked: false,
    onChoose: vi.fn(),
    ...overrides,
  };
}

export function forgePanelProps(overrides?: Partial<ForgePanelProps>): ForgePanelProps {
  const defaultRelic: ForgePanelRelic = {
    today: null,
    pending: null,
    blockedReason: null,
  };

  return {
    stacks: {
      fish: 1000,
      yarn: 50,
      fluffTuft: 20,
      shinyButton: 10,
      catnipCrystal: 5,
      starlightScale: 2,
      moonPearl: 1,
    },
    items: [
      SAMPLE_SWORD_TWIG,
      SAMPLE_SWORD_TIN,
      SAMPLE_HELMET_COZY,
      SAMPLE_BOOTS_COZY_EQUIPPED,
      SAMPLE_BELL_COLLAR,
    ],
    relic: defaultRelic,
    classWeaponType: 'sword',
    onCraft: vi.fn(),
    onSalvage: vi.fn(),
    onRelic: vi.fn(),
    defaultTab: 'craft',
    defaultSlot: 'weapon',
    defaultRarity: 'common',
    ...overrides,
  };
}

export function lootSummaryProps(overrides?: Partial<LootSummaryProps>): LootSummaryProps {
  return {
    loot: sampleLootV2(),
    heading: 'Battle Loot',
    headingLevel: 2,
    ...overrides,
  };
}

export function chestRevealProps(overrides?: Partial<ChestRevealProps>): ChestRevealProps {
  return {
    chest: sampleLootV2(),
    firstClear: false,
    onDone: vi.fn(),
    ...overrides,
  };
}

export function welcomeBackProps(overrides?: Partial<WelcomeBackProps>): WelcomeBackProps {
  return {
    gains: sampleGainsV2(),
    awaySeconds: 7200, // 2 hours
    onClose: vi.fn(),
    ...overrides,
  };
}

export function bossGatePanelProps(overrides?: Partial<BossGatePanelProps>): BossGatePanelProps {
  return {
    state: sampleServerStateV2({ chapter: 1, round: 10, kills: 6, keys: 1 }),
    chapter: 1,
    nowS: 1000,
    busy: false,
    onFight: vi.fn(),
    onSelectChapter: vi.fn(),
    ...overrides,
  };
}
