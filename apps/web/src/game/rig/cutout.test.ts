import {expect,it} from 'vitest';
import * as T from 'three';
import nativeJson from '../../../public/units/marigold/rig.json?raw';
import {CutoutMesh,blinkAt,type CutoutData} from './cutout';
import {withRigContract} from './contract';
const native=JSON.parse(nativeJson) as CutoutData;

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

it('adapts legacy designer names without rewriting their geometry or motion',()=>{
 const data=structuredClone(native) as CutoutData;delete data.clips.cast;delete data.clips.ultimate;
 const parts=JSON.stringify(data.parts),tracks=JSON.stringify(data.clips.skill!.tracks),nodes=JSON.stringify(data.nodes);
 withRigContract(data);withRigContract(data);
 expect(JSON.stringify(data.parts)).toBe(parts);expect(JSON.stringify(data.nodes)).toBe(nodes);expect(JSON.stringify(data.clips.skill!.tracks)).toBe(tracks);
 expect(data.clips.cast!.tracks).toEqual(data.clips.skill!.tracks);expect(data.clips.ultimate!.events.some(e=>e.name==='ult_release')).toBe(true);
 expect(data.clips.death!.events.some(e=>e.name==='dust')).toBe(true);
});
