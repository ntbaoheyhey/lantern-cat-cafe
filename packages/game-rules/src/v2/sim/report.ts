import { CLASS_IDS, CHAPTERS } from '../content';
import { V2_CONFIG } from '../config';
import { NOT_OVERRIDABLE_V2 } from './config';
import { PROPOSED_V2_OVERRIDES, PROPOSAL_REASONS_V2, SCENARIO_V2_OVERRIDES, CONFIG_FIRST_BOSS_WITNESS_V2 } from './proposal';
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
        return quartiles ? [0.25, 0.5, 0.75].map((q) => (Number.isFinite(percentileV2(values, q)) ? percentileV2(values, q).toFixed(1) : 'not reached')).join(' / ') : shownV2(medianV2(values));
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
  return `Warrior attacks every 1s with cleave; Guardian every 1.4s with 1.3× HP/DEF and a 500ms bonk delay; Rogue has 0.8s twin strikes, 25% crit and 10% dodge; Hunter has a 1.1s mark (+20% damage taken and material find); Archer has a 0.9s volley cycle; Witch has 1.6s bolts, splash and burn; Alchemist has 1.3s poison flasks and heal-on-kill. ${chapters.join('; ')}. Boss losses, most first: ${losses.map((r) => `${r.id} ${r.count}`).join(', ')}. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.`;
}
export interface ReportExtrasV2 {
  scenarios?: { id: 'S-A' | 'S-B'; runs: SimResultV2[] }[];
  profiles?: { activeMinutesPerDay: number; runs: SimResultV2[] }[];
  firstBossWitness?: SimResultV2[]; c5b?: SimResultV2[]; c5bWithoutKeyWall?: SimResultV2[];
}
export function metricsTableV2(results: SimResultV2[]): string {
  return ['| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |',
    '| --- | --- | --- | --- | --- | --- | --- |', ...CLASS_IDS.map((id) => {
      const runs = results.filter((r) => r.classId === id);
      return `| ${id} | ${CHAPTERS.map((ch) => {
        const wait = medianV2(runs.map((r) => r.keyWaitMinutes[ch.index] ?? 0));
        const first = medianV2(runs.map((r) => r.bosses[ch.index]!.levels[0] ?? null));
        const levels = medianV2(runs.flatMap((r) => r.bosses[ch.index]!.levels));
        return `${shownV2(wait)}m; L${shownV2(first)} / L${shownV2(levels)}`;
      }).join(' | ')} | ${runs.filter((r) => r.maxLevelBeforeChapter5Win).length}/${runs.length} |`;
    })].join('\n');
}
export function profileTableV2(profiles: NonNullable<ReportExtrasV2['profiles']>): string {
  return ['| active minutes/day | class | ch1 | ch2 | ch3 | ch4 | ch5 |', '| --- | --- | --- | --- | --- | --- | --- |',
    ...profiles.flatMap(({ activeMinutesPerDay, runs }) => CLASS_IDS.map((id) => {
      const group = runs.filter((r) => r.classId === id);
      return `| ${activeMinutesPerDay} | ${id} | ${CHAPTERS.map((ch) => `${shownV2(medianV2(group.map((r) => r.calendarDaysToChapterBossWin[ch.index]!)))}d / ${shownV2(medianV2(group.map((r) => r.minutesToChapterBossWin[ch.index]!)))}m`).join(' | ')} |`;
    }))].join('\n');
}
export function identityTableV2(results: SimResultV2[]): string {
  return ['| class | chapter | entry level | entry monster TTK, seconds | median boss duration, seconds | median boss losses/run |',
    '| --- | --- | --- | --- | --- | --- |', ...CLASS_IDS.flatMap((id) => [1, 3, 5].map((chapter) => {
      const runs = results.filter((r) => r.classId === id);
      const med = (values: (number | null)[]) => shownV2(medianV2(values));
      return `| ${id} | ${chapter} | ${med(runs.map((r) => r.roundSamples[`${chapter}:1`]?.level ?? null))} | ${med(runs.map((r) => (r.roundSamples[`${chapter}:1`]?.timeToKillMs ?? Infinity) / 1000))} | ${med(runs.flatMap((r) => r.bosses[chapter]!.durationsMs.map((ms) => ms / 1000)))} | ${med(runs.map((r) => r.bosses[chapter]!.losses))} |`;
    }))].join('\n');
}
export function renderNumbersReportV2(current: SimResultV2[], proposed: SimResultV2[], diagnostic: SimResultV2[] = [], extras: ReportExtrasV2 = {}): string {
  const before = checkTargetsV2(current, {});
  const after = checkTargetsV2(proposed);
  const changes = proposedChangesV2();
  const failures = after.filter((r) => !r.ok);
  const scenarioChecks = (extras.scenarios ?? []).map(({ id, runs }) => ({ id, runs, checks: checkTargetsV2(runs,
    id === 'S-A' ? { ...SCENARIO_V2_OVERRIDES[id].overrides, idle: { ...SCENARIO_V2_OVERRIDES[id].overrides.idle, dailyKeys: 5 } } : SCENARIO_V2_OVERRIDES[id].overrides) }));
  return `# Cat RPG v2 numbers proposal (V6d)

Proposal only. V2_CONFIG unchanged. Main proposal: seven classes, seeds 1–20, stepMinutes 2, 1,800 active minute horizon. Current, scenarios, C5b and player-day diagnostics: seeds 1–5. StepMinutes 1 diagnostic: seeds 1–5. Missing milestones remain Infinity. All boss times below are active minutes, rounded to 0.1 minute in timing tables.

**Status:** ${failures.length ? `NOT READY FOR SIGN-OFF. Failing targets: ${failures.map((r) => r.id).join(', ')}.` : 'READY: all measured targets pass; awaiting user sign-off.'}

## Targets

| id | target in words | current result (5 seeds) | proposed result (20 seeds) | ok? |
| --- | --- | --- | --- | --- |
${before.map((row, i) => `| ${row.id} | ${TARGET_WORDS[row.id]} | ${row.detail} | ${after[i]!.detail} | ${after[i]!.ok ? 'yes' : 'NO'} |`).join('\n')}

## Scenario table — scenario, needs a user decision

S-A gives five daily keys (the material cap); it deliberately FAILS the unchanged dailyKeys ≤3 guardrail. S-B adds one key to each first-clear chest, none on repeats; it requires a content change in chests.ts, or a coordinated applyBossResult + SQL v2_boss_fight rule change. Neither is part of PROPOSED_V2_OVERRIDES. Each scenario uses its separately searched config below.

| target | proposal (20 seeds) | ${scenarioChecks.map((s) => s.id + ' (5 seeds)').join(' | ')} |
| --- | --- | ${scenarioChecks.map(() => '---').join(' | ')} |
${after.map((c, i) => `| ${c.id} | ${c.ok ? 'yes' : 'NO'} | ${scenarioChecks.map((s) => s.checks[i]!.ok ? 'yes' : 'NO').join(' | ')} |`).join('\n')}

${scenarioChecks.map((s) => `### ${s.id}: scenario, needs a user decision

Config overrides (S-A additionally sets dailyKeys=5):

\`\`\`json
${JSON.stringify(SCENARIO_V2_OVERRIDES[s.id].overrides, null, 2)}
\`\`\`

| target | result | ok? |
| --- | --- | --- |
${s.checks.map((c) => `| ${c.id} | ${c.detail} | ${c.ok ? 'yes' : 'NO'} |`).join('\n')}

${timesV2(s.runs, true)}

Key waits and levels (wait; first attempt level / all-attempt median level):

${metricsTableV2(s.runs)}

${bossTableV2(s.runs)}

Entry-level monster time-to-kill:

${killTableV2(s.runs)}

${identityTableV2(s.runs)}

How classes differ: ${classDifferencesV2(s.runs)}`).join('\n\n')}

