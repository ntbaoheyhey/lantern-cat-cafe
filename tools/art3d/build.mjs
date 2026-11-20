import {installTextureExport,BAKE_PARAMETERS} from './materials.mjs';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { CAST, createModel } from './cast.mjs';
import {skillAnimations} from './skill-animation.mjs';
import { animate, CLIPS } from './animation.mjs';
import { GLTFExporter } from '../../apps/web/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
class Reader { readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});} readAsDataURL(blob){blob.arrayBuffer().then(x=>{this.result=`data:${blob.type};base64,${Buffer.from(x).toString('base64')}`;this.onloadend?.();});} }
globalThis.FileReader=Reader;
await fs.mkdir('apps/web/public/art/turn3d',{recursive:true});await fs.mkdir('docs/turn3d',{recursive:true});await fs.mkdir('assets/provenance',{recursive:true});
const assets=[];
installTextureExport();
for(const spec of CAST){
  const r=createModel(spec), clips=[...animate(r),...skillAnimations(r)];let triangles=0,drawCalls=0;
  r.root.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;drawCalls++;}});
  if(triangles>spec.triangleBudget)throw Error(`${spec.role}: triangle budget exceeded`);
  const data=Buffer.from(await new GLTFExporter().parseAsync(r.root,{binary:true,animations:clips,onlyVisible:false}));
  const output=`apps/web/public/art/turn3d/${spec.role}.glb`;await fs.writeFile(output,data);
  assets.push({id:spec.role,name:spec.name,output,source:['tools/art3d/cast.mjs','tools/art3d/geometry.mjs','tools/art3d/animation.mjs','tools/art3d/build.mjs','tools/art3d/materials.mjs','tools/art3d/skill-animation.mjs'],author:'OpenAI Codex primary polish session; original earlier definitions extended with smooth lofts, expressions, sockets and baked surfaces',date:'2026-11-05',tool:'three.js 0.180.0 GLTFExporter',command:'pnpm art:turn3d',license:'CC0-1.0',externalReferences:[],parameters:{...r.sourceParameters,bake:BAKE_PARAMETERS},clips:clips.map(c=>c.name),triangles,triangleBudget:spec.triangleBudget,drawCalls,bytes:data.length,gzipBytes:gzipSync(data).length,sha256:createHash('sha256').update(data).digest('hex')});
}
const manifest={version:2,date:'2026-11-05',originalOnly:true,assets,proceduralAssets:[{id:'cafe-stage-and-vfx',source:'apps/web/src/game/squad/turn3d/scene.ts',author:'OpenAI Codex primary session',date:'2026-11-05',tool:'three.js 0.180.0',recipe:'makeStage, makeGlow and signatureGeometry: original primitive diorama; 64px radial canvas gradient; hand-authored shield, flame, flask, droplet and petal paths; rings, curved lines and bounded instanced sprites',license:'CC0-1.0',externalReferences:[]}],libraries:[{name:'three',version:'0.180.0',license:'MIT'},{name:'@types/three',version:'0.180.0',license:'MIT',buildOnly:true},{name:'React',version:'19.3.1',license:'MIT'},{name:'React DOM',version:'19.3.1',license:'MIT'},{name:'TypeScript',version:'5.9.3',license:'Apache-2.0',buildOnly:true},{name:'Vite',version:'8.3.5',license:'MIT',buildOnly:true}]};
await fs.writeFile('docs/turn3d/ASSET-MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('assets/provenance/turn3d.md','# Original turn-based miniatures · 2026-11-05\n\nNo imported models, textures or reference-game inputs. CC0 original assets; runtime libraries are MIT. Build-only TypeScript is Apache-2.0. Source and animation are reproducible with `pnpm art:turn3d`. Exact authorship and parameters: `docs/turn3d/ASSET-MANIFEST.json`.\n\n| Model | Triangles / budget | GLB bytes | Gzip bytes | Draw calls |\n|---|---:|---:|---:|---:|\n'+assets.map(a=>`| ${a.name} | ${a.triangles} / ${a.triangleBudget} | ${a.bytes} | ${a.gzipBytes} | ${a.drawCalls} |`).join('\n')+'\n\nEvery GLB has authored named clips: '+CLIPS.join(', ')+'. Facial blink, brow angle and mouth poses distinguish calm, happy, hurt, determined, casting and KO. Textures are embedded 128px albedo/normal PNGs, generated from integer noise and woven/knitted equations. Approximate analytic vertex AO is baked from neighboring geometry bounds; this is not raytraced AO. Stage and VFX are procedural originals in scene.ts. Existing pixel assets are comparison-only and retain their original provenance in assets/provenance/squad.md.\n');
console.log(JSON.stringify({models:assets.length,bytes:assets.reduce((s,a)=>s+a.bytes,0),gzipBytes:assets.reduce((s,a)=>s+a.gzipBytes,0),clips:CLIPS.length,allTriangleBudgetsPass:true}));
