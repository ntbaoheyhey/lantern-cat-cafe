import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {craftOwner,completedItems,selectedItems,scopedDefects,learningReceipt,craftTimeReceipt} from './craft-policy.mjs';
import {gates,evaluateGate,checkFeel,root} from './check-feel.mjs';

test('scope PASS: future defects do not block Q1',()=>{
 const defects=[{owner:'Q2',defect:true},{owner:'Q3',defect:true},{owner:'Q1',defect:false}];
 assert.deepEqual(scopedDefects(defects,'Q1'),[]);
 const results=checkFeel({},root,{item:'Q1',done:[]});
 assert(results.every(r=>['Q1','GLOBAL'].includes(r.item)));
 assert(!results.some(r=>r.key==='craft.B05'));
});
test('scope FAIL: own and completed-item defects cannot be filtered away',()=>{
 const defects=[{owner:'Q1',defect:true},{owner:'Q2',defect:true},{owner:'Q3',defect:true}];
 assert.equal(scopedDefects(defects,'Q2',['Q1']).length,2);
 assert.equal(checkFeel({},root,{item:'Q2',done:['Q1']}).some(r=>r.id==='Q1.staticCameraFraction'),true);
 assert.equal(selectedItems('Q2',['Q0','QR','Q1']).has('QR'),false);
 assert.deepEqual(completedItems('| Q0 | baseline | x |\n| Q1 | done | x |\n| Q2 | started | x |'),['Q1']);
});
test('craft ownership retains every row and puts listening under objective Q5',()=>{
 assert.equal(craftOwner('B01'),'Q1');assert.equal(craftOwner('C10'),'Q2');
 assert.equal(craftOwner('B05'),'Q3');assert.equal(craftOwner('U23'),'Q4');assert.equal(craftOwner('B12'),'Q5');
 assert.equal(gates.filter(g=>g.key.startsWith('craft.')&&g.item!=='QR').length,54);
});
const timing=gates.find(g=>g.id==='Q1.ultimateDurationMs');
const samples=value=>['wave1','wave3','boss'].map(fixture=>({fixture,value}));
test('timing PASS: deterministic 2200 ms schedule; video confirmation independently required',()=>{
 assert.equal(evaluateGate(timing,{basis:'presentation-schedule',samples:samples(2200)}).state,'PASS');
 assert.equal(evaluateGate(gates.find(g=>g.id==='Q1.videoTimingErrorMs'),{samples:samples(33)}).state,'PASS');
});
test('timing FAIL: bad schedules or >33 ms video error; inference cannot masquerade as schedule',()=>{
 assert.equal(evaluateGate(timing,{basis:'presentation-schedule',samples:samples(2241.6)}).state,'FAIL');
 assert.equal(evaluateGate(timing,{basis:'post-draw',samples:samples(2200)}).state,'OPEN');
 assert.equal(evaluateGate(gates.find(g=>g.id==='Q1.videoTimingErrorMs'),{samples:samples(33.1)}).state,'FAIL');
 assert.equal(evaluateGate(gates.find(g=>g.id==='Q1.actionOverlapMs'),{basis:'presentation-schedule',samples:samples(.001)}).state,'FAIL');
});
test('audio PASS/FAIL is objective and isolated to Q5',()=>{
 for(const [key,good,bad] of [['onsetErrorMs',33,34],['onsetCoverage',1,.99],['unmappedOnsets',0,1],['spectralLabelFraction',1,.99],['simultaneousVoices',4,5]]){
  const gate=gates.find(g=>g.id==='Q5.'+key);
  assert.equal(evaluateGate(gate,{samples:samples(good)}).state,'PASS');
  assert.equal(evaluateGate(gate,{samples:samples(bad)}).state,'FAIL');
 }
 assert(!gates.some(g=>g.id==='Q1.audioMappingComplete'));
});
test('desktop and cheap-regression scope follow the new explicit request',()=>{
 assert(!gates.some(g=>g.key==='phonePlayable'));
 const width=gates.find(g=>g.id==='Q6.screenWidthCases');
 assert.equal(evaluateGate(width,{samples:[{value:108}]}).state,'PASS');
 assert.equal(evaluateGate(width,{samples:[{value:54}]}).state,'FAIL');
 assert(!gates.some(g=>g.id==='Q1.browserSuite'));
 assert(gates.some(g=>g.id==='Q2.browserSuite'));
 assert(gates.some(g=>g.id==='R3.bLaneGates'));
});
test('learning PASS: real source record, numeric experiment, and commit citation',()=>{
 const base=mkdtempSync(resolve(root,'tools/v3craft-lab/c0/.test-'));
 try{
  const dir=join(base,'reports/v3-feel/LEARN');mkdirSync(dir,{recursive:true});
  writeFileSync(join(base,'experiment.json'),'{"approachA":54,"approachB":0}');
  const sources=[['formal','https://example.test/formal'],['doc','https://example.test/1'],['doc','https://example.test/2'],['doc','https://example.test/3'],['experiment','experiment.json'],['local','local-code']].map(([type,url_or_path],i)=>({id:'source'+i,topic:'C0',type,url_or_path}));
  writeFileSync(join(dir,'C0.md'),sources.map(s=>s.id).join('\n'));
  const message='V3CRAFT C0\nLearn: reports/v3-feel/LEARN/C0.md';
  assert.equal(learningReceipt(base,'C0',sources,message).pass,true);
  assert.equal(learningReceipt(base,'C0',sources,'uncited').pass,false);
  assert.equal(learningReceipt(base,'C0',sources.filter(s=>s.type!=='formal'),message).pass,false);
  assert.equal(learningReceipt(base,'C0',sources.map(s=>s.type==='doc'?{...s,url_or_path:'https://example.test/1'}:s),message).pass,false);
  writeFileSync(join(base,'experiment.json'),'{}');assert.equal(learningReceipt(base,'C0',sources,message).pass,false);
 }finally{rmSync(base,{recursive:true,force:true});}
});
function validTimeLog(){
 const t=Date.parse('2026-11-14T00:00:00Z'),at=min=>new Date(t+min*60000).toISOString();
 const step=(start,end,category,revision=0)=>({item:'Q3.B',asset:'soot-ultimate',kind:'ultimate',category,revision,start:at(start),end:at(end),...(category==='review'?{reviewPath:'REVIEW/pilot.md'}:{})});
 return {expectedAssets:[{item:'Q3.B',id:'soot-ultimate',kind:'ultimate'}],steps:[step(0,20,'author'),step(20,25,'review',1),step(25,45,'author',1),step(45,50,'review',2),step(50,70,'author',2)]};
}
test('craft time PASS: real intervals, sixty authoring minutes and two reviewed revisions',()=>{
 const result=craftTimeReceipt(validTimeLog(),'Q3.B');assert.equal(result.pass,true,JSON.stringify(result));
});
test('craft time FAIL: second-long work, overlap, missing revisions, missing reviews, and unmeasured roster',()=>{
 for(const mutate of [
  l=>l.steps[0].end=new Date(Date.parse(l.steps[0].start)+21000).toISOString(),
  l=>l.steps[2].start=l.steps[0].start,
  l=>l.steps[4].revision=1,
  l=>delete l.steps[1].reviewPath,
  l=>l.expectedAssets.push({item:'Q3.B',id:'missing-basic',kind:'basic'}),
  l=>l.expectedAssets[0].item='Q3.A',
  l=>l.steps[2].category='measure',
 ]){const log=validTimeLog();mutate(log);assert.equal(craftTimeReceipt(log,'Q3.B').pass,false);}
});
test('new number/washout/rung thresholds have independent rejecting examples',()=>{
 for(const [id,good,bad] of [['Q2.numbersOlderThan700Ms',0,1],['Q2.previousNumbersAtImpact',0,1],['Q2.numberEdgeColumns',0,1],['Q3.rungOne',0,1],['Q3.bodyContrastRetention',.6,.59],['Q3.outsideBodyFogArea',.15,.151],['Q3.poseSilhouetteChange',.08,.079]]){
  const gate=gates.find(g=>g.id===id);
  assert.equal(evaluateGate(gate,{samples:samples(good)}).state,'PASS');
  assert.equal(evaluateGate(gate,{samples:samples(bad)}).state,'FAIL');
 }
});
