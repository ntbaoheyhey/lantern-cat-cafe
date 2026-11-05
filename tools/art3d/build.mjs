import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { CAST, createModel } from './cast.mjs';
import { animate, CLIPS } from './animation.mjs';
import { GLTFExporter } from '../../apps/web/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
class Reader { readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});} readAsDataURL(blob){blob.arrayBuffer().then(x=>{this.result=`data:${blob.type};base64,${Buffer.from(x).toString('base64')}`;this.onloadend?.();});} }
globalThis.FileReader=Reader;
await fs.mkdir('apps/web/public/art/turn3d',{recursive:true});await fs.mkdir('docs/turn3d',{recursive:true});await fs.mkdir('assets/provenance',{recursive:true});
const assets=[];
for(const spec of CAST){
  const r=createModel(spec), clips=animate(r);let triangles=0,drawCalls=0;
  r.root.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;drawCalls++;}});
  if(triangles>spec.triangleBudget)throw Error(`${spec.role}: triangle budget exceeded`);
  const data=Buffer.from(await new GLTFExporter().parseAsync(r.root,{binary:true,animations:clips,onlyVisible:false}));
  const output=`apps/web/public/art/turn3d/${spec.role}.glb`;await fs.writeFile(output,data);
  assets.push({id:spec.role,name:spec.name,output,source:['tools/art3d/cast.mjs','tools/art3d/geometry.mjs','tools/art3d/animation.mjs','tools/art3d/build.mjs'],author:'OpenAI Codex (procedural definitions preserved from stopped model helper; animation/export/validation completed by primary session)',date:'2026-11-05',tool:'three.js 0.180.0 GLTFExporter',command:'pnpm art:turn3d',license:'CC0-1.0',externalReferences:[],parameters:r.sourceParameters,clips:CLIPS,triangles,triangleBudget:spec.triangleBudget,drawCalls,bytes:data.length,gzipBytes:gzipSync(data).length,sha256:createHash('sha256').update(data).digest('hex')});
}
const manifest={version:1,date:'2026-11-05',originalOnly:true,assets,proceduralAssets:[{id:'cafe-stage-and-vfx',source:'apps/web/src/game/squad/turn3d/scene.ts',author:'OpenAI Codex primary session',date:'2026-11-05',tool:'three.js 0.180.0',recipe:'makeStage and makeGlow: original primitive diorama, 64px radial canvas gradient, rings, curved lines and bounded sprites',license:'CC0-1.0',externalReferences:[]}],libraries:[{name:'three',version:'0.180.0',license:'MIT'},{name:'@types/three',version:'0.180.0',license:'MIT',buildOnly:true},{name:'React',version:'19.3.1',license:'MIT'},{name:'Vite',version:'8.3.5',license:'MIT',buildOnly:true}]};
await fs.writeFile('docs/turn3d/ASSET-MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('assets/provenance/turn3d.md','# Original turn-based miniatures · 2026-11-05\n\nNo imported models, textures or reference-game inputs. CC0 original assets; MIT libraries. Source and animation are reproducible with `pnpm art:turn3d`. Exact authorship and parameters: `docs/turn3d/ASSET-MANIFEST.json`.\n\n| Model | Triangles / budget | GLB bytes | Gzip bytes | Draw calls |\n|---|---:|---:|---:|---:|\n'+assets.map(a=>`| ${a.name} | ${a.triangles} / ${a.triangleBudget} | ${a.bytes} | ${a.gzipBytes} | ${a.drawCalls} |`).join('\n')+'\n\nEvery GLB has ten named clips: '+CLIPS.join(', ')+'. Facial blink/hurt/determined expression uses eye geometry scale. Stage and VFX are procedural originals in scene.ts. Existing pixel assets are comparison-only and retain their original provenance in assets/provenance/squad.md.\n');
console.log(JSON.stringify({models:assets.length,bytes:assets.reduce((s,a)=>s+a.bytes,0),gzipBytes:assets.reduce((s,a)=>s+a.gzipBytes,0),clips:CLIPS.length,allTriangleBudgetsPass:true}));
