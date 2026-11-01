import { validateRegistry } from '../../loot';
import { CHAPTERS, CHESTS, GEAR_RARITY_IDS, type ChestReward, type LootRegistry } from '../content';
import { readonlyCopy, type ChestGearOdds, type ChestOdds, type ExactOdds, type ReadonlyData } from './types';

export function exactOdds(probability: number): ExactOdds {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError('Probability must be finite and within 0..1');
  }
  return { probability, chancePct: probability * 100, oneIn: probability === 0 ? null : 1 / probability };
}

/** Current chest gear grammar: an independent chance gate, one nested table, one gear draw.
 * Fail explicitly if that grammar changes instead of labelling expected counts as probabilities.
 * Material/fish lines may have arbitrary counts; they do not alter the independent gear rolls. */
export function chestOdds(chestId: string, registry: LootRegistry<ChestReward> = CHESTS): ReadonlyData<ChestOdds> {
  const problems = validateRegistry(registry);
  if (problems.length) throw new Error(`Invalid chest registry: ${problems.join('; ')}`);
  const chapter = CHAPTERS.find(ch => Object.values(ch.chests).includes(chestId));
  if (!chapter || !Object.hasOwn(registry, chestId)) throw new Error(`Unknown chapter chest: ${chestId}`);
  const rolls: ChestGearOdds[] = [];
  registry[chestId]!.lines.forEach((line, lineIndex) => {
    if (line.pick.every(pick => !('table' in pick.value) && pick.value.kind !== 'gear')) return;
    const entry = line.pick[0];
    if (line.count[0] !== 1 || line.count[1] !== 1 || line.pick.length !== 1 || !entry || !('table' in entry.value)) {
      throw new Error(`Unsupported gear roll in ${chestId} line ${lineIndex}`);
    }
    const table = registry[entry.value.table]!;
    const draw = table.lines[0];
    if (table.lines.length !== 1 || !draw || draw.chance !== 1 || draw.count[0] !== 1 || draw.count[1] !== 1) {
      throw new Error(`Unsupported gear table: ${table.id}`);
    }
    const weights = Object.fromEntries(GEAR_RARITY_IDS.map(rarity => [rarity, 0]));
    let group: ChestGearOdds['group'] | undefined;
    for (const pick of draw.pick) {
      const value = pick.value;
      if ('table' in value || value.kind !== 'gear' || (group && value.group !== group)) {
        throw new Error(`Unsupported mixed gear table: ${table.id}`);
      }
      group = value.group;
      weights[value.rarity] = (weights[value.rarity] ?? 0) + pick.weight;
    }
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (!group || !Number.isFinite(totalWeight)) throw new Error(`Unsupported gear weights: ${table.id}`);
    rolls.push({
      group, tableId: table.id, lineIndex, totalWeight,
      drop: exactOdds(line.chance), noDrop: exactOdds(1 - line.chance),
      rarities: GEAR_RARITY_IDS.map(rarity => {
        const weight = weights[rarity]!;
        const probability = weight / totalWeight;
        return { rarity, weight, conditional: exactOdds(probability), perChest: exactOdds(line.chance * probability) };
      }),
    });
  });
  return readonlyCopy({
    chestId, chapterId: chapter.id, variant: chapter.chests.firstClear === chestId ? 'firstClear' : 'repeat', rolls,
    atLeastOne: GEAR_RARITY_IDS.map(rarity => {
      // p(A or B) = p(A) + (1-p(A))*p(B); avoids cancellation for very small p.
      const probability = rolls.reduce((p, roll) => p + (1 - p) * roll.rarities.find(row => row.rarity === rarity)!.perChest.probability, 0);
      return { rarity, odds: exactOdds(probability) };
    }),
  });
}

export function allChestOdds(): ReadonlyData<Record<string, ChestOdds>> {
  return readonlyCopy(Object.fromEntries(CHAPTERS.flatMap(chapter => Object.values(chapter.chests)).map(id => [id, chestOdds(id)])));
}
