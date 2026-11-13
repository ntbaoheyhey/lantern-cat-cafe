import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summonMotions,summonVertex} from '../../tools/cinematic-compositor/summon-motion.mjs';

test('all summon meshes preserve winding through entrance, charge and release',()=>{
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  for(const id of Object.keys(summonMotions))for(let f=0;f<68;f++){
    let minimum=Infinity,peak=0;
    for(let y=0;y<40;y++)for(let x=0;x<48;x++){
      const a=summonVertex(id,x/48,y/40,f),b=summonVertex(id,(x+1)/48,y/40,f),c=summonVertex(id,x/48,(y+1)/40,f),d=summonVertex(id,(x+1)/48,(y+1)/40,f);
      minimum=Math.min(minimum,cross(a,b,c),cross(b,d,c));
      peak=Math.max(peak,Math.hypot(a.x-x/48,a.y-y/40));
    }
    assert.ok(minimum>0,`${id} frame ${f}: folded triangle`);
    assert.ok(peak<.12,`${id} frame ${f}: excessive painting stretch`);
  }
});

test('wing and tail articulation moves relative to the head; rigid lantern stays bounded',()=>{
  for(const id of ['brioche','biscuit']){
    const face=summonVertex(id,.5,.3,32),wing=summonVertex(id,.08,.18,32);
    assert.ok(Math.hypot(face.x-.5,face.y-.3)<.002);
    assert.ok(Math.hypot(wing.x-.08,wing.y-.18)>.02);
  }
  for(let f=0;f<68;f++){
    const bell=summonVertex('mochi',.5,.35,f);
    assert.deepEqual(bell,{x:.5,y:.35});
  }
  const nose=summonVertex('soot',.16,.82,24),tail=summonVertex('soot',.77,.20,24);
  assert.ok(Math.hypot(nose.x-.16,nose.y-.82)<.001);
  assert.ok(Math.hypot(tail.x-.77,tail.y-.20)>.02);
});

test('all thirteen motifs have articulation independent of whole-image motion',()=>{
  assert.equal(Object.keys(summonMotions).length,13);
  for(const id of Object.keys(summonMotions)){
    const vertices=[[.13,.2],[.82,.25],[.3,.75],[.8,.8]];
    let peak=0,relative=0;
    for(let f=12;f<55;f++){
      const displacement=vertices.map(([x,y])=>{const p=summonVertex(id,x,y,f);return [p.x-x,p.y-y];});
      peak=Math.max(peak,...displacement.map(([x,y])=>Math.hypot(x,y)));
      relative=Math.max(relative,...displacement.map(([x,y])=>Math.hypot(x-displacement[0][0],y-displacement[0][1])));
    }
    assert.ok(peak>.006,id+' still rigid');
    assert.ok(relative>.005,id+' only translates');
  }
});
