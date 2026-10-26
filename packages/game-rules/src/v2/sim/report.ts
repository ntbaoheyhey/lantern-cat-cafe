import { CLASS_IDS, CHAPTERS, CLASSES } from '../content';
import { V2_CONFIG } from '../config';
import { NOT_OVERRIDABLE_V2 } from './config';
import { PROPOSED_V2_OVERRIDES, PROPOSAL_REASONS_V2, SCENARIO_V2_OVERRIDES, CONFIG_FIRST_BOSS_WITNESS_V2, C5C_MAIN_OVERRIDES, C5C_SB_OVERRIDES } from './proposal';
import { checkTargetsV2, medianV2 } from './targets';
import type { SimResultV2 } from './simulate';
export function proposedChangesV2(): { path: string; current: unknown; proposed: unknown; why: string }[] {
  const rows: ReturnType<typeof proposedChangesV2> = [];
  function visit(source: object, current: object, prefix = '') {
    for (const [key, value] of Object.entries(source)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const before = (current as Record<string, unknown>)[key];
      if (typeof value === 'object' && value !== null) visit(value, before as object, path);
      else rows.push({ path, current: before, proposed: value, why: PROPOSAL_REASONS_V2[path] ?? PROPOSAL_REASONS_V2[path.split('.')[0]!] ?? 'Retain the bounded C5c value.' });
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

/** D4 diagnostic only. Never imported by search or used to select/mark READY. */
export function relaxedTargetsV2(results: SimResultV2[], overrides = PROPOSED_V2_OVERRIDES) {
  const groups = CLASS_IDS.map(id => results.filter(r => r.classId === id));
  const first = groups.every(runs => { const m = medianV2(runs.map(r => r.minutesToFirstBossWin)); return m >= 8 && m <= 15; });
  const growth = groups.every(runs => CHAPTERS.slice(1).every(ch => {
    const ratio = medianV2(runs.map(r => r.minutesPerChapter[ch.index]!)) / medianV2(runs.map(r => r.minutesPerChapter[ch.index - 1]!));
    return Number.isFinite(ratio) && ratio >= 1.2 && ratio <= 2.5;
  }));
  const spread = CHAPTERS.every(ch => {
    const times = groups.map(runs => medianV2(runs.map(r => r.minutesToChapterBossWin[ch.index]!))), center = medianV2(times);
    return Number.isFinite(center) && times.every(t => Math.abs(t / center - 1) <= 0.2 + 1e-10) && (Math.max(...times) - Math.min(...times)) / center >= 0.03;
  });
  const boss = groups.every(runs => runs.length > 0 && CHAPTERS.every(ch => {
    const samples = runs.map(r => r.bosses[ch.index]!), rate = samples.filter(b => b.firstAttemptWon === true).length / runs.length;
    return samples.every(b => b.firstAttemptWon !== null) && rate >= 0.3 && rate <= 0.95 && medianV2(samples.flatMap(b => b.durationsMs)) <= 180000;
  }));
  const relaxed: Record<string, boolean> = { 'first-boss': first, 'chapter-growth': growth, 'class-spread': spread, 'boss-check': boss };
  return checkTargetsV2(results, overrides).map(c => ({ ...c, ok: relaxed[c.id] ?? c.ok }));
}
export interface RankedRunsV2 { overrides: import('./config').ConfigOverridesV2; runs: SimResultV2[] }
const tableChecks = (checks: ReturnType<typeof checkTargetsV2>) => ['| target | passes | measured evidence |', '| --- | --- | --- |', ...checks.map(c => `| ${c.id} | ${c.ok ? 'PASS' : 'FAIL'} | ${c.detail} |`)].join('\n');
function valueAt(source: object, path: string): unknown {
  return path.split('.').reduce<unknown>((o, key) => o && typeof o === 'object' ? (o as Record<string, unknown>)[key] : undefined, source);
}
export function renderNumbersReportV2(current: SimResultV2[], proposed: SimResultV2[], diagnostic: SimResultV2[] = [], extras: ReportExtrasV2 & { ranked?: RankedRunsV2[] } = {}): string {
  const checks = checkTargetsV2(proposed), failures = checks.filter(c => !c.ok), ranked = extras.ranked ?? [];
  const complete = CLASS_IDS.every(id => Array.from({ length: 20 }, (_, i) => i + 1).every(seed => proposed.some(r => r.classId === id && r.seed === seed)));
  const ready = complete && failures.length === 0;
  const changes = proposedChangesV2();
  const needs = failures.map(f => {
    const witness = ranked.find(r => checkTargetsV2(r.runs, r.overrides).find(c => c.id === f.id)?.ok);
    const lever: Record<string, string> = {
      'first-boss': 'chapter-1 pacing/HP remains configurable; no satisfying set found in this bounded family',
      'chapter-growth': 'per-chapter pacing remains configurable; further search or chapter-specific XP/drop content',
      'chapter-bounds': 'per-chapter monster XP and encounter scaling',
      'class-spread': 'classes.ts stats.atk / attackIntervalMs / passive damage, and guardian HP/DEF/bonk delay',
      'boss-check': 'classes.ts guardian HP/DEF/bonk and per-class survival multipliers; per-chapter boss HP/ATK alone did not satisfy every class',
    };
    return `- ${f.id}: ${witness ? `reachable with config (set found: ranked candidate ${ranked.indexOf(witness) + 1})` : `no satisfying config found in the measured family: ${lever[f.id] ?? 'content-specific tuning'}`} — sim evidence: ${f.detail}.`;
  });
  return `# Cat RPG v2 numbers proposal (V6h)

Proposal only. V2_CONFIG unchanged.

**Status:** ${ready ? 'READY: every strict target passes on seeds 1–20; awaiting user sign-off.' : `NOT READY FOR SIGN-OFF. Failing targets: ${failures.map(c => c.id).join(', ') || 'incomplete 20-seed cohort'}.`}

## What you would be signing

D1 S-B: one Cat Key in every first-clear chest, none on rematches, with at most three daily keys.
The exact config leaves below change chapter pacing and boss pressure; gear drops remain at the disclosed C5c proposal rate.
Class content is unchanged, so unequal class survival and progression remain visible in the measured failures.
A signature would approve only this table, with its listed failures; it would not silently approve a class-content change.

## Main targets (unchanged)

First boss 10–15m; chapter growth 1.3–2x; cumulative class spread ±15% and range ≥3%; chapter durations 10–360m; never stuck; salvage loss; walk share ≤50%; every class/chapter first-attempt boss wins 40–90%, median duration ≤180s; numeric guardrails.

${tableChecks(checks)}

## Relaxed D4 table — REPORT ONLY

First boss 8–15m; growth 1.2–2.5x; spread ±20% and range ≥3%; first-attempt boss wins 30–95%, median ≤180s. All other strict checks retained. This table never selects a candidate or marks READY.

${tableChecks(relaxedTargetsV2(proposed))}

## Three-seed exact regression

| target | strict | relaxed |
| --- | --- | --- |
${checks.map(c => `| ${c.id} | ${checkTargetsV2(proposed.filter(r => r.seed <= 3)).find(x => x.id === c.id)!.ok ? 'PASS' : 'FAIL'} | ${relaxedTargetsV2(proposed.filter(r => r.seed <= 3)).find(x => x.id === c.id)!.ok ? 'PASS' : 'FAIL'} |`).join('\n')}

## C5c versus proposed config leaves

C5c main and C5c S-B are shown separately. Unspecified leaves retain current production values.

| path | current | C5c main | C5c S-B | new | reason |
| --- | --- | --- | --- | --- | --- |
${changes.map(c => `| ${c.path} | ${c.current} | ${valueAt(C5C_MAIN_OVERRIDES, c.path) ?? c.current} | ${c.path === 'boss.firstClearKeys' ? '1 (old sim option)' : valueAt(C5C_SB_OVERRIDES, c.path) ?? c.current} | ${c.proposed} | ${c.why} |`).join('\n')}

## Per-class cumulative chapter times: p25 / median / p75 minutes

${timesV2(proposed, true)}

## Per-chapter active duration: p25 / median / p75 minutes

| class | ch1 | ch2 | ch3 | ch4 | ch5 |
| --- | --- | --- | --- | --- | --- |
${CLASS_IDS.map(id => `| ${id} | ${CHAPTERS.map(ch => [0.25, 0.5, 0.75].map(q => shownV2(percentileV2(proposed.filter(r => r.classId === id).map(r => r.minutesPerChapter[ch.index]!), q))).join(' / ')).join(' | ')} |`).join('\n')}

## Boss rates and duration, every class and chapter

${bossTableV2(proposed)}

## Key wait minutes; first / median attempt level

${metricsTableV2(proposed)}

## Class identity at chapters 1, 3 and 5

${identityTableV2(proposed)}

${classDifferencesV2(proposed)}

Illustrative content levers to investigate, NEVER applied or approved: estimate the ATK multiplier scaling needed to move each chapter-1 entry TTK toward the class-median TTK. This is a local inverse-DPS estimate, not a validated fix; passives, gear and survival make its actual effect nonlinear.

| class | current classes.ts stats.atk | estimated multiplier | change | survival lever |
| --- | --- | --- | --- | --- |
${CLASSES.map(cls => {
  const ttk = (id: string) => medianV2(proposed.filter(r => r.classId === id).map(r => r.roundSamples['1:1']?.timeToKillMs ?? null));
  const factor = ttk(cls.id) / medianV2(CLASS_IDS.map(ttk)), estimated = cls.stats.atk * factor;
  return `| ${cls.id} | ${cls.stats.atk} | ${shownV2(estimated)} | ${shownV2((factor - 1) * 100)}% | ${cls.id === 'guardian' ? 'HP 1.3, DEF 1.3, bonk delay 500ms; inspect alongside measured losses' : `HP ${cls.stats.hp}, DEF ${cls.stats.def}; compare boss losses before changing damage`} |`;
}).join('\n')}

## StepMinutes 1 diagnostic

${timesV2(diagnostic, true)}

## Inherited V6f ranked controls (strict targets only; V6h search in the task report)

${ranked.map((r, i) => `### Candidate ${i + 1}

\`\`\`json
${JSON.stringify(r.overrides, null, 2)}
\`\`\`

${tableChecks(checkTargetsV2(r.runs, r.overrides))}`).join('\n\n')}

## Config witnesses / content questions

${needs.join('\n')}

These labels describe this finite search, not proof that the full config space is exhausted. Per-chapter pacing and boss HP/ATK remain available config levers; no class-content values are approved. A separate classes.ts card is needed before applying any content recommendation.

## Current production baseline (three seeds/class)

${timesV2(current, true)}

## Method and limits

Inherited V6f search (retained as a control): 29 deterministic final-family candidates: frozen C5c S-B and C5c main controls plus 3 pacing families × 3 boss-HP families (all with chapter ATK 0.85/1.5/2.5/3/3.5) × 3 ATK/XP families. Every candidate has firstClearKeys=1 and dailyKeys=3. Screen: seed 1, every class, 120 active minutes. Top five plus both controls refined on seeds 1–3; final top three shown on seeds 1–3, every class, 1,800 active minutes. Selected proposal: seeds 1–20. Strict target count dominates ranking, followed by chapter-5 completeness and first-boss-window frequency; the retained claim-size stability diagnostic is an eligibility preference. Relaxed checks are report-only. Simulation rewards and timing otherwise retain C5c behavior; full-result digests prove the old S-B refund equals its config-leaf replacement on seeds 1–3. Missing milestones remain Infinity; no failures are dropped. V2_CONFIG and classes.ts are unchanged.

## Not overridable

${NOT_OVERRIDABLE_V2.map(x => `- ${x}`).join('\n')}

Numbers sign-off belongs to the user (D4, planning date 30 Oct). V6h pacing measurements and search coverage are recorded in reports/v6h-pacing.md. Class multipliers are content, not overridable config leaves; none were applied or simulated through an unguarded override.

## Sign-off

User: ____ (approved / changes)
`;
}
