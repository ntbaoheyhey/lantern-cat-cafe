// Local rigid-module rig for a textured source. No image/model requests.
// A manifest config sets measured proportions; all outputs need battle review.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
const require = createRequire('/Users/bao/tools/cardrpg-look/npm/package.json');
const { NodeIO, VertexLayout } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { prune } = require('@gltf-transform/functions');
const [source, output, configPath] = process.argv.slice(2);
if (!configPath) throw Error('Usage: rig-unit.mjs SOURCE NEW_OUTPUT CONFIG.json');
if (await access(output).then(()=>true,()=>false)) throw Error('Preserve earlier output');
const cfg = JSON.parse(await readFile(configPath));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE);
const doc = await io.read(source), root = doc.getRoot();
if (cfg.palette) {
  const sharp = require('sharp');
  const textures = new Set(root.listMaterials().map(m=>m.getBaseColorTexture()).filter(Boolean));
  for (const texture of textures) {
    const {data,info}=await sharp(texture.getImage()).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    for(let i=0;i<data.length;i+=4){
      const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
      if(delta<.001||max<.08)continue;
      let hue=(max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4)/6;
      hue=(hue+1)%1;const saturation=delta/max;
      // Selected burgundy cloth only; preserve gold eyes, brass, teal and fur.
      if(!(hue>.93||hue<.015)||saturation<.28||max>.76)continue;
      hue=(hue+cfg.palette.redHueShift/360+1)%1;
      const c=max*saturation*cfg.palette.redSaturation,x=c*(1-Math.abs((hue*6)%2-1)),m=max-c;
      const rgb=hue<1/6?[c,x,0]:hue<2/6?[x,c,0]:hue<3/6?[0,c,x]:hue<4/6?[0,x,c]:hue<5/6?[x,0,c]:[c,0,x];
      for(let k=0;k<3;k++)data[i+k]=Math.round((rgb[k]+m)*255);
    }
    texture.setImage(await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer()).setMimeType('image/png');
  }
}
const sourceNodes = root.listNodes(), sourceMeshes = root.listMeshes(), scenes = root.listScenes();
for (const node of sourceNodes) {
  if (node.getTranslation().some(v=>Math.abs(v)>1e-6) || node.getScale().some(v=>Math.abs(v-1)>1e-6)
      || node.getRotation().some((v,i)=>Math.abs(v-(i===3?1:0))>1e-6)) throw Error('Bake source transforms before rigging');
}
const primitives = sourceMeshes.flatMap(m=>m.listPrimitives());
// Reconstruction PBR maps can misclassify dark fur as polished metal. A
// reviewed per-unit material treatment keeps the original colour/UV texture.
if (cfg.material) for (const material of root.listMaterials()) {
  material.setName(cfg.material.toon ? 'atelier-baked' : cfg.id+'-painted-surface');
  material.setMetallicFactor(cfg.material.metallic ?? 0);
  material.setRoughnessFactor(cfg.material.roughness ?? .9);
  if (cfg.material.discardGeneratedPBR) material.setMetallicRoughnessTexture(null);
}
const low=[Infinity,Infinity,Infinity], high=[-Infinity,-Infinity,-Infinity];
for (const pr of primitives) {
  const pos=pr.getAttribute('POSITION').getArray();
  for(let i=0;i<pos.length;i++) { low[i%3]=Math.min(low[i%3],pos[i]);high[i%3]=Math.max(high[i%3],pos[i]); }
}
const height=cfg.height, factor=height/(high[1]-low[1]);
const center=[(low[0]+high[0])/2,low[1],(low[2]+high[2])/2];
const role=cfg.role;
const spec=[['motion',null,[0,0,0]],['body','motion',[0,.36,0]],['head','body',[0,cfg.neck??.57,0]],
  ['armL','body',[.18,.51,0]],['armR','body',[-.18,.51,0]],
  ['earL','head',[.16,.87,0]],['earR','head',[-.16,.87,0]],
  ['footL','motion',[.13,.10,0]],['footR','motion',[-.13,.10,0]],
  ['tail','body',[-.21,.22,-.14]],['tailMid','tail',[-.31,.30,-.17]],['tailTip','tailMid',[-.33,.48,-.14]]];
const world=Object.fromEntries(spec.map(([name,,point])=>[name,point.map(v=>v*height)]));
const nodes=Object.fromEntries(spec.map(([name])=>[name,doc.createNode(role+'_'+name)]));
const rig=doc.createNode(cfg.id).setExtras({lookV2:true,lookGenerated:true,lookProps:true,
  lookRigid:true,rigVersion:cfg.id+'-image3d-modules1',rigLimits:cfg.rigLimits??{head:.16,tail:.20,ear:.09,arm:.12,foot:.045}});
