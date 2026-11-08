import { expectedCounts } from '../../loot';
import { CHAPTERS } from '../content/chapters';
import { CHESTS, type ChestReward } from '../content/chests';
import { MATERIALS, MATERIAL_IDS, type MaterialId } from '../content/materials';
import { GEAR_RARITY_IDS, type GearRarityId } from '../content/rarities';

type GearGroup = Extract<ChestReward, { kind: 'gear' }>['group'];
const GEAR_GROUPS: readonly GearGroup[] = ['main', 'accessory'];

export interface ChestExpectedValues {
  tableId: string;
  /** Fish currency, after multiplying reward units by their amount (FISH_UNIT today). */
  fish: number;
  materials: Record<MaterialId, number>;
  /** Expected item counts per chest, including zeroes for absent rarities. */
  gear: Record<GearGroup, Record<GearRarityId, number>>;
  totalGear: number;
}

/** Analytic quantities from V4; no sampling, rounding, or invented rarity weights. */
export function chestExpectedValues(tableId: string): ChestExpectedValues {
  const rewards = new Map<string, ChestReward>();
  const counts = expectedCounts(CHESTS, tableId, (reward) => {
    const key = JSON.stringify(reward);
    rewards.set(key, reward);
    return key;
  });
  const rarityCounts = (): Record<GearRarityId, number> => ({
    common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0,
  });
  const summary: ChestExpectedValues = {
    tableId,
    fish: 0,
    materials: { yarn: 0, fluffTuft: 0, shinyButton: 0, catnipCrystal: 0, starlightScale: 0, moonPearl: 0, catKey: 0 },
    gear: { main: rarityCounts(), accessory: rarityCounts() },
    totalGear: 0,
  };
  for (const [key, count] of Object.entries(counts)) {
    const reward = rewards.get(key)!;
    if (reward.kind === 'fish') summary.fish += count * reward.amount;
    else if (reward.kind === 'material') summary.materials[reward.id] += count * reward.amount;
    else {
      summary.gear[reward.group][reward.rarity] += count;
      summary.totalGear += count;
    }
  }
  return summary;
}

export interface ChestDropRateRow {
  chapter: number;
  tableId: string;
  chest: 'first' | 'repeat';
  reward: string;
  /** Probability of at least one matching reward, not expected quantity or conditional rarity. */
  dropChance: number;
  expectedAmount: number;
}

/** Complement of the probability of no matches, respecting independent lines and nested picks. */
function dropChance(tableId: string, matches: (reward: ChestReward) => boolean): number {
  const noDrop = (id: string): number => CHESTS[id]!.lines.reduce((allLines, line) => {
    // Scale weights just as V4 does before normalizing them.
    const scale = Math.max(...line.pick.map((entry) => entry.weight));
    const total = line.pick.reduce((sum, entry) => sum + entry.weight / scale, 0);
    const hit = line.pick.reduce((sum, { weight, value }) => sum + weight / scale / total * (
      'table' in value ? 1 - noDrop(value.table) : matches(value) ? 1 : 0
    ), 0);
    const miss = Math.max(0, Math.min(1, 1 - hit));
    const [min, max] = line.count;
    let meanMiss = 0;
    for (let count = min; count <= max; count++) meanMiss += miss ** count / (max - min + 1);
    return allLines * (1 - line.chance + line.chance * meanMiss);
  }, 1);
  // chestExpectedValues has already validated the registry and nesting via V4.
  return Math.max(0, Math.min(1, 1 - noDrop(tableId)));
}

/** Stable numeric rows for the generated documentation, in chapter/variant/reward order. */
export function chestDropRateRows(): ChestDropRateRow[] {
  return CHAPTERS.flatMap((chapter) => (['first', 'repeat'] as const).flatMap((chest) => {
    const tableId = chest === 'first' ? chapter.chests.firstClear : chapter.chests.repeat;
    const summary = chestExpectedValues(tableId);
    const row = (reward: string, expectedAmount: number, matches: (value: ChestReward) => boolean): ChestDropRateRow => ({
      chapter: chapter.index, tableId, chest, reward, expectedAmount, dropChance: dropChance(tableId, matches),
    });
    return [
      row('Fish', summary.fish, (value) => value.kind === 'fish'),
      ...MATERIAL_IDS.map((id) => row(MATERIALS.find((material) => material.id === id)!.name,
        summary.materials[id], (value) => value.kind === 'material' && value.id === id)),
      ...GEAR_GROUPS.flatMap((group) => [
        row(`${group} gear (all rarities)`, Object.values(summary.gear[group]).reduce((sum, n) => sum + n, 0),
          (value) => value.kind === 'gear' && value.group === group),
        ...GEAR_RARITY_IDS.map((rarity) => row(`${group} gear: ${rarity}`, summary.gear[group][rarity],
          (value) => value.kind === 'gear' && value.group === group && value.rarity === rarity)),
      ]),
      row('All gear items', summary.totalGear, (value) => value.kind === 'gear'),
    ];
  }));
}
