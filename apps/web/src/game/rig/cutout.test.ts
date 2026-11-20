import {expect,it} from 'vitest';
import * as T from 'three';
import nativeJson from '../../../public/units/marigold/rig.json?raw';
import {CutoutMesh,blinkAt,faceAt,type CutoutData} from './cutout';
import {withRigContract} from './contract';
import {drawingAt,type DrawingManifest,type DrawingSet,type DrawingKey} from './drawing-layer';
import poseManifest from '../../../public/units/soot/poses/manifest.json';
const native=JSON.parse(nativeJson) as CutoutData;

it('defers hidden native vertex uploads while keeping bones, bounds and restoration exact',()=>{
 const set:DrawingSet={manifest:poseManifest as unknown as DrawingManifest,textures:Object.fromEntries(['K0','K1','K2','K4','K5'].map(k=>[k,new T.Texture()]))};
 const shown=new CutoutMesh(native,[new T.Texture()]),hidden=new CutoutMesh(native,[new T.Texture()]);
 const attributes=(mesh:CutoutMesh)=>mesh.children.filter((node):node is T.Mesh=>node instanceof T.Mesh).map(node=>node.geometry.attributes.position as T.BufferAttribute);
 const buffers=attributes(hidden),reference=attributes(shown),vertices=(list:T.BufferAttribute[])=>list.map(buffer=>Array.from(buffer.array));
 hidden.installDrawings(set,[0,0],1);
 let blinkClock=0;while(blinkAt(blinkClock,native.face!.seed)<.5)blinkClock+=1/120;
 for(const name of ['idle','attack','ult','hurt','ko','victory'])for(const at of [0,.35,.65,.09]){
  const versions=buffers.map(buffer=>buffer.version);
  shown.proceduralTime=hidden.proceduralTime=blinkClock+at;
  shown.pose(at,name);hidden.pose(at,name);
  expect(hidden.bones).toEqual(shown.bones);
  expect(buffers.map(buffer=>buffer.version)).toEqual(versions);
  // The sampled clock is retained even if the next procedural clock is staged.
  hidden.proceduralTime=blinkClock+20;
  expect(hidden.skeleton.getBoundsRect()).toEqual(shown.skeleton.getBoundsRect());
  expect(vertices(buffers)).toEqual(vertices(reference));
  const flushed=buffers.map(buffer=>buffer.version);
  hidden.skeleton.getBoundsRect();expect(buffers.map(buffer=>buffer.version)).toEqual(flushed);
 }
 shown.proceduralTime=hidden.proceduralTime=blinkClock;
 shown.pose(.26,'attack');hidden.pose(.26,'attack');
 hidden.clearDrawings();expect(vertices(buffers)).toEqual(vertices(reference));
 expect(hidden.children.every(node=>node.visible)).toBe(true);
 shown.pose(.13,'hurt');hidden.pose(.13,'hurt');expect(vertices(buffers)).toEqual(vertices(reference));
 shown.dispose();hidden.dispose();
});

it('shows exactly one private drawing while retaining shared texture ownership and restoring rig visibility',()=>{
 const set:DrawingSet={manifest:poseManifest as unknown as DrawingManifest,textures:Object.fromEntries(['K0','K1','K2','K4','K5'].map(k=>[k,new T.Texture()]))};
 const a=new CutoutMesh(native,[new T.Texture()]),b=new CutoutMesh(native,[new T.Texture()]);
 const original=a.children[0]!,one=a.installDrawings(set,[0,0],1),two=b.installDrawings(set,[0,0],1);
 let disposed=0;for(const texture of Object.values(set.textures))texture.addEventListener('dispose',()=>disposed++);
 one.sample('attack',.35,false);a.pose(.35,'attack');
 expect(one.key).toBe('K2');expect(two.key).toBe('K0');expect(one.material.map).toBe(set.textures.K2);
 expect(original.visible).toBe(false);expect(a.children.filter(c=>c.visible&&c instanceof T.Mesh)).toEqual([one]);
 expect(one.geometry).not.toBe(two.geometry);expect(one.material).not.toBe(two.material);
 a.state.clearTracks();expect(one.key).toBe('K0');expect(one.material.map).toBe(set.textures.K0);
 one.sample('ult',1.1,false);a.skeleton.setToSetupPose();expect(one.key).toBe('K0');
 a.clearDrawings();expect(original.visible).toBe(true);expect(one.parent).toBeNull();expect(disposed).toBe(0);
 a.dispose();b.dispose();expect(disposed).toBe(0);
});