for(const [name,parent] of spec){
  nodes[name].setTranslation(world[name].map((v,i)=>v-(parent?world[parent][i]:0)));
  (parent?nodes[parent]:rig).addChild(nodes[name]);
}
for(const [name,parent,point] of [['socket_weapon','armR',[-.23,.42,.12]],['socket_body','body',[0,.40,.14]],
  ['socket_neck','head',[0,.57,.12]],['socket_back','body',[0,.42,-.14]],['socket_tail','tail',[-.22,.23,-.15]]]){
  nodes[parent].addChild(doc.createNode(name).setTranslation(point.map((v,i)=>v*height-world[parent][i])));
}
function classify(x,y,z){
  // Authored vertical and side partitions. Thin contact seams use restrained
  // rotations, and all face triangles belong rigidly to one module.
  if(cfg.tail && x<cfg.tail.x && y<cfg.tail.top && z<cfg.tail.front) return 'tail';
  if(cfg.arms && y>cfg.arms.bottom && y<cfg.arms.top && Math.abs(x)>cfg.arms.x) return x>0?'armL':'armR';
  if(y>(cfg.neck??.57)){
    if(cfg.ears && y>cfg.ears.y && Math.abs(x)>cfg.ears.x) return x>0?'earL':'earR';
    return 'head';
  }
  if(cfg.feet && y<cfg.feet) return x>0?'footL':'footR';
  return 'body';
}
const rows=[];
for(const [pi,pr] of primitives.entries()){
  const pos=pr.getAttribute('POSITION').getArray(), sourceIndices=pr.getIndices()?.getArray()??Uint32Array.from({length:pos.length/3},(_,i)=>i);
  const normalized=Float32Array.from(pos,(v,i)=>(v-center[i%3])*factor);
  const partitions=new Map();
  for(let i=0;i<sourceIndices.length;i+=3){
    const face=sourceIndices.slice(i,i+3), centroid=[0,0,0];
    for(const vi of face)for(let axis=0;axis<3;axis++)centroid[axis]+=normalized[vi*3+axis]/3/height;
    const part=classify(...centroid);if(!partitions.has(part))partitions.set(part,[]);partitions.get(part).push(...face);
  }
  for(const [part,faces] of partitions){
    const used=[...new Set(faces)], remap=new Map(used.map((index,i)=>[index,i]));
    const primitive=doc.createPrimitive().setMaterial(pr.getMaterial());
    const buffer=root.listBuffers()[0];
    primitive.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(faces,v=>remap.get(v))).setBuffer(buffer));
    for(const key of pr.listSemantics()){
      if(key.startsWith('JOINTS')||key.startsWith('WEIGHTS'))continue;
      const sourceAccessor=pr.getAttribute(key), size=sourceAccessor.getElementSize(), values=sourceAccessor.getArray();
      const array=new values.constructor(used.length*size);
      for(let i=0;i<used.length;i++)for(let axis=0;axis<size;axis++) array[i*size+axis]=key==='POSITION'
        ?normalized[used[i]*size+axis]-world[part][axis]:values[used[i]*size+axis];
      primitive.setAttribute(key,doc.createAccessor().setType(sourceAccessor.getType()).setArray(array).setBuffer(buffer));
    }
    nodes[part].addChild(doc.createNode(cfg.id+'_'+part+'_surface'+pi).setMesh(doc.createMesh().addPrimitive(primitive)));
    rows.push({part,triangles:faces.length/3,vertices:used.length});
  }
}
for(const scene of scenes)scene.dispose();
for(const node of sourceNodes)node.dispose();
for(const mesh of sourceMeshes)mesh.dispose();
doc.createScene(cfg.id).addChild(rig);root.setDefaultScene(root.listScenes()[0]);
await doc.transform(prune({keepAttributes:true,keepLeaves:true}));
await mkdir(dirname(output),{recursive:true});await io.write(output,doc);
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
await writeFile(output.replace(/\.glb$/,'.json'),JSON.stringify({id:cfg.id,source,sourceSha256:await hash(source),
  output,sha256:await hash(output),config:cfg,sourceBounds:[low,high],parts:rows,skins:0,
  acceptance:'REVIEW_REQUIRED: rigid seams/expressions/anchors must be viewed in real battle'},null,2)+'\n');
console.log(JSON.stringify({id:cfg.id,parts:rows,skins:0}));