## Three-seed regression (same seeds as the normal proposal test)

| target | passes on seeds 1–3 |
| --- | --- |
${checkTargetsV2(proposed.filter((r) => r.seed <= 3)).map((c) => `| ${c.id} | ${c.ok ? 'yes' : 'NO'} |`).join('\n')}

## Proposed changes

| path | current | proposed | why |
| --- | --- | --- | --- |
${changes.map((row) => `| ${row.path} | ${row.current} | ${row.proposed} | ${row.why} |`).join('\n')}

## Per-class times (proposed, stepMinutes 2)

Cumulative active minutes: p25 / median / p75. Level columns: median.

${timesV2(proposed, true)}

## StepMinutes 1 diagnostic (proposed, seeds 1–5)

${timesV2(diagnostic, true)}

Matched stepMinutes 2, seeds 1–5:

${timesV2(proposed.filter((r) => r.seed <= 5), true)}

| class | ch1 median absolute difference, minutes | within 1 minute? |
| --- | --- | --- |
${CLASS_IDS.map((id) => {
  const a = medianV2(diagnostic.filter((r) => r.classId === id).map((r) => r.minutesToFirstBossWin));
  const b = medianV2(proposed.filter((r) => r.seed <= 5 && r.classId === id).map((r) => r.minutesToFirstBossWin));
  return `| ${id} | ${shownV2(Math.abs(a - b))} | ${Math.abs(a - b) <= 1 ? 'yes' : 'NO'} |`;
}).join('\n')}

## Key wait and boss-attempt level (proposed)

Each chapter: median key wait minutes; median first-attempt level / median level over all attempts. Missing attempts remain Infinity. Last column is runs reaching maxLevel before the ch5 win, including incomplete runs that reached the cap.

${metricsTableV2(proposed)}

## Player-day profiles — diagnostic only, never used by targets

Seeds 1–5; cell = median elapsed calendar days / active minutes. Each player starts at the beginning of their daily activity window. Day advances after the stated active-minute budget; no away-time gains are simulated. Fractions use active minutes / 1440 within the current calendar day. Thus 1.01d means just into the second daily session, not two full days.

