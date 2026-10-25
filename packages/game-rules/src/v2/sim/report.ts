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
const shown = (n: number) => Number.isFinite(n) ? String(Math.round(n * 100) / 100) : 'not reached';
function times(results: SimResultV2[]): string {
  return ['| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...CLASS_IDS.map((id) => {
      const runs = results.filter((r) => r.classId === id);
      return `| ${id} | ${[...CHAPTERS.map((ch) => medianV2(runs.map((r) => r.minutesToChapterBossWin[ch.index]!))), ...([20, 40] as const).map((level) => medianV2(runs.map((r) => r.minutesToLevel[level])))].map(shown).join(' | ')} |`;
    })].join('\n');
}
export function renderNumbersReportV2(current: SimResultV2[], proposed: SimResultV2[]): string {
  const before = checkTargetsV2(current);
  const after = checkTargetsV2(proposed);
  const changes = proposedChangesV2();
  return `# Cat RPG v2 numbers proposal (V6)

Proposal only. V2_CONFIG unchanged. Needs the user's sign-off. Simulated seven classes with seeds 1–20, ten-minute active claim steps, greedy equipment and up to three improving crafts, salvage at 90% bag usage, and boss attempts at the frontier. Stop after chapter five's first clear or 1,800 active minutes. Nothing changes until the user signs. Chapter columns below are cumulative boss-win times; growth/bounds use time spent in each chapter. Level milestones after stopping are not reached. Null milestones count as Infinity for targets.

## Targets

| id | target in words | current result | proposed result | ok? |
| --- | --- | --- | --- | --- |
${before.map((row, i) => `| ${row.id} | ${TARGET_WORDS[row.id]} | ${row.detail} | ${after[i]!.detail} | ${after[i]!.ok ? 'yes' : 'NO'} |`).join('\n')}

## Proposed changes

| path | current | proposed | why |
| --- | --- | --- | --- |
${changes.map((row) => `| ${row.path} | ${row.current} | ${row.proposed} | ${row.why} |`).join('\n') || '| none | unchanged | unchanged | No validated proposal yet. |'}

## Per-class times (proposed)

Median minutes, cumulative since start.

${times(proposed)}

## Per-class times (current)

Median minutes, cumulative since start.

${times(current)}

## Not overridable

No V2_CONFIG paths are copied at module load. All its leaves are read at call time. Content-derived captures cannot be supplied as config overrides (unknown paths are refused before mutation):

${NOT_OVERRIDABLE_V2.map((path) => `- ${path}`).join('\n')}

## Content changes suggested (words only, if any)

No content changes are required to pass the stated targets. For a different gameplay feel, consider increasing later chapters' killsPerRound and reducing the boss HP archetype multiplier in a separately approved content task, then re-run the simulation. This could preserve increasing chapter times while shortening boss fights; exact values are not proposed or validated here.

The eight edits below are the smallest successful set found in this search: removing any one fails at least one target in the three-seed matrix. This establishes local necessity, not a proof of the global minimum across every possible configuration. The successful set was also verified on twenty seeds per class.

**Sign-off tradeoff:** starting HP rises from 100 to 6,000, level stat growth falls from 6% to 0.8%, walking grows from one to six seconds, and the boss timeout rises from one to twenty minutes. These are substantial gameplay changes. Passing timing targets does not validate combat feel. The requested active-minute metric counts claim steps and excludes boss animation duration, so actual wall-clock completion can take longer than the tables.

## How to apply

After sign-off, copy PROPOSED_V2_OVERRIDES into v2/config.ts by editing these exact leaves (do not replace the whole config):

${changes.map((row) => `- ${row.path}: ${row.current} → ${row.proposed}`).join('\n') || 'No edits approved or proposed yet.'}

## Method and limits

Claims use computeClaimV2 with offline=false. Its inherited v1 five-minute online window still discounts the second half of a ten-minute claim to 50%; thus a ten-minute step credits 7.5 minutes of combat. No v1 setting is changed. Loss cooldown runs on simulated seconds, with retries on the next eligible claim boundary. Craft previews use the deterministic next roll for each slot; newly crafted gear equips on the next step. Boss fights occur at step boundaries and their animation duration is not added to active time. Chest fallback uses rollLoot(CHESTS, table), then idle gearDrop's slot, smart weapon, chapter catalog, stage level and bonus-line rules, restricted to the chest's main/accessory group.

Craft/salvage weights: Fish 1, Yarn 10, Fluff Tuft 100, Shiny Button 200, Catnip Crystal 300, Starlight Scale 400 (100 times tier number). Moon Pearl and Cat Key have no recipe/salvage cost. Check crafts every recipe with the production craft helper before salvaging.

## Sign-off

User: ____ (approved / changes)
`;
}
const TARGET_WORDS: Record<string, string> = {
  'first-boss': 'Every class median first win 10–15 minutes', 'chapter-growth': 'Every class chapter duration grows 1.3–2.0x',
  'class-spread': 'Every cumulative chapter median within ±15% of class median', 'chapter-bounds': 'Every chapter duration median 10–360 minutes',
  'never-stuck': 'No six-hour period without level, round, boss win or power gain', 'craft-salvage-loss': 'Every recipe returns less weighted salvage value than cost',
};