it('seeks discrete keys and foot-local overlap without accumulated state, with a stationary impact hold',()=>{
 const set:DrawingSet={manifest:poseManifest as unknown as DrawingManifest,textures:Object.fromEntries(['K0','K1','K2','K4','K5'].map(k=>[k,new T.Texture()]))};
 const mesh=new CutoutMesh(native,[new T.Texture()]),layer=mesh.installDrawings(set,[17,23],.7);
 const vertices=()=>Array.from(layer.geometry.attributes.position!.array);
 layer.sample('attack',.35,false);const impact=vertices();layer.sample('attack',.439,false);expect(vertices()).toEqual(impact);
 layer.sample('ult',1.1,false);expect(layer.key).toBe('K5');layer.sample('attack',.35,false);expect(vertices()).toEqual(impact);
 for(const name of ['idle','attack','ult','hurt'])for(const t of [0,.15,.3,.35,.6,1.1,2.2]){
  layer.sample(name,t,false);expect(layer.point(set.manifest.baseline)).toEqual({x:17,y:23});
  for(const p of layer.faceCorners())expect(Number.isFinite(p.x+p.y)).toBe(true);
 }
 layer.sample('attack',.35,true);expect(layer.key).toBe('K2');mesh.dispose();
});

it('samples a launch socket without changing the visible key, mesh or later reverse seeks',()=>{
 const set:DrawingSet={manifest:poseManifest as unknown as DrawingManifest,textures:Object.fromEntries(['K0','K1','K2','K4','K5'].map(k=>[k,new T.Texture()]))};
 const mesh=new CutoutMesh(native,[new T.Texture()]),layer=mesh.installDrawings(set,[17,23],.7);
 const pixel=set.manifest.poses.K1!.sockets.vfxOrigin!,at={clip:'attack',seconds:.2,reduced:false};
 layer.sample('attack',.2,false);const launch=layer.point(pixel,'K1');
 layer.sample('attack',.3,false);expect(layer.key).toBe('K2');
 const vertices=Array.from(layer.geometry.attributes.position!.array);
 expect(layer.point(pixel,'K1',at)).toEqual(launch);expect(layer.key).toBe('K2');
 expect(Array.from(layer.geometry.attributes.position!.array)).toEqual(vertices);
 layer.sample('ult',1.6,false);expect(layer.point(pixel,'K1',at)).toEqual(launch);
 layer.sample('attack',.2,false);expect(layer.point(pixel,'K1')).toEqual(launch);
 layer.sample('attack',.3,true);expect(layer.key).toBe('K1');mesh.dispose();
});

it('shows a retaliation drawing during a cast without losing its presentation time on seek or return',()=>{
 const set:DrawingSet={manifest:poseManifest as unknown as DrawingManifest,textures:Object.fromEntries(['K0','K1','K2','K4','K5'].map(k=>[k,new T.Texture()]))};
 const mesh=new CutoutMesh(native,[new T.Texture()]),layer=mesh.installDrawings(set,[0,0],1);
 layer.sample('ult',1.1,false,0);expect(layer.key).toBe('K4');
 layer.sample('ult',1.275,true,.175);expect(layer.key).toBe('K4');
 layer.sample('ult',1.28,false,.18);expect(layer.key).toBe('K5');
 layer.sample('ult',1.0,false,-.1);expect(layer.key).toBe('K5');
 layer.sample('ult',1.1,false,0);expect(layer.key).toBe('K4');
 layer.sample('ult',2.2,false,1.1);expect(layer.key).toBe('K0');mesh.dispose();
});

it('moves painted cloth regions while preserving faces, feet and non-inverted mesh triangles',()=>{
 const manifest=structuredClone(poseManifest) as unknown as DrawingManifest;
 const plain=structuredClone(manifest);for(const frame of Object.values(plain.poses))delete frame.overlap;
 const textures=Object.fromEntries(['K0','K1','K2','K4','K5'].map(k=>[k,new T.Texture()]));
 const a=new CutoutMesh(native,[new T.Texture()]),b=new CutoutMesh(native,[new T.Texture()]);
 const layer=a.installDrawings({manifest,textures},[0,0],1),baseline=b.installDrawings({manifest:plain,textures},[0,0],1);
 for(const [name,t]of [['idle',.9],['attack',.15],['attack',.28],['attack',.3],['attack',.32],['attack',.5],['hurt',.15],['ult',.7]] as const){
  layer.sample(name,t,false);baseline.sample(name,t,false);
  expect(layer.faceCorners()).toEqual(baseline.faceCorners());expect(layer.contactPoints()).toEqual(baseline.contactPoints());
  const region=layer.frame.overlap![0]!,p=layer.point(region.center),q=baseline.point(region.center);
  expect(Math.hypot(p.x-q.x,p.y-q.y)).toBeGreaterThan(.1);
  const g=layer.geometry,indices=g.index!,v=g.attributes.position!;
  for(let i=0;i<indices.count;i+=3){
   const x=indices.getX(i),y=indices.getX(i+1),z=indices.getX(i+2);
   const cross=(v.getX(y)-v.getX(x))*(v.getY(z)-v.getY(x))-(v.getY(y)-v.getY(x))*(v.getX(z)-v.getX(x));
   expect(cross).toBeGreaterThan(0);
  }
 }
 a.dispose();b.dispose();
});

