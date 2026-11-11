import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {ROOT,readSlots,validateDelivery} from './validate.mjs';
const {units}=await readSlots();
for(const unit of units)test(`${unit.id}: actual atlas/skeleton fits ${unit.tier} size and animation contract`,async()=>{
 const result=await validateDelivery(resolve(ROOT,dirname(unit.placeholder.skeleton)),unit);
 assert.equal(result.accepted,true,JSON.stringify(result.issues));
 assert.ok(Math.abs(result.metrics.height-unit.targetHeight)<.01);
 assert.equal(Object.keys(result.animations).length,unit.animations.length);
 assert.ok(result.metrics.pages>=1);assert.ok(result.metrics.meshVertices<=unit.budgets.meshVertices);
});
test('published PSD pilot keeps a linked tail, blink alternatives, cloth motion and source hashes',async()=>{
 const pilot=JSON.parse(await readFile(resolve(ROOT,'assets/cardrpg-look/spine/mochi/psd-placeholder/mochi.json')));
 assert.equal(pilot.laneC.parts,68);assert.ok(pilot.bones.length<=40);
 assert.equal(pilot.bones.find(b=>b.name==='tail-5').parent,'tail-4');
 assert.ok(pilot.animations.idle.slots['eye-r-closed'].attachment.some(a=>a.name==='eye-r-closed'));
 assert.ok(pilot.animations.idle.bones['skirt-front-r']);
 assert.equal(Object.keys(pilot.laneC.sourceHashes).length,3);assert.equal(pilot.laneC.status,'placeholder');
});
