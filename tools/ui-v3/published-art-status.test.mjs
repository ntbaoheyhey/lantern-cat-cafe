import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {publishedArtPass} from './published-art-status.mjs';

const cases = [
  ['state declares PASS', 'NOW R2 PASS: published', '', true],
  ['report heading declares PASS', 'NOW R2 published', '# Art rebuild — PASS', true],
  ['report status declares PASS', '', '# Art rebuild\n\nStatus: **PASS**', true],
  ['current PARTIAL vetoes old report', 'NOW R2 PARTIAL\nR1 PASS', '# R1 — PASS', false],
  ['historical gate is not milestone approval', 'NOW R2 in progress', '# Art rebuild\n## G1 PASS\nTests PASS', false],
  ['report explicitly incomplete', '', '# Art rebuild — interim PARTIAL report\nStatus: PASS', false],
];
for (const [label, state, report, expected] of cases) assert.equal(publishedArtPass(state, report), expected, label);
// Pin the reviewed receipt: a future valid PASS must not break this regression case.
const ref = '8d12c87b2d9f307736e96e0ad206fe8587a42113';
const read = file => execFileSync('git', ['show', `${ref}:reports/cardrpg-look/art-rebuild/${file}`], {encoding:'utf8'});
assert.equal(publishedArtPass(read('STATE.md'), read('ART-REPORT.md')), false, 'recorded paused R1 with PARTIAL report is excluded');
console.log(JSON.stringify({status:'PASS', cases:cases.length + 1, pausedReceipt:ref, result:'excluded'}));