it('holds action drawings inside the common basic/ultimate envelopes and limits the hit drawing',()=>{
 const cases:[string,number,DrawingKey][]=[['attack',0,'K0'],['attack',.05,'K1'],['attack',.27,'K1'],['attack',.33,'K2'],['attack',.5,'K2'],['attack',.8,'K0'],['ult',0,'K1'],['ult',.3,'K5'],['ult',1.1,'K5'],['ult',2.2,'K0'],['hurt',0,'K4'],['hurt',.17,'K4'],['hurt',.2,'K0'],['ko',.4,'K4']];
 for(const [name,time,key]of cases)expect(drawingAt(name,time)).toBe(key);
});

it('seeks shared clips without history and keeps pose state private',()=>{
 const data=native as CutoutData,a=new CutoutMesh(data,[new T.Texture()]),b=new CutoutMesh(data,[new T.Texture()]);
 const positions=(m:CutoutMesh)=>Array.from((m.children[0] as T.Mesh).geometry.attributes.position!.array);
 a.pose(.26,'attack');const contact=positions(a);a.pose(.7,'death');a.pose(.26,'attack');expect(positions(a)).toEqual(contact);
 expect(positions(b)).not.toEqual(contact);expect(a.bones[0]).not.toBe(b.bones[0]);
 for(const name of ['idle','victory','stunned']){a.pose(0,name);const first=positions(a);a.pose(data.clips[name]!.duration,name);expect(positions(a)).toEqual(first);}
 for(const part of data.parts)for(const vertex of part.vertices){expect(vertex.reduce((n,w)=>n+w.weight,0)).toBeCloseTo(1,4);expect(vertex.every(w=>Number.isFinite(w.x+w.y)&&w.bone>=0&&w.bone<data.nodes.length)).toBe(true);}
 a.dispose();b.dispose();
});

it('keeps blink timing deterministic and independent of the clip loop',()=>{
 const peaks:number[]=[];let prior=0;
 for(let i=0;i<3000;i++){const at=i/60,blink=blinkAt(at,23);expect(blink).toBeGreaterThanOrEqual(0);expect(blink).toBeLessThanOrEqual(1);if(blink>0&&prior===0)peaks.push(at);prior=blink;}
 expect(peaks.length).toBeGreaterThan(8);
 for(let i=1;i<peaks.length;i++){expect(peaks[i]!-peaks[i-1]!).toBeGreaterThanOrEqual(2.48);expect(peaks[i]!-peaks[i-1]!).toBeLessThanOrEqual(5.02);}
 const time=peaks[0]!+.03;expect(blinkAt(time,23)).toBe(blinkAt(time,23));expect(blinkAt(time,23)).not.toBe(blinkAt(time+1.8,23));
});

it('swaps painted eyelids independently of speaking and restores the neutral mouth',()=>{
 let clock=0;while(blinkAt(clock,23)<.5)clock+=1/120;
 expect(faceAt('cast',.3,1,clock,23)).toEqual({closed:true,mouth:'mouth_open'});
 expect(faceAt('ultimate',.5,2,clock,23).mouth).toBe('mouth_shout');
 expect(faceAt('cast',1,1,0,23)).toEqual({closed:false,mouth:'mouth_neutral'});
 expect(faceAt('death',.4,1,0,23).closed).toBe(true);
 expect(faceAt('idle',.8,1.8,clock,23)).toEqual(faceAt('idle',.8,1.8,clock,23));
});

it('adapts legacy designer names without rewriting their geometry or motion',()=>{
 const data=structuredClone(native) as CutoutData;delete data.clips.cast;delete data.clips.ultimate;
 const parts=JSON.stringify(data.parts),tracks=JSON.stringify(data.clips.skill!.tracks),nodes=JSON.stringify(data.nodes);
 withRigContract(data);withRigContract(data);
 expect(JSON.stringify(data.parts)).toBe(parts);expect(JSON.stringify(data.nodes)).toBe(nodes);expect(JSON.stringify(data.clips.skill!.tracks)).toBe(tracks);
 expect(data.clips.cast!.tracks).toEqual(data.clips.skill!.tracks);expect(data.clips.ultimate!.events.some(e=>e.name==='ult_release')).toBe(true);
 expect(data.clips.death!.events.some(e=>e.name==='dust')).toBe(true);
});
