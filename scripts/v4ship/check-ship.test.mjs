import {test} from 'node:test';
import assert from 'node:assert/strict';
import {funnelGate} from './check-ship.mjs';
const samples=()=>[1280,1440].flatMap(width=>Array.from({length:10},(_,n)=>({id:`${width}-${n}`,viewport:{width,height:width===1280?720:900},cleanProfile:true,realClicks:true,steps:Array.from({length:7},(_,i)=>({number:i+1,status:'pass'})),firstBattleMs:5000,firstBattleClicks:3,firstReceiptMs:170000,errors:[],networkFailures:[],httpFailures:[],popups:[]})));
test('requires twenty complete profiles, all receipt samples and both sizes',()=>{
 assert.equal(funnelGate(samples()).pass,true);
 assert.equal(funnelGate([]).pass,false);
 assert.equal(funnelGate(samples().slice(1)).pass,false);
 const missing=samples();delete missing[0].firstReceiptMs;assert.equal(funnelGate(missing).pass,false);
 const blocked=samples();blocked[0].steps[4].status='blocked';assert.equal(funnelGate(blocked).pass,false);
});
test('a fast median cannot hide a late receipt, popup or failed request',()=>{
 for(const change of [r=>r.firstReceiptMs=240001,r=>r.popups.push({}),r=>r.httpFailures.push({status:500}),r=>r.networkFailures.push({}),r=>r.errors.push({})]){
  const rows=samples();change(rows[0]);assert.equal(funnelGate(rows).pass,false);
 }
});
