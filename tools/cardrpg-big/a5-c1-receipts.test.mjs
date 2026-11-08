// REFERENCE: PROMPT-A5 C1. Test completed evidence, without resampling or changing gameplay.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
const base='reports/cardrpg-big/a5/c1/reviewed';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const audit=await json(base+'/audit.json');
test('C1 reviewed source and six successful logs match the tested commit',async()=>{
 assert.equal(audit.status,'PASS');
 for(const [path,expected] of Object.entries(audit.source))assert.equal(hash(execFileSync('git',['show',`${audit.runtimeHead}:${path}`])),expected,path);
 assert.deepEqual(audit.gates.map(r=>r.name),['typecheck','lint','web-unit','rules','e2e','build']);
 for(const row of audit.gates){assert.equal(row.code,0,row.name);assert.equal(row.head,audit.runtimeHead);assert.equal(hash(await readFile(row.log)),row.sha256);}
});
test('three desktop sizes bind interaction, overflow and contrast checks to the C1 artifact',async()=>{
 for(const width of [1280,1440,1024]){
  const receipt=await json(`${base}/browser/browser-${width}/checks.json`);
  assert.equal(receipt.sha256,audit.artifact.sha256);assert.equal(receipt.captures.length,10);assert.equal(receipt.checks.length,5);
  assert.deepEqual(receipt.errors,[]);assert.deepEqual(receipt.remote,[]);
  for(const capture of receipt.captures){assert.equal(capture.overflow,0);assert(capture.contrast.every(x=>x.ratio>=4.5));}
  const png=await readFile(`${base}/browser/browser-${width}/prepare-player.png`);
  assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),width===1440?900:width===1280?720:600);
 }
});
test('visible equipment actions and corrected paired copy receipts retain measured results',async()=>{
 const equip=await json(base+'/equip-regression/checks.json');assert.equal(equip.sha256,audit.artifact.sha256);
 assert.deepEqual(equip.errors,[]);assert.equal(equip.checks.length,3);assert.deepEqual(equip.checks,audit.equipRegression);
 const copy=await json(base+'/browser/comparison.json');assert.deepEqual(copy.errors,[]);assert.deepEqual(copy.comparisons,audit.copyComparison);
 assert.equal(copy.comparisons.length,6);for(const row of copy.comparisons){assert.equal(row.delta,row.after-row.before);assert(row.delta<0);}
});
test('OFF reuse is backed by unchanged rules, historical receipt and exact frozen baseline',async()=>{
 const h0=await json('reports/cardrpg-big/a5/h0/closure.json');
 assert.equal(audit.off.sha256,h0.off.sha256);assert.equal(audit.off.cells,165);assert.equal(audit.off.routes,8250);
 const rules=Object.entries(h0.source).filter(([path])=>path.startsWith('packages/game-rules/'));
 assert.equal(rules.length,audit.off.ruleFiles);
 for(const [path,expected] of rules)assert.equal(hash(execFileSync('git',['show',`${audit.runtimeHead}:${path}`])),expected,path);
 const baseline=await readFile('docs/cardrpg3/baseline-v1.html');assert.equal(baseline.length,23937000);assert.equal(hash(baseline),'9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3');
});