${profileTableV2(extras.profiles ?? [])}

## C5b remeasured with sub-step timing (5 seeds)

${timesV2(extras.c5b ?? [], true)}

${metricsTableV2(extras.c5b ?? [])}

${bossTableV2(extras.c5b ?? [])}

## C5b with only S-A removing the key wall (5 seeds; causal diagnostic)

${timesV2(extras.c5bWithoutKeyWall ?? [], true)}

${metricsTableV2(extras.c5bWithoutKeyWall ?? [])}

${bossTableV2(extras.c5bWithoutKeyWall ?? [])}

## Per-class times (current, 5 seeds)

${timesV2(current, true)}

## Boss fights and losses (proposed)

Totals across seeds; median duration includes wins and losses. First attempt is the first actual fight, never the first winning attempt. Level for every attempt is retained in the run data.

${bossTableV2(proposed)}

## Median monster time-to-kill (proposed)

Probe = equal-weight median of three regular archetypes and elite, at observed entry level and equipment. Binary-search replay recovers entries within claims. Walk-share re-evaluates all entry equipment at the exact floored class median level; missing probes fail.

${killTableV2(proposed)}

## How classes differ

${identityTableV2(proposed)}

Entry probes use chapter round 1; boss duration and losses are from actual later attempts at the recorded levels, including retries.

${classDifferencesV2(proposed)}

## First-boss config witness (five seeds, 60-minute diagnostic horizon)

${checkTargetsV2(extras.firstBossWitness ?? [], CONFIG_FIRST_BOSS_WITNESS_V2)[0]!.detail}. This is a target-specific witness; it is excluded from main selection because its one- versus two-minute timing diagnostic exceeds one minute for at least one class/cohort. It does not pass all targets.

\`\`\`json
${JSON.stringify(CONFIG_FIRST_BOSS_WITNESS_V2, null, 2)}
\`\`\`

## Unreachable targets in the searched family

${failures.map((failure) => {
  const passing = scenarioChecks.filter((s) => s.checks.find((c) => c.id === failure.id)?.ok);
  return `- ${failure.id}: ${failure.id === 'first-boss' && checkTargetsV2(extras.firstBossWitness ?? [], CONFIG_FIRST_BOSS_WITNESS_V2)[0]!.ok ? 'reachable with config (set found: CONFIG_FIRST_BOSS_WITNESS_V2 above); that set still fails measurement acceptance and is not the main proposal' : passing.length ? `reachable only with scenario ${passing.map((s) => s.id).join(' / ')} in this search (user decision: five daily keys / first-clear key refund, respectively)` : `not reachable by config or these scenarios in this bounded search; needs content change: ${CONTENT_LEVERS[failure.id] ?? 'chapter-specific content tuning'}`}. Proposal evidence: ${failure.detail}.`;
}).join('\n')}

This is a finite searched family, not a proof of mathematical impossibility. Chapter-growth and boss-check need revalidation after key/content decisions. If a scenario still fails class-spread after removing the key wall, tune classes.ts attackIntervalMs and stats.atk alongside markPrey, volley, burn and poison damage; guardian stats.hp/def and bonk.delayMs control survival. Keep ≥3% spread and ±15% bounds together; no multiplier values are approved here.

## Not overridable

${NOT_OVERRIDABLE_V2.map((path) => `- ${path}`).join('\n')}

## Method and limits

Claims use computeClaimV2, offline=false. A claim crossing the boss gate is replayed to its earliest whole second, only that prefix is applied, and the rest of the original step continues after the attempt. Cooldown and daily boundaries split claims too. Loot and crafting remain claim-dependent, so event timing removes timestamp quantization but does not make different claim sizes identical. Equipment is selected greedily, up to three improving crafts per applied claim, salvage at 90% bag usage. Boss replay seconds are recorded separately and excluded from active minutes. Keys drop only when computeClaimV2 actually farms cleared content; no old-chapter action is invented. Cleared-chapter key chance stays at production's value in all searched configs.

## Sign-off

User: ____ (approved / changes)
`;
}
const CONTENT_LEVERS: Record<string, string> = {
  'first-boss': 'chapter-1 boss HP/ATK in monsters.ts, separated from the shared ARCHETYPE.boss',
  'chapter-growth': 'killsPerRound per chapter in chapters.ts, and per-chapter boss HP in monsters.ts',
  'class-spread': 'classes.ts guardian HP/DEF/bonk and per-class ATK/attack intervals/passive damage',
  'chapter-bounds': 'chapters.ts killsPerRound and chests.ts first-clear catKey rewards to remove the key-clock wall',
  'never-stuck': 'chests.ts first-clear catKey rewards so a frontier cat can attempt the next boss',
  'boss-check': 'per-chapter boss hpMul/atkMul in monsters.ts instead of the single 40 / 2.5 archetype, plus guardian HP/DEF/bonk in classes.ts',
};
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
