import {beforeAll,describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

interface Acceptance {
 counts:{train:number;heldout:number;trainTrials:number;heldoutTrials:number};
 checks:Array<{id:string;status:'PASS'|'MISS';measured:unknown;target:string}>;
}
// Long acceptance is opt-in: run against completed, source-bound P6 receipts.
// Ordinary unit suites never substitute small fixtures for the 500-seed protocol.
describe.runIf(Boolean(process.env.A4_BALANCE_DIR))('registered v4 balance acceptance',()=>{
 let evidence:Acceptance;
 beforeAll(()=>{evidence=JSON.parse(readFileSync(resolve(process.env.A4_BALANCE_DIR!,'balance-gates.json'),'utf8')) as Acceptance;
  expect(evidence.counts.train).toBe(3625);expect(evidence.counts.heldout).toBe(3625);
  expect(evidence.counts.trainTrials).toBeGreaterThanOrEqual(3625*500);expect(evidence.counts.heldoutTrials).toBeGreaterThanOrEqual(3625*500);
 });
 for(const id of ['tiers','bands','single-piece','sets','cats','crew','matched-power'])it(id,()=>{
  const gate=evidence.checks.find(g=>g.id===id);expect(gate,`Missing ${id} acceptance evidence`).toBeDefined();
  expect(gate!.status,`${gate!.target}\nMeasured: ${JSON.stringify(gate!.measured)}`).toBe('PASS');
 });
});
