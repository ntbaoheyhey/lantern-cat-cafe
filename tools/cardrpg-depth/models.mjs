// Original geometry extensions. Shared transform-node rig, individually authored silhouettes.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { CAST, createModel } from '../art3d/cast.mjs';
import { animate } from '../art3d/animation.mjs';
import { installTextureExport } from '../art3d/materials.mjs';
import { THREE as T, group, ellipsoid, cylinder, torus, tube, rod, polygon, star, leaf, finish } from '../art3d/geometry.mjs';
import { GLTFExporter } from '../../apps/web/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
class Reader {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result=value;this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(value => { this.result=`data:${blob.type};base64,${Buffer.from(value).toString('base64')}`;this.onloadend?.(); }); }
}
globalThis.FileReader=Reader;
installTextureExport();
const cats = [
  ['mochi','guardian',1.72,[1.08,.96,1],[1.06,1,1],'door-tabard','#e6c590'],
  ['soot','witch',1.82,[.91,1.03,.98],[.9,1.04,1],'tall-lantern','#8d7ba6'],
  ['clover','alchemist',1.62,[1.12,.91,1.04],[.94,.95,1],'leaf-backpack','#90cbb1'],
  ['panko','guardian',1.52,[1.2,.84,1.12],[1.22,.85,1.1],'bread-hood','#d99d57'],
  ['mallow','witch',1.58,[.91,1.1,.94],[.8,1.12,.9],'whisk-fan','#e88f8c'],
  ['sorrel','alchemist',1.9,[.88,1.14,.93],[.8,1.12,.9],'droplet-hood','#6b9eb7'],
  ['biscuit','guardian',1.82,[1.1,.92,.95],[1.18,1.04,1.12],'rolling-pin','#c7a478'],
  ['inkcap','witch',1.6,[1.08,.9,1.05],[.9,.91,1],'mushroom-canopy','#afa3c6'],
  ['cinnamon','alchemist',1.66,[1.01,.98,1],[1.1,.91,1.1],'spice-scarf','#ce866b'],
  ['brioche','guardian',1.96,[.85,1.12,.91],[.83,1.13,.94],'crescent-bell','#e7d8ba'],
  ['velvet','witch',1.9,[.87,1.13,.9],[.77,1.16,.88],'silk-wings','#737dba'],
  ['marigold','alchemist',1.78,[1.08,1.02,1.06],[1.03,1.05,1],'flower-crown','#e6b652'],
];
const assets=[];
await fs.mkdir('assets/cardrpg2/models',{recursive:true});
for (const [index,[id,role,height,headScale,bodyScale,silhouette,color]] of cats.entries()) {
  const rig=createModel({...CAST.find(c=>c.role===role),name:id,targetHeight:height});
  rig.parts.head.scale.fromArray(headScale);rig.parts.body.scale.fromArray(bodyScale);
  rig.parts.earL.scale.set(1,.65+index*.055,1);rig.parts.earR.scale.set(1,1.15-index*.025,1);
  rig.parts.earL.rotation.z=-.05-index*.018;rig.parts.earR.rotation.z=.05+index*.012;
  rig.parts.tail.scale.set(.65+index*.06,.85+(index%4)*.1,1);
  if(index>2) for(const name of ['hat','shield','ladle','lantern','wand']) rig.parts[name]?.removeFromParent();
  const ornament=group(rig.parts.head,`${role}_identity`,[0,.25,-.05]);
  const outfit=group(rig.parts.body,`${role}_depthOutfit`);
  polygon(outfit,color,[[-.24,.2],[.24,.2],[.28,-.28],[0,-.4],[-.28,-.28]],.04,[0,0,.34],.018);
  if(id==='mochi') {torus(ornament,color,[.25,.08,0],.16,.035,[0,0,0]);star(outfit,'#fff6df',[0,0,.39],.09);}
  if(id==='soot') {rod(ornament,color,[.1,.25,0],[.45,.65,0],.025);star(ornament,'#f3d27e',[.48,.7,0],.12);}
  if(id==='clover') {for(const x of [-.35,.35])leaf(outfit,color,[x,.1,-.25],1.3,[0,0,x]);}
  if(id==='panko') {torus(ornament,color,[0,.08,0],.39,.12,[0,0,0],24,8,Math.PI*1.8);cylinder(outfit,'#f7d491',[0,-.05,.4],.2,.24,.12,10,[Math.PI/2,0,0]);}
  if(id==='mallow') {for(let i=0;i<5;i++)tube(ornament,color,[[0,.05,0],[Math.cos(i*1.25)*.4,.55,Math.sin(i*1.25)*.14],[0,.8,0]],.02,12,5);}
  if(id==='sorrel') {polygon(ornament,color,[[-.43,-.2],[0,.64],[.43,-.2]],.12,[0,.03,-.18],.06);ellipsoid(outfit,'#a6d7e1',[.42,-.12,.1],[.2,.28,.2]);}
  if(id==='biscuit') {cylinder(ornament,color,[0,.12,.06],.25,.25,.12,12);rod(outfit,'#a66e4f',[-.7,-.1,-.23],[.7,-.1,-.23],.12,14);}
  if(id==='inkcap') {ellipsoid(ornament,color,[0,.17,0],[.66,.22,.47]);for(const x of [-.3,0,.3])ellipsoid(ornament,'#e6ddcd',[x,.33,.14],[.075,.025,.065]);}
  if(id==='cinnamon') {for(const x of [-.38,.38])tube(outfit,color,[[x,.3,0],[x*1.7,0,.03],[x*1.65,-.4,.1]],.08);for(let i=0;i<3;i++)cylinder(outfit,'#8e5a43',[-.15+i*.15,0,.43],.04,.04,.3,8);}
  if(id==='brioche') {torus(ornament,'#e2bd65',[.04,.25,-.2],.45,.055,[0,0,0],30,6,Math.PI*1.45);cylinder(outfit,'#dfbd72',[0,.05,.46],.08,.19,.22,12);ellipsoid(outfit,'#ecdbb3',[0,-.11,.46],[.06,.06,.06]);}
  if(id==='velvet') {for(const side of [-1,1])polygon(outfit,color,[[0,0],[side*.76,.46],[side*.61,-.5]],.035,[0,.08,-.3],.03);torus(ornament,'#a7b3db',[0,.13,0],.29,.04,[Math.PI/2,0,0]);}
  if(id==='marigold') {for(let i=0;i<7;i++){const a=i*Math.PI*2/7;leaf(ornament,color,[Math.cos(a)*.26,.15,Math.sin(a)*.23],.85,[0,a,Math.PI/3]);}ellipsoid(ornament,'#8c7139',[0,.21,0],[.14,.1,.14]);}
  finish(ornament);finish(outfit);
  // Each cat has an individual motion rhythm and amplitude, retaining named sockets and clips.
  const clips=animate(rig);
  for(const clip of clips) {
    const tempo=.91+index*.019;
    for(const track of clip.tracks) {
      for(let i=0;i<track.times.length;i++)track.times[i]*=tempo;
      if(track.name.endsWith('.quaternion'))for(let i=0;i<track.values.length;i+=4){const q=new T.Quaternion(...track.values.slice(i,i+4));q.slerp(new T.Quaternion(),.015*index);q.toArray(track.values,i);}
    }
    clip.duration*=tempo;
  }
  rig.root.userData.depthIdentity={id,silhouette,headScale,bodyScale,color};
  const bytes=Buffer.from(await new GLTFExporter().parseAsync(rig.root,{binary:true,animations:clips,onlyVisible:false}));
  const path=`assets/cardrpg2/models/${id}.glb`;await fs.writeFile(path,bytes);
  assets.push({id,role,path,silhouette,headScale,bodyScale,height,color,clips:clips.map(c=>c.name),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
// All designed enemies have a stable identity. Four new silhouettes extend the existing household rigs.
const enemies=[['button-guard','guard'],['sock-skipper','flanker'],['spool-ram','charger'],['needle-moth','ranger'],['teacup-healer','healer'],['kettle-knight','elite'],['yarn-giant','yarn'],['binding-thread','thread'],['practice-cushion','dummy'],['pollen-scout','ranger'],['rain-spool','charger'],['crumb-sentinel','guard'],['pantry-crown','yarn']];
for(const [index,[id,role]] of enemies.entries()) {
  const rig=createModel({...CAST.find(c=>c.role===role),name:id});
  if(index>=9) {
    const part=group(rig.parts.head??rig.motion,`${role}_depthEnemy`);
    if(id==='pollen-scout')for(const side of [-1,1])leaf(part,'#d9c36e',[side*.5,.15,0],1.8,[0,0,side*.65]);
    if(id==='rain-spool'){rig.parts.body?.scale.set(1.25,1.1,1.1);for(let i=0;i<6;i++)rod(part,'#8db8cc',[0,.2,0],[Math.cos(i*Math.PI/3)*.65,.45,Math.sin(i*Math.PI/3)*.65],.025);}
    if(id==='crumb-sentinel'){rig.parts.body?.scale.set(.85,1.4,1);polygon(part,'#ddc499',[[-.4,0],[-.4,.3],[-.15,.15],[0,.45],[.15,.15],[.4,.3],[.4,0]],.18,[0,.2,0]);}
    if(id==='pantry-crown'){rig.root.scale.multiplyScalar(.92);for(let i=0;i<5;i++)cylinder(part,'#d6ad58',[(i-2)*.2,.35+Math.abs(i-2)*.06,0],.025,.1,.45,8);}
    finish(part);
  }
  const clips=animate(rig),bytes=Buffer.from(await new GLTFExporter().parseAsync(rig.root,{binary:true,animations:clips,onlyVisible:false}));
  const path=`assets/cardrpg2/models/${id}.glb`;await fs.writeFile(path,bytes);
  assets.push({id,role,path,clips:clips.map(c=>c.name),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const sources=['tools/cardrpg-depth/models.mjs','tools/art3d/cast.mjs','tools/art3d/geometry.mjs','tools/art3d/animation.mjs','tools/art3d/materials.mjs'];
await fs.mkdir('assets/provenance',{recursive:true});
await fs.writeFile('assets/provenance/cardrpg-depth-models.json',JSON.stringify({tool:'Three.js 0.180.0 GLTFExporter',command:'node tools/cardrpg-depth/models.mjs',author:'OpenAI Codex, single depth session',license:'CC0-1.0',externalReferences:[],sources:await Promise.all(sources.map(async path=>({path,sha256:createHash('sha256').update(await fs.readFile(path)).digest('hex')}))),assets},null,2));
console.log(JSON.stringify({models:assets.length,bytes:assets.reduce((n,a)=>n+a.bytes,0)}));
