import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {PNG} from 'pngjs';
import {ROOT,readSlots,validateDelivery} from './validate.mjs';
const {units}=await readSlots();
for(const unit of units)test(`${unit.id}: actual atlas/skeleton fits ${unit.tier} size and animation contract`,async()=>{
 const result=await validateDelivery(resolve(ROOT,dirname(unit.placeholder.skeleton)),unit);
 assert.equal(result.accepted,true,JSON.stringify(result.issues));
 assert.ok(Math.abs(result.metrics.height-unit.targetHeight)<.01);
 assert.equal(Object.keys(result.animations).length,unit.animations.length);
 assert.ok(result.metrics.pages>=1);assert.ok(result.metrics.meshVertices<=unit.budgets.meshVertices);
});
test('published layered pilot retains source provenance, shared meshes, props and blink alternatives',async()=>{
 const pilot=JSON.parse(await readFile(resolve(ROOT,units.find(u=>u.id==='mochi').placeholder.skeleton)));
 assert.equal(pilot.laneC.parts,115);assert.ok(pilot.bones.length<=40);
 assert.equal(pilot.bones.find(b=>b.name==='tail-5').parent,'tail-4');
 assert.equal(pilot.bones.find(b=>b.name==='shield').parent,'off-hand');
 assert.equal(pilot.bones.find(b=>b.name==='lantern').parent,'shield');
 const attachments=pilot.skins[0].attachments;
 for(const name of ['neck','apron-bib','tail-1','tail-5','skirt-panel-center','r-arm-upper','l-paw']){
  const mesh=attachments[name][name];assert.equal(mesh.type,'mesh',name);
  for(let cursor=0;cursor<mesh.vertices.length;){
   const count=mesh.vertices[cursor++];let sum=0;
   for(let i=0;i<count;i++){const[bone,x,y,weight]=mesh.vertices.slice(cursor,cursor+4);cursor+=4;assert.ok(pilot.bones[bone]&&[x,y,weight].every(Number.isFinite),name);assert.ok(weight>0&&weight<=1,name);sum+=weight;}
   assert.ok(Math.abs(sum-1)<1e-7,name+' normalized weights');
  }
 }
 for(const clip of ['idle','victory'])for(const side of ['r','l']){
  const slots=pilot.animations[clip].slots;
  for(const part of ['white','iris','pupil','sparkle-1','sparkle-2','lashline-top','lashline-bottom'])assert.equal(slots[`eye-${side}-${part}`].attachment[1].name,null,'open art hidden during blink');
  for(const part of ['eyelid','closed'])assert.equal(slots[`eye-${side}-${part}`].attachment[1].name,`eye-${side}-${part}`,'complete blink cover');
 }
 assert.ok(pilot.animations.idle.bones.cloth);
 assert.equal(pilot.laneC.maskedLayers.length,10);
 for(const file of ['rig-metadata.json','mochi-rig-3-4-right.psd','mochi-rig-notes.md','mochi-rig-gate-results.json','source-records.json'])assert.match(pilot.laneC.sourceHashes[file],/^[a-f0-9]{64}$/);
 assert.equal(pilot.laneC.status,'placeholder');
 const atlas=PNG.sync.read(await readFile(resolve(ROOT,dirname(units.find(u=>u.id==='mochi').placeholder.skeleton),'mochi.png')));
 for(let i=0;i<atlas.data.length;i+=4)assert.ok(atlas.data[i]<=atlas.data[i+3]&&atlas.data[i+1]<=atlas.data[i+3]&&atlas.data[i+2]<=atlas.data[i+3],'premultiplied atlas edges');
});
