import {test} from 'node:test';
import assert from 'node:assert/strict';
import {frameSummary,transferSummary} from './metrics.mjs';
test('FPS retains a full second stall and rejects incomplete measurement',()=>{
 const t=Array.from({length:2401},(_,i)=>i*1000/60),smooth=frameSummary(t);
 assert(smooth.valid);assert.equal(smooth.medianFps,60);
 const stalled=frameSummary(t.filter(n=>n<10_000||n>11_000));
 assert(stalled.averageFps<smooth.averageFps);assert.equal(stalled.minimumWindowFps,0);
 assert.equal(frameSummary([]).valid,false);assert.equal(frameSummary([1,1]).valid,false);
 assert.equal(frameSummary(t.slice(0,100)).valid,false);
});
test('transfer includes late response bytes and rejects missing/cached/error evidence',()=>{
 const r={id:'1',path:'/bundle.js',observed:100,finished:true,totalBytes:500,cached:false,failed:false};
 const at=new Map([['1',100]]),records=new Map([['1',r],['2',{id:'2',totalBytes:9999}]]);
 const result=transferSummary(records,at);assert(result.valid);assert.equal(result.bytesObservedAtBattle,100);assert.equal(result.conservativeTransferBytes,500);
 for(const bad of [{finished:false},{cached:true},{failed:true},{totalBytes:undefined}])assert.equal(transferSummary(new Map([['1',{...r,...bad}]]),at).valid,false);
 assert.equal(transferSummary(new Map(),new Map()).valid,false);
});
