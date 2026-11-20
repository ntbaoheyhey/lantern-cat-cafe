// REFERENCE: PROMPT-A5 E1. Assert recorded outcomes and provenance, never desired fixture results.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),base='reports/cardrpg-big/a5/e1/';
const bytes=p=>readFileSync(new URL(p,root)),read=p=>JSON.parse(bytes(p)),hash=p=>createHash('sha256').update(bytes(p)).digest('hex');

test('reviewed evidence binds to the exact measured artifact and six source gates',()=>{
 const audit=read(base+'reviewed/audit.json');
 assert.equal(hash(audit.artifact.path),audit.artifact.sha256);assert.equal(bytes(audit.artifact.path).length,audit.artifact.bytes);
 for(const receipt of audit.receipts)if(!receipt.path.startsWith('/tmp/'))assert.equal(hash(receipt.path),receipt.sha256,receipt.path);
 for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
  const gate=audit.gates.findLast(g=>g.name===name);assert(gate);assert.equal(gate.code,0);assert.equal(gate.head,audit.source);assert.equal(hash(gate.log),gate.sha256);
 }
 assert.equal(audit.off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');
 assert.equal(audit.off.cells,165);assert.equal(audit.off.routes,8250);
});
test('all desktop widths preserve retry state, layout and measured forecast budgets',()=>{
 const audit=read(base+'reviewed/audit.json');
 for(const width of [1280,1440,1024]){
  const row=read(base+`reviewed/browser-${width}/checks.json`);
  assert(row.passed);assert.equal(row.sha256,audit.artifact.sha256);assert.equal(row.captures.length,6);
  assert.deepEqual(row.errors,[]);assert.deepEqual(row.remote,[]);
  for(const capture of row.captures){assert.equal(capture.overflow,0);assert(capture.contrast.length>0);assert(capture.contrast.every(c=>c.ratio>=4.5));}
  const forecasts=row.forecasts.filter(f=>f.cpu===1&&!f.cached);assert(forecasts.length>=2);assert(forecasts.every(f=>f.elapsedMs>=0&&f.elapsedMs<=400));
  assert(row.forecasts.some(f=>f.cached));
 }
 const cpu4=read(base+'reviewed/forecast-cpu4/checks.json');assert(cpu4.passed);assert.equal(cpu4.observations.length,3);
 assert(cpu4.observations.every(f=>Number.isFinite(f.elapsedMs)&&Number.isFinite(f.computeMs)));
});
test('earned loss attribution stays exact and scouting reaches three distinct clues',()=>{
 const rules=read(base+'rules/checks.json'),scout=read(base+'reviewed/scouting-route/checks.json');
 assert(rules.passed);assert.equal(rules.outcome.firstFallen.id,'mochi');assert.deepEqual(rules.outcome.damageByRow,{front:1194,rear:1612});
 assert(rules.advice.after.wins>rules.advice.before.wins);
 assert(scout.passed);assert.deepEqual(scout.errors,[]);assert.equal(scout.timeline.at(-1).node,'boss');
 assert(scout.timeline.some(r=>r.node==='event'));assert(scout.timeline.some(r=>r.node==='elite'));
 assert.match(scout.forecast.text,/Risky|Even|Favoured/);
});
