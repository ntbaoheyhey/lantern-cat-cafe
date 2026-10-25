import { CLASS_IDS, CHAPTERS, RECIPES, CLASSES, MATERIALS } from '../content';
import { craft, salvage } from '../forge';
import type { StacksV2 } from '../state/types';
import type { SimResultV2 } from './simulate';
import { V2_CONFIG } from '../config';
import { PROPOSED_V2_OVERRIDES } from './proposal';
import type { ConfigOverridesV2 } from './config';
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
export function checkTargetsV2(results: SimResultV2[], overrides: ConfigOverridesV2 = PROPOSED_V2_OVERRIDES): TargetCheckV2[] {
  const checks: TargetCheckV2[] = [];
  const groups = CLASS_IDS.map((id) => ({ id, runs: results.filter((r) => r.classId === id) }));
  const first = groups.map(({ id, runs }) => ({ id, value: medianV2(runs.map((r) => r.minutesToFirstBossWin)) }));
  checks.push({ id: 'first-boss', ok: first.every((r) => r.value >= 10 && r.value <= 15), detail: first.map((r) => `${r.id} ${format(r.value, 1, 'm')}`).join('; ') });
  const growth = groups.flatMap(({ id, runs }) => CHAPTERS.slice(1).map((ch) => {
    const previous = medianV2(runs.map((r) => r.minutesPerChapter[ch.index - 1]!));
    const current = medianV2(runs.map((r) => r.minutesPerChapter[ch.index]!));
    const ratio = current / previous;
    return { id: `${id} ch${ch.index}`, ratio };
  }));
  checks.push({ id: 'chapter-growth', ok: growth.every((r) => Number.isFinite(r.ratio) && r.ratio >= 1.3 && r.ratio <= 2), detail: growth.map((r) => `${r.id} ${format(r.ratio, 2, 'x')}`).join('; ') });
  const ranges: { id: string; ratio: number }[] = [];
  const spread = CHAPTERS.flatMap((ch) => {
    const times = groups.map(({ id, runs }) => ({ id, value: medianV2(runs.map((r) => r.minutesToChapterBossWin[ch.index]!)) }));
    const center = medianV2(times.map((r) => r.value));
    ranges.push({ id: `ch${ch.index}`, ratio: (Math.max(...times.map((r) => r.value)) - Math.min(...times.map((r) => r.value))) / center });
    return times.map((r) => ({ id: `${r.id} ch${ch.index}`, deviation: r.value / center - 1 }));
  });
  checks.push({ id: 'class-spread', ok: ranges.every((r) => Number.isFinite(r.ratio) && r.ratio >= 0.03) && spread.every((r) => Number.isFinite(r.deviation) && Math.abs(r.deviation) <= 0.15 + 1e-10), detail: ranges.map((r) => `${r.id} range ${format(r.ratio * 100, 1, '%')}`).join('; ') + '; ' + spread.map((r) => `${r.id} ${format(r.deviation * 100, 1, '%')}`).join('; ') });
  const bounds = groups.flatMap(({ id, runs }) => CHAPTERS.map((ch) => ({ id: `${id} ch${ch.index}`, value: medianV2(runs.map((r) => r.minutesPerChapter[ch.index]!)) })));
  checks.push({ id: 'chapter-bounds', ok: bounds.every((r) => r.value >= 10 && r.value <= 360), detail: bounds.map((r) => `${r.id} ${format(r.value, 1, 'm')}`).join('; ') });
  const stuck = results.filter((r) => r.stuck);
  checks.push({ id: 'never-stuck', ok: results.length > 0 && stuck.length === 0, detail: `${stuck.length}/${results.length} runs stuck` });
  checks.push(craftSalvageCheckV2());
  checks.push(walkShareCheckV2(results));
  const bosses = groups.flatMap(({ id, runs }) => CHAPTERS.map((ch) => {
    const samples = runs.map((r) => r.bosses[ch.index]!);
    // Missing attempts count against completeness, never disappear from the denominator.
    const complete = samples.length > 0 && samples.every((b) => b.firstAttemptWon !== null);
    const rate = samples.filter((b) => b.firstAttemptWon === true).length / samples.length;
    const duration = medianV2(samples.flatMap((b) => b.durationsMs));
    return { id: `${id} ch${ch.index}`, complete, rate, duration };
  }));
  checks.push({ id: 'boss-check', ok: bosses.every((b) => b.complete && b.rate >= 0.4 && b.rate <= 0.9 && b.duration <= 180000),
    detail: bosses.map((b) => `${b.id} first win ${format(b.rate * 100, 1, '%')}, median ${format(b.duration / 1000, 2, 's')}${b.complete ? '' : ' (missing attempts)'}`).join('; ') });
  checks.push(guardrailsCheckV2(overrides));
  return checks;
}

export function guardrailsCheckV2(overrides: ConfigOverridesV2): TargetCheckV2 {
  const failures: string[] = [];
  const visit = (source: object, current: object, prefix = '') => {
    for (const [key, value] of Object.entries(source)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const before = (current as Record<string, unknown>)[key];
      if (value && typeof value === 'object') {
        if (!before || typeof before !== 'object') failures.push(`${path}: unknown config object`);
        visit(value, before && typeof before === 'object' ? before : {}, path);
      }
      else if (typeof value === 'number' && (typeof before !== 'number' || !Number.isFinite(value) || value < before * 0.33 || value > before * 3)) failures.push(`${path}: ${value} outside 0.33–3x current ${before}`);
    }
  };
  visit(overrides, V2_CONFIG);
  for (const [path, value, cap] of [
    ['idle.walkTimeMs', overrides.idle?.walkTimeMs ?? V2_CONFIG.idle.walkTimeMs, 2000],
    ['boss.maxMs', overrides.boss?.maxMs ?? V2_CONFIG.boss.maxMs, 180000],
    ['idle.dailyKeys', overrides.idle?.dailyKeys ?? V2_CONFIG.idle.dailyKeys, 3],
  ] as const) if (value > cap) failures.push(`${path}: ${value} > ${cap}`);
  return { id: 'guardrails', ok: failures.length === 0, detail: failures.join('; ') || 'All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3' };
}

export function walkShareCheckV2(results: SimResultV2[]): TargetCheckV2 {
  const rows = CLASS_IDS.flatMap((id) => ['1:1', '3:5'].map((key) => {
    const runs = results.filter((r) => r.classId === id);
    const level = medianV2(runs.map((r) => r.roundSamples[key]?.level ?? null));
    const samples = runs.map((r) => r.roundSamples[key]);
    const walk = medianV2(samples.map((sample) => sample?.walkTimeMs ?? null));
    // deriveStats floors fractional levels; use the same rule for even-cohort medians.
    const ttk = medianV2(samples.map((sample) => sample?.timeToKillByLevelMs[Math.max(1, Math.floor(level)) - 1] ?? null));
    const share = walk / (walk + ttk);
    const complete = runs.length > 0 && Number.isFinite(level) && samples.every((sample) => sample && Number.isFinite(sample.timeToKillByLevelMs[Math.max(1, Math.floor(level)) - 1]));
    return { id: `${id} ch${key.replace(':', ' r')}`, level, share, complete };
  }));
  return { id: 'walk-share', ok: rows.every((r) => r.complete && r.share <= 0.5),
    detail: rows.map((r) => `${r.id} L${format(r.level, 1, '')}: ${format(r.share * 100, 1, '%')}`).join('; ') };
}
