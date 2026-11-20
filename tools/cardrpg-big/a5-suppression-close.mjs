// REFERENCE: A5 B2. Audit exact source, semantic regression, paired evidence and OFF before draft publication.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = 'reports/cardrpg-big/a5/b2-suppression';
const sha = data => createHash('sha256').update(data).digest('hex');
const receipts = [];
async function read(path) {
  const bytes = await readFile(path); receipts.push({path,sha256:sha(bytes)});
  return JSON.parse(bytes);
}
const gates = await read(root+'/gates/checks.json');
const source = gates[0].head;
for (const name of ['typecheck','lint','web-unit','rules','e2e','build']) {
  const row = gates.findLast(check => check.name === name);
  assert(row && row.code === 0,name); assert.equal(row.head,source);
}
for (const row of gates) assert.equal(sha(await readFile(row.log)),row.sha256,row.log);
execFileSync('git',['merge-base','--is-ancestor',source,'HEAD']);
assert.equal(execFileSync('git',['diff','--name-only',source,'--','apps','packages','scripts',
  'package.json','pnpm-lock.yaml','pnpm-workspace.yaml'],{encoding:'utf8'}).trim(),'');
const registration = await read('reports/cardrpg-big/a5/b2/suppression-current-16/REGISTERED-METHOD.json');
for (const [path,hash] of Object.entries(registration.combatSource)) assert.equal(sha(await readFile(path)),hash,path);
const off = await read(root+'/off/checks.json');
assert.equal(off.offBehavior,'PASS'); assert.equal(off.cells,165); assert.equal(off.routes,8250);
assert.equal(off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');
const offSource = await read(root+'/off/source.json');
assert.deepEqual(offSource,registration.combatSource);
const common = await read('reports/cardrpg-big/a5/b2/utility-suppression-15/common/summary.json');
const carriers = await read('reports/cardrpg-big/a5/b2/utility-suppression-15/carriers/summary.json');
const pairs = await read('reports/cardrpg-big/a5/b2/utility-suppression-15/paired-carriers.json');
for (const summary of [common,carriers,pairs]) for (const receipt of summary.receipts)
  assert.equal(sha(await readFile(receipt.path)),receipt.sha256,receipt.path);
assert.equal(carriers.cells,1024); assert.equal(carriers.battles,51200);
assert.equal(pairs.rows.length,1024);
const day7 = await read('reports/cardrpg-big/a5/b2/suppression-current-16/day7-checks/checks.json');
assert.equal(day7.accounts.length,90);
for (const [path,hash] of Object.entries(registration.savedInputs)) assert.equal(sha(await readFile(path)),hash,path);
const day7Pairs = await read('reports/cardrpg-big/a5/b2/suppression-current-16/day7-paired.json');
assert.equal(day7Pairs.totals.accounts,90);
for (const receipt of day7Pairs.receipts) assert.equal(sha(await readFile(receipt.path)),receipt.sha256,receipt.path);
const current = await read('reports/cardrpg-big/a5/b2/suppression-current-16/summary.json');
assert.deepEqual(current.source,registration.combatSource);
for (const receipt of current.receipts) assert.equal(sha(await readFile(receipt.path)),receipt.sha256,receipt.path);
const scope = JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));
assert.equal(scope.scope,'PASS'); assert.equal(scope.baseline,'PASS'); assert.equal(scope.historicalSimFiles,13);
const audit = { source, status:'Utility-suppression correction verified; broader A5 balance remains open.',
  change:'V4 Hush spends a committed heal/shield turn without replacement damage; OFF, basics, Drowsy and summon/boss attack portions stay unchanged.',
  gates,off,sourceFilesChecked:Object.keys(registration.combatSource).length,
  commonGates:common.gates,commonCats:common.cats,commonCrew:common.crew,
  carrierPairs:pairs.totals,carrierPrimary:pairs.primary,
  savedDay7:{cohorts:day7.cohorts,gates:day7.gates,paired:day7Pairs.totals,scope:'90 previously earned saves; not a fresh 45-day progression cohort'},
  currentTrain:current,receipts,
  scope:{scope:scope.scope,baseline:scope.baseline,historicalSimFiles:scope.historicalSimFiles,author:scope.author},
  limitations:[
    'Fresh acceptance seeds 20001–20500 remain unused. This is not full B1/B2 acceptance.',
    'No Cinnamon cooldown, semantic-kit fixture or extra rear reach trial is adopted.',
    'The current public offline demo remains unchanged until Z; no new UI flow or screenshot pack.',
    'Every measured training miss and negative paired outcome is retained.'
  ] };
await writeFile(root+'/audit.json',JSON.stringify(audit,null,2));
console.log(JSON.stringify({source,status:audit.status,commonGates:common.gates,savedDay7:audit.savedDay7,off}));
