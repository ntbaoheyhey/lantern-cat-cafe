import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {gates,fixtures,evaluateGate,validateEvidence,checkFeel,root} from './check-feel.mjs';
function values(g){
 if(g.op==='eq')return [g.limit,typeof g.limit==='boolean'?!g.limit:g.limit+1];
 if(g.op==='gte')return [g.limit,g.limit-1];if(g.op==='lte')return [g.limit,g.limit+1];
 if(g.op==='lt')return [g.limit-.001,g.limit];if(g.op==='between')return [g.limit[0],g.limit[1]+.001];
 if(g.op==='near')return [g.limit[0],g.limit[0]+g.limit[1]+.001];throw Error(g.op);
}
for(const gate of gates){
 const [good,bad]=values(gate),required=Array.isArray(gate.scope)?gate.scope:gate.scope==='fixtures'?fixtures:['all'];
 const sample=value=>({basis:'presentation-schedule',samples:required.map(fixture=>({fixture,value}))});
 test(`${gate.id}: fake PASS`,()=>assert.equal(evaluateGate(gate,sample(good)).state,'PASS'));
 test(`${gate.id}: fake FAIL`,()=>assert.equal(evaluateGate(gate,sample(bad)).state,'FAIL'));
 test(`${gate.id}: absent evidence stays OPEN`,()=>assert.equal(evaluateGate(gate,undefined).state,'OPEN'));
 if(gate.scope==='fixtures')test(`${gate.id}: cannot hide a missing fixture`,()=>assert.equal(evaluateGate(gate,{samples:[{fixture:'wave1',value:good}]}).state,'OPEN'));
 if(Array.isArray(gate.scope))test(`${gate.id}: wrong fixture stays OPEN`,()=>assert.equal(evaluateGate(gate,{samples:[{fixture:'wave1',value:good}]}).state,'OPEN'));
}
test('IDs are unique',()=>assert.equal(new Set(gates.map(g=>g.id)).size,gates.length));
test('named pose checks the unit and learning without selecting other units',()=>{
 const selected=checkFeel({},root,{item:'P.soot',done:['P0']});
 assert.deepEqual(selected.filter(g=>g.item==='P').map(g=>g.id),['P.learn','P.soot']);
 assert.ok(selected.some(g=>g.item==='P0'));
 assert.ok(selected.some(g=>g.item==='GLOBAL'));
 assert.equal(selected.find(g=>g.id==='P.soot').state,'OPEN');
});
test('P1 and per-unit learning both enforce twelve sources and two formal sources',()=>{
 const base=mkdtempSync(join(tmpdir(),'feel-pose-learn-'));
 try{
  mkdirSync(join(base,'reports/v3-feel/LEARN'),{recursive:true});
  const path='reports/v3-feel/LEARN/P1-poses.md';
  writeFileSync(join(base,'experiment.json'),'{"count":2}');
  for(const count of [6,12]){
   const sources=Array.from({length:count},(_,i)=>({id:'source-'+i,topic:'P1-poses',type:i<(count===12?2:1)?'formal':i===count-1?'experiment':'doc',url_or_path:i===count-1?'experiment.json':'https://example.org/'+i}));
   writeFileSync(join(base,path),sources.map(s=>s.id).join('\n'));
   writeFileSync(join(base,'reports/v3-feel/LEARN/sources.json'),JSON.stringify(sources));
   const data={buildCommits:{P1:{message:path}}};
   assert.equal(checkFeel(data,base,{item:'P1'}).find(g=>g.id==='P1.learn').state,count===12?'PASS':'FAIL');
   assert.equal(checkFeel(data,base,{item:'P.soot'}).find(g=>g.id==='P.learn').state,count===12?'PASS':'FAIL');
  }
 }finally{rmSync(base,{recursive:true});}
});
test('unsigned, missing, changed and escaping evidence is rejected',()=>{
 const dir=mkdtempSync(join(tmpdir(),'feel-gate-'));
 try{
  const path=join(dir,'frame.png');writeFileSync(path,'real-test-artifact');
  const evidence=[{path:'frame.png',sha256:createHash('sha256').update('real-test-artifact').digest('hex')}];
  assert.equal(validateEvidence({evidence},dir),null);
  writeFileSync(path,'changed');assert.match(validateEvidence({evidence},dir),/changed/);
  assert.match(validateEvidence({evidence:[]},dir),/No evidence/);
  assert.match(validateEvidence({evidence:[{path:'missing',sha256:'a'}]},dir),/Missing/);
  assert.match(validateEvidence({evidence:[{path:'../elsewhere',sha256:'a'}]},dir),/locality/);
 }finally{rmSync(dir,{recursive:true});}
});
