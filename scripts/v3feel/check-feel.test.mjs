import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {gates,fixtures,evaluateGate,validateEvidence} from './check-feel.mjs';
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
