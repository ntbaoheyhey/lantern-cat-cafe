import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requiredCallouts,validateCalloutCoverage} from './callout-roster.mjs';

test('callout coverage derives playable and enemy skills from executable rules and fails for a missing line',async()=>{
 const required=await requiredCallouts();
 assert.equal(required.roster.length,25);
 assert.equal(required.rows.filter(r=>r.kind==='skill').length,62);
 assert.equal(required.rows.find(r=>r.cueId==='voice.mochi.ult.charge').text,'Shields!');
 const manifest={cues:Object.fromEntries(required.rows.map(row=>[row.cueId,[0,1].map(n=>({variantId:String(n),bus:'voice',processedVoice:true}))]))};
 assert.deepEqual(validateCalloutCoverage(required,required.rows,manifest),[]);
 assert.ok(validateCalloutCoverage(required,required.rows.slice(1),manifest).some(e=>e.includes('expected one')));
 const id=required.rows.find(r=>r.kind==='ultimate').cueId;manifest.cues[id].pop();
 assert.ok(validateCalloutCoverage(required,required.rows,manifest).some(e=>e.includes('two distinct')));
});
