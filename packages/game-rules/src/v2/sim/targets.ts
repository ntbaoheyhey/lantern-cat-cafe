import { CLASS_IDS, CHAPTERS, RECIPES, CLASSES, MATERIALS } from '../content';
import { craft, salvage } from '../forge';
import type { StacksV2 } from '../state/types';
import type { SimResultV2 } from './simulate';
export interface TargetCheckV2 { id: string; ok: boolean; detail: string }
const format = (value: number, digits: number, suffix: string) => Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : 'not reached';
/** Missing milestones are Infinity, so incomplete runs cannot disappear from medians. */
export function medianV2(values: (number | null)[]): number {
  if (!values.length) return Infinity;
  const sorted = values.map((value) => value ?? Infinity).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}
export function craftSalvageCheckV2(): TargetCheckV2 {
  const weights: Record<string, number> = Object.fromEntries(MATERIALS.map((mat) => [mat.id, typeof mat.tier === 'number' ? mat.tier * 100 : 0]));
  weights.fish = 1; weights.yarn = 10;
  const value = (stacks: StacksV2) => Object.entries(stacks).reduce((sum, [id, qty]) => sum + qty * (weights[id] ?? 0), 0);
  const details = RECIPES.map((recipe) => {
    const stacks = { ...recipe.materials, fish: recipe.fish };
    const item = craft({ stacks, lastRelicDay: -1 }, recipe.id, 'weapon', CLASSES[0]!.weaponType, 50, 1).item;
    return { id: recipe.id, cost: value(stacks), returned: value(salvage(item)) };
  });
  return { id: 'craft-salvage-loss', ok: details.every((row) => row.returned < row.cost), detail: details.map((row) => `${row.id}: ${row.returned} < ${row.cost}`).join('; ') };
}
export function checkTargetsV2(results: SimResultV2[]): TargetCheckV2[] {
  const checks: TargetCheckV2[] = [];
  const groups = CLASS_IDS.map((id) => ({ id, runs: results.filter((r) => r.classId === id) }));
  const first = groups.map(({ id, runs }) => ({ id, value: medianV2(runs.map((r) => r.minutesToFirstBossWin)) }));
  checks.push({ id: 'first-boss', ok: first.every((r) => r.value >= 10 && r.value <= 15), detail: first.map((r) => `${r.id} ${format(r.value, 0, 'm')}`).join('; ') });
  const growth = groups.flatMap(({ id, runs }) => CHAPTERS.slice(1).map((ch) => {
    const previous = medianV2(runs.map((r) => r.minutesPerChapter[ch.index - 1]!));
    const current = medianV2(runs.map((r) => r.minutesPerChapter[ch.index]!));
    const ratio = current / previous;
    return { id: `${id} ch${ch.index}`, ratio };
  }));
  checks.push({ id: 'chapter-growth', ok: growth.every((r) => Number.isFinite(r.ratio) && r.ratio >= 1.3 && r.ratio <= 2), detail: growth.map((r) => `${r.id} ${format(r.ratio, 2, 'x')}`).join('; ') });
  const spread = CHAPTERS.flatMap((ch) => {
    const times = groups.map(({ id, runs }) => ({ id, value: medianV2(runs.map((r) => r.minutesToChapterBossWin[ch.index]!)) }));
    const center = medianV2(times.map((r) => r.value));
    return times.map((r) => ({ id: `${r.id} ch${ch.index}`, deviation: r.value / center - 1 }));
  });
  checks.push({ id: 'class-spread', ok: spread.every((r) => Number.isFinite(r.deviation) && Math.abs(r.deviation) <= 0.15 + 1e-10), detail: spread.map((r) => `${r.id} ${format(r.deviation * 100, 1, '%')}`).join('; ') });
  const bounds = groups.flatMap(({ id, runs }) => CHAPTERS.map((ch) => ({ id: `${id} ch${ch.index}`, value: medianV2(runs.map((r) => r.minutesPerChapter[ch.index]!)) })));
  checks.push({ id: 'chapter-bounds', ok: bounds.every((r) => r.value >= 10 && r.value <= 360), detail: bounds.map((r) => `${r.id} ${format(r.value, 0, 'm')}`).join('; ') });
  const stuck = results.filter((r) => r.stuck);
  checks.push({ id: 'never-stuck', ok: results.length > 0 && stuck.length === 0, detail: `${stuck.length}/${results.length} runs stuck` });
  checks.push(craftSalvageCheckV2());
  return checks;
}
