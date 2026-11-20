import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {casterGestures,makeCasterClip} from '../../tools/cinematic-compositor/caster-motion.mjs';
for(const id of Object.keys(casterGestures).filter(id=>!['mochi','soot','clover'].includes(id)))test(id+' plate gesture never mutates field animation or its timing',()=>{
 const data=JSON.parse(readFileSync(new URL('../../apps/web/public/units/'+id+'/rig.json',import.meta.url))),before=JSON.stringify(data);
 const clip=data.clips.ultimate,release=clip.events.find(e=>e.name==='ult_release')?.time??clip.duration*.55;
 const motion=makeCasterClip(data,id,'ultimate',release);
 assert.equal(JSON.stringify(data),before);assert.equal(motion.clip.duration,clip.duration);assert.deepEqual(motion.clip.events,clip.events);
 assert.ok(motion.joints.length>=4);const added=motion.clip.tracks.slice(clip.tracks.length);
 assert.ok(added.every(t=>data.nodes[t.node].name!=='root'&&t.property==='rotate'));
 assert.ok(added.every(t=>t.keys.at(-1).time===clip.duration&&t.keys.at(-1).value===0));
 assert.ok(added.every(t=>t.keys[1].value!==t.keys[3].value));
});
test('socket-only contract aliases cannot steal a painted arm gesture',()=>{
 const data=JSON.parse(readFileSync(new URL('../../apps/web/public/units/panko/rig.json',import.meta.url)));
 for(const side of ['l','r']){
  const original=data.nodes.find(n=>n.name==='arm_upper_'+side);original.name=side+'-arm-upper';
  data.nodes.push({name:'arm_upper_'+side,parent:0,x:0,y:0,rotation:0,sx:1,sy:1});
 }
 const result=makeCasterClip(data,'panko','ultimate',data.clips.ultimate.duration*.55);
 assert.ok(result.joints.includes('l-arm-upper'));assert.ok(result.joints.includes('r-arm-upper'));
 assert.ok(!result.joints.includes('arm_upper_l'));assert.ok(!result.joints.includes('arm_upper_r'));
});
