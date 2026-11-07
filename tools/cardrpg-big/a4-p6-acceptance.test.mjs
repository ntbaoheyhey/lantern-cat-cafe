// REFERENCE: GAMEPLAY-V4 section9. Numeric acceptance is separate from fast source gates.
import {before,describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const directory=process.env.A4_BALANCE_DIR||'reports/cardrpg-big/a4/p6';
describe('registered v4 balance acceptance',()=>{
 let evidence;
 before(()=>{
  evidence=JSON.parse(readFileSync(resolve(directory,'balance-gates.json'),'utf8'));
  assert.equal(evidence.counts.train,3625);assert.equal(evidence.counts.heldout,3625);
  assert(evidence.counts.trainTrials>=3625*500);assert(evidence.counts.heldoutTrials>=3625*500);
 });
 for(const id of ['tiers','bands','single-piece','sets','cats','crew','matched-power'])it(id,()=>{
  const gate=evidence.checks.find(g=>g.id===id);assert(gate,`Missing ${id} evidence`);
  assert.equal(gate.status,'PASS',`${gate.target}\nMeasured: ${JSON.stringify(gate.measured)}`);
 });
});
