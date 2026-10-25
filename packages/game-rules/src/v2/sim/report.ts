import { CLASS_IDS, CHAPTERS } from '../content';
import { V2_CONFIG } from '../config';
import { NOT_OVERRIDABLE_V2 } from './config';
import { PROPOSED_V2_OVERRIDES, PROPOSAL_REASONS_V2 } from './proposal';
import { checkTargetsV2, medianV2 } from './targets';
import type { SimResultV2 } from './simulate';
export function proposedChangesV2(): { path: string; current: unknown; proposed: unknown; why: string }[] {
  const rows: ReturnType<typeof proposedChangesV2> = [];
  function visit(source: object, current: object, prefix = '') {
    for (const [key, value] of Object.entries(source)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const before = (current as Record<string, unknown>)[key];
      if (typeof value === 'object' && value !== null) visit(value, before as object, path);
      else rows.push({ path, current: before, proposed: value, why: PROPOSAL_REASONS_V2[path] ?? 'Unexplained change; do not apply.' });
    }
  }
  visit(PROPOSED_V2_OVERRIDES, V2_CONFIG);
  return rows;
}
export const shownV2 = (n: number) => Number.isFinite(n) ? String(Math.round(n * 100) / 100) : 'not reached';
/** Linear-interpolated quartiles; missing wins remain Infinity. */
export function percentileV2(values: (number | null)[], fraction: number): number {
  if (!values.length) return Infinity;
  const sorted = values.map((v) => v ?? Infinity).sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lo = sorted[Math.floor(position)]!; const hi = sorted[Math.ceil(position)]!;
  return lo === hi ? lo : lo + (hi - lo) * (position - Math.floor(position));
}
export function timesV2(results: SimResultV2[], quartiles = false): string {
  return ['| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...CLASS_IDS.map((id) => {
      const runs = results.filter((r) => r.classId === id);
      const cells = CHAPTERS.map((ch) => {
        const values = runs.map((r) => r.minutesToChapterBossWin[ch.index]!);
        return quartiles ? [0.25, 0.5, 0.75].map((q) => shownV2(percentileV2(values, q))).join(' / ') : shownV2(medianV2(values));
      });
      return `| ${id} | ${[...cells, ...([20, 40] as const).map((level) => shownV2(medianV2(runs.map((r) => r.minutesToLevel[level]))))].join(' | ')} |`;
    })].join('\n');
}
export function bossTableV2(results: SimResultV2[]): string {
  return ['| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |', '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...CLASS_IDS.flatMap((id) => CHAPTERS.map((ch) => {
      const runs = results.filter((r) => r.classId === id);
      const bosses = runs.map((r) => r.bosses[ch.index]!);
      return `| ${id} | ${ch.index} | ${bosses.reduce((n, b) => n + b.fights, 0)} | ${bosses.reduce((n, b) => n + b.losses, 0)} | ${bosses.filter((b) => b.firstAttemptWon === true).length} / ${runs.length} | ${shownV2(medianV2(bosses.flatMap((b) => b.durationsMs)) / 1000)} |`;
    }))].join('\n');
}
export function killTableV2(results: SimResultV2[]): string {
  return ['| class | ch1 r1 | ch3 r1 | ch3 r5 | ch5 r1 |', '| --- | ---: | ---: | ---: | ---: |', ...CLASS_IDS.map((id) => {
    const runs = results.filter((r) => r.classId === id);
    return `| ${id} | ${['1:1', '3:1', '3:5', '5:1'].map((key) => {
      const level = medianV2(runs.map((r) => r.roundSamples[key]?.level ?? null));
      const ttk = medianV2(runs.map((r) => r.roundSamples[key]?.timeToKillMs ?? null));
      return `${shownV2(ttk)} ms (L${shownV2(level)})`;
    }).join(' | ')} |`;
  })].join('\n');
}
export function classDifferencesV2(results: SimResultV2[]): string {
  const chapters = CHAPTERS.map((ch) => {
    const rows = CLASS_IDS.map((id) => ({ id, value: medianV2(results.filter((r) => r.classId === id).map((r) => r.minutesToChapterBossWin[ch.index]!)) })).sort((a, b) => a.value - b.value);
    if (!Number.isFinite(rows[0]!.value)) return `Ch${ch.index}: no class has a finite median clear`;
    const fastest = rows.filter((r) => r.value === rows[0]!.value);
    const slowest = rows.filter((r) => r.value === rows[rows.length - 1]!.value);
    return `Ch${ch.index}: fastest ${fastest.map((r) => r.id).join(', ')} (${shownV2(rows[0]!.value)}m), slowest ${slowest.map((r) => r.id).join(', ')} (${shownV2(rows[rows.length - 1]!.value)}m)`;
  });
  const losses = CLASS_IDS.map((id) => ({ id, count: results.filter((r) => r.classId === id).reduce((n, r) => n + r.bossLosses, 0) })).sort((a, b) => b.count - a.count);
  return `${chapters.join('; ')}. Boss losses, most first: ${losses.map((r) => `${r.id} ${r.count}`).join(', ')}. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.`;
}
export function renderNumbersReportV2(current: SimResultV2[], proposed: SimResultV2[], diagnostic: SimResultV2[] = []): string {
  const before = checkTargetsV2(current, {});
  const after = checkTargetsV2(proposed);
  const changes = proposedChangesV2();
  const failures = after.filter((r) => !r.ok);
  return `# Cat RPG v2 numbers proposal (V6c)

Proposal only. V2_CONFIG unchanged. Needs the user's sign-off. Main run: seven classes, seeds 1–20, stepMinutes 2, maximum 1,800 active minutes. Diagnostic: stepMinutes 1, seeds 1–5, same horizon. Greedy equipment, up to three improving crafts per claim, salvage at 90% bag usage, boss attempts at the frontier. Stop after chapter five's first clear. Null milestones remain Infinity in every timing target and percentile.

**Status:** ${failures.length ? `NOT READY FOR SIGN-OFF. Failing targets: ${failures.map((r) => r.id).join(', ')}. The bounded config search found no all-targets solution; this is a fallback candidate, not an approved balance.` : 'All measured targets pass on the reported seeds; user approval is still required.'}

## Targets

| id | target in words | current result | proposed result | ok? |
| --- | --- | --- | --- | --- |
${before.map((row, i) => `| ${row.id} | ${TARGET_WORDS[row.id]} | ${row.detail} | ${after[i]!.detail} | ${after[i]!.ok ? 'yes' : 'NO'} |`).join('\n')}

## Proposed changes

| path | current | proposed | why |
| --- | --- | --- | --- |
${changes.map((row) => `| ${row.path} | ${row.current} | ${row.proposed} | ${row.why} |`).join('\n')}

## Per-class times (proposed, stepMinutes 2)

Cumulative active minutes. Chapter cells: p25 / median / p75. Level columns: median.

${timesV2(proposed, true)}

## StepMinutes 1 diagnostic (proposed, seeds 1–5)

Cumulative boss-win medians in active minutes; no seed is omitted for a missing win.

${timesV2(diagnostic)}

Matched two-minute run restricted to seeds 1–5, so seed cohort changes can be separated from step-size effects:

${timesV2(proposed.filter((r) => r.seed <= 5))}

## Per-class times (current, stepMinutes 2)

${timesV2(current, true)}

## Boss fights and losses (proposed)

Totals across seeds; median duration includes wins and losses. First attempt means the first actual boss fight in each run, never the first winning attempt. Missing attempts fail boss-check.

${bossTableV2(proposed)}

## Median monster time-to-kill (proposed)

Each probe uses the equal-weight median of that round's three regular archetypes and elite. Levels are medians of observed entry levels. Entry within a claim is recovered by replaying the pure claim with a binary search (16 iterations), using that claim's existing equipment; no extra rewards are applied. Walk-share evaluates every seed's entry equipment at the class's median entry level (floored as in deriveStats), then computes walkTimeMs / (walkTimeMs + median time-to-kill). Level profiles are captured under the run's active overrides, so aggregation cannot accidentally use production numbers. Missing probes fail.

${killTableV2(proposed)}

## How classes differ

${classDifferencesV2(proposed)}

## Content changes suggested

${failures.length ? 'Investigate chapter-specific boss HP/ATK archetypes instead of one 40x HP / 2.5x ATK multiplier for all chapters: lower late boss HP where fights time out, and tune early boss ATK per chapter to put first-attempt success inside 40–90%. Guardian bonk and 1.3x HP/DEF need a separate balance pass against fragile classes; adjust its HP/DEF multipliers only if measured first-attempt rates stay above 90% while other classes fail. Increase killsPerRound in chapters that clear too quickly instead of adding walking time; tune each chapter separately to recover 1.3–2x growth. Add one CatKey to each chapter 2 and chapter 3 first-clear chest in a separately approved content task: three daily keys plus those two rewards cover five first wins without raising dailyKeys above three. That closes the key budget gap, while timing, class spread and boss success still require revalidation. The current policy only earns cleared-chapter key drops when a gate sends it backward; it does not proactively farm earlier chapters or repeat bosses. These are unvalidated directions, not a claim that any specific content edit closes every gap. Re-run both step sizes and all seeds after a separately authorized content change.' : 'No content edits are needed for the measured targets.'}

## Not overridable

${NOT_OVERRIDABLE_V2.map((path) => `- ${path}`).join('\n')}

## How to apply

Only after a passing review and explicit sign-off, copy these exact leaves into v2/config.ts:

${changes.map((row) => `- ${row.path}: ${row.current} → ${row.proposed}`).join('\n')}

## Method and limits

Claims use computeClaimV2 with offline=false. Both one- and two-minute steps fit within the inherited five-minute online window, so combat time is fully credited. Boss replay duration is recorded but is not added to active claim minutes. Retries happen at the next eligible step after the loss cooldown. Dates advance every 1,440 simulated minutes; keys are granted on the next claim. Equipment and crafting decisions still happen at claim boundaries, so step-size sensitivity includes different loot and craft decisions as well as timestamp rounding. A finite search cannot prove no config-only solution exists.

Chest rolls use rollLoot(CHESTS, first-clear/repeat table), with the idle gear rules for unlocked slot, smart weapon, chapter catalog, stage level, bonus lines and chest group. Craft/salvage weights: Fish 1, Yarn 10, Fluff Tuft 100, Shiny Button 200, Catnip Crystal 300, Starlight Scale 400. Every recipe must return less weighted salvage than it costs.

## Sign-off

User: ____ (approved / changes)
`;
}
const TARGET_WORDS: Record<string, string> = {
  'first-boss': 'Every class median first win 10–15 minutes',
  'chapter-growth': 'Every class chapter duration grows 1.3–2.0x',
  'class-spread': 'Every cumulative class median within ±15% of center AND chapter range / center ≥3%',
  'chapter-bounds': 'Every chapter duration median 10–360 minutes',
  'never-stuck': 'No six-hour period without level, round, boss win or power gain',
  'craft-salvage-loss': 'Every recipe returns less weighted salvage value than cost',
  'walk-share': 'Every class at ch1 r1 and ch3 r5: walking ≤50% at median observed entry level',
  'boss-check': 'Every chapter/class first-attempt wins 40–90%; median boss duration ≤180s',
  'guardrails': 'Each proposed numeric leaf 0.33–3x current; walk ≤2000ms; boss ≤180s; daily keys ≤3',
};
