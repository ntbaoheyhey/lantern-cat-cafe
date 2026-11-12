// A source measurement must be rerun after rule changes; provenance text alone
// cannot establish that the checked-in rates still describe this checkout.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const regenerate='Run node tools/chain/supply-study.mjs after reviewing the changed rules.';

export function currentSourceHashes() {
  const rules=execFileSync('git',['ls-files','-z','packages/game-rules/src/cardrpg','packages/game-rules/src/rng.ts'],{cwd:root,encoding:'utf8'})
    .split('\0').filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts'));
  const paths=[...rules,'tools/cardrpg-sim/load.mjs','tools/chain/supply-study.mjs'];
  return Object.fromEntries(paths.sort().map(path=>[path,createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')]));
}

export function assertSourceSnapshot(supply,study,hashes) {
  assert.equal(study.snapshotVersion,1,`Unsupported supply snapshot. ${regenerate}`);
  assert.deepEqual(study.sourceHashes,hashes,`Source supply is stale. ${regenerate}`);
  assert.deepEqual(study.supply,supply,'Supply rates differ from the measured snapshot; regenerate or use an explicit --supply override.');
  assert.equal(study.source,supply.source,'Supply provenance differs from its measurement.');
  return supply;
}

export function loadSourceSupply() {
  const supply=JSON.parse(readFileSync(resolve(root,'docs/chain/source-supply.json'),'utf8'));
  const study=JSON.parse(readFileSync(resolve(root,'docs/chain/supply-study.json'),'utf8'));
  return assertSourceSnapshot(supply,study,currentSourceHashes());
}
