import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const base = 'reports/cardrpg-big2/mechanics';
const rows = [], verification = [];
for (const split of ['train', 'heldout']) {
  const result = JSON.parse(await readFile(`${base}/${split}.json`, 'utf8'));
  const archive = gunzipSync(await readFile(`${base}/${split}-off-states.jsonl.gz`)).toString().trim().split('\n');
  let pairs = 0;
  for (const line of archive) {
    const entry = JSON.parse(line), left = JSON.stringify(entry.baseline), right = JSON.stringify(entry.disabled);
    if (left !== right) throw Error('Archived parity mismatch');
    pairs++;
  }
  if (result.failures.length || result.parity.some(p => !p.equal || p.baselineHash !== p.actualHash)) throw Error('Sim parity mismatch');
  verification.push({ split, comparisons: result.parity.length, fullArchivedPairs: pairs, failures: 0,
    fileSha256: createHash('sha256').update(await readFile(`${base}/${split}.json`)).digest('hex') });
  for (const cell of result.rows) {
    const off = result.rows.find(r => r.level === cell.level && r.team === cell.team && r.chapter === cell.chapter && r.encounter === cell.encounter && r.variant === 'off');
    const gain = cell.runs.filter((r, i) => r.won && !off.runs[i].won).length;
    const loss = cell.runs.filter((r, i) => !r.won && off.runs[i].won).length;
    rows.push({ split, level: cell.level, team: cell.team, chapter: cell.chapter, encounter: cell.encounter, variant: cell.variant,
      wins: cell.wins, baselineWins: off.wins, deltaPoints: (gain - loss) * 2, gain, loss,
      medianActions: cell.medianActions, procs: cell.procs, baselineSaturated: off.wins === 50 });
  }
}
const lines = ['# Mechanics lab evidence', 'REFERENCE: tools/cardrpg-big2/mechanics-sim.mjs; packages/game-rules/src/cardrpg/depth/auto-extras; train.json; heldout.json', '',
'18,000 variant fights: 36 level/team/chapter/encounter cells × 5 variants × 50 seeds × 2 splits. Another 3,600 original baseline fights form the paired reference. Training seeds4001–4050; held-out50001–50050. No tuning after viewing held-out.',
'7,200 disabled/lens-only final-state comparisons pass exactly. All3,600 full baseline/disabled JSON pairs were independently re-read from the gzip archives and compared byte for byte. Lens-only hashes are retained in the JSON.',
'Bare gear, levels1/6, stars1. This tests individual seeded encounters against #340 enemy values; it does not substitute for Lane A’s updated encounters, gear tiers, whole routes or45-day economy. Ceiling cells cannot establish balance gains.', '',
'| Split / extra | Wins / fights | Paired gains / losses | Tea / relay procs |', '|---|---:|---:|---:|'];
for (const split of ['train', 'heldout']) for (const variant of ['off', 'tea-cloud', 'front-relay', 'intent-lens', 'all']) {
  const cells = rows.filter(r => r.split === split && r.variant === variant), sum = fn => cells.reduce((n,r) => n + fn(r),0);
  lines.push(`|${split} / ${variant}|${sum(r=>r.wins)}/1800|${sum(r=>r.gain)} / ${sum(r=>r.loss)}|${sum(r=>r.procs['tea-cloud'])} / ${sum(r=>r.procs['front-relay'])}|`);
}
for (const split of ['train', 'heldout']) {
  const cells = rows.filter(r => r.split===split && r.variant==='off');
  lines.push(`\n${split}: ${cells.filter(r=>r.baselineSaturated).length}/36 baseline cells win50/50 (${cells.filter(r=>r.level===6&&r.baselineSaturated).length}/18 at level6). At50seeds, one outcome is2 percentage points; do not describe small shifts as established improvement.`);
}
lines.push('\n## Every cell\nREFERENCE: summary.json; train.json; heldout.json\n', '| Split | Level/team | Chapter/encounter | Extra | Wins/50 (off) | Δpp | Gains/losses | Actions | Tea/relay |', '|---|---|---|---|---:|---:|---:|---:|---:|');
for (const r of rows) lines.push(`|${r.split}|${r.level}/${r.team}|${r.chapter}/${r.encounter}|${r.variant}|${r.wins} (${r.baselineWins})|${r.deltaPoints}|${r.gain}/${r.loss}|${r.medianActions}|${r.procs['tea-cloud']}/${r.procs['front-relay']}|`);
await writeFile(`${base}/SUMMARY.md`, lines.join('\n')+'\n');
await writeFile(`${base}/summary.json`, JSON.stringify({ verification, rows }, null, 2));
console.log(lines.slice(0,24).join('\n'));
