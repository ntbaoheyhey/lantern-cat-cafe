/** Independent offline baseline/candidate geometry comparison; no application writes. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),req=createRequire(resolve(root,'apps/web/package.json')),label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve(root,'work/v5/CXI/render-review',label);assert(!existsSync(out));await mkdir(out,{recursive:true});
const path='apps/web/src/game/rig/drawing-layer.ts',refs={baseline:'v5-m1.13',candidate:'1157eaafb'},hash=b=>createHash('sha256').update(b).digest('hex'),pins={};
for(const [name,ref]of Object.entries(refs)){
 const source=execFileSync('git',['show',ref+':'+path],{cwd:root,encoding:'utf8'});pins[name]={ref,sha256:hash(source)};
 const mapped=source.replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${resolve(root,dirname(path),p)}'`);await writeFile(resolve(out,name+'.ts'),mapped);
}
const entry=resolve(out,'entry.ts');await writeFile(entry,"export {DrawingLayer as Baseline} from './baseline';\nexport {DrawingLayer as Candidate} from './candidate';\nexport * as T from 'three';\n");
const {build}=await import(req.resolve('vite'));
await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',resolve:{alias:{three:req.resolve('three').replace(/three\.cjs$/,'three.module.js')}},build:{emptyOutDir:false,outDir:out,minify:false,lib:{entry,formats:['es'],fileName:()=> 'bundle.mjs'}}});
const {Baseline,Candidate,T}=await import(pathToFileURL(resolve(out,'bundle.mjs')).href);
const files=execFileSync('rg',['--files','apps/web/public/units','-g','manifest.json'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(p=>p.includes('/poses/')).sort();
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),path,pins,toolSha256:hash(await readFile(import.meta.filename)),method:'Two pinned DrawingLayer implementations bundled with the same unchanged dependencies. Compare every Float32 position against original full sampling across all authored pose manifests, motion boundaries, both motion modes, two scales, reverse seeks, retaliation and recovery after invalid input. Offline component evidence, not native GPU/ordinary gameplay/FPS acceptance.',rows:[],complete:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await save();
try{
 for(const file of files){const source=await readFile(resolve(root,file)),manifest=JSON.parse(source),row={file,sha256:hash(source),unit:manifest.unit,comparisons:0,vertices:0,invalidRecoveries:0};
  for(const scale of [.7,1]){
   const textures=Object.fromEntries(Object.keys(manifest.poses).map(k=>[k,new T.Texture()])),set={manifest,textures},a=new Baseline(set,[17,23],scale),b=new Candidate(set,[17,23],scale);
   const compare=()=>{const x=a.geometry.attributes.position.array,y=b.geometry.attributes.position.array;assert.equal(x.length,y.length);assert(Buffer.from(x.buffer,x.byteOffset,x.byteLength).equals(Buffer.from(y.buffer,y.byteOffset,y.byteLength)),`${manifest.unit} geometry mismatch`);assert.equal(a.key,b.key);row.comparisons++;row.vertices+=x.length/3;};
   try{
    compare();for(const reduced of [false,true])for(const clip of ['idle','attack','ult','hurt','ko','victory'])for(const at of [2.2,1.19,1.1,.8,.56,.44,.439,.35,.33,.329,.27,.18,.09,0]){
     const args=[clip,at,reduced,clip==='ult'?.05:undefined,30+at,.7,.12];a.sample(...args);b.sample(...args);compare();
    }
    for(const args of [['idle',NaN,false],['attack',.2,false,undefined,Infinity],['ult',.5,false,undefined,32,NaN]]){
     let ae,be;try{a.sample(...args);}catch(e){ae=e.constructor.name;}try{b.sample(...args);}catch(e){be=e.constructor.name;}assert.equal(ae,be);
     a.sample('idle',.25,false,undefined,31);b.sample('idle',.25,false,undefined,31);compare();a.sample('attack',.4,true,undefined,32);b.sample('attack',.4,true,undefined,32);compare();row.invalidRecoveries++;
    }
   }finally{a.dispose();b.dispose();Object.values(textures).forEach(t=>t.dispose());}
  }
  report.rows.push(row);await save();console.log(JSON.stringify(row));
 }
 report.complete=true;report.totals={manifests:report.rows.length,comparisons:report.rows.reduce((s,r)=>s+r.comparisons,0),vertices:report.rows.reduce((s,r)=>s+r.vertices,0),invalidRecoveries:report.rows.reduce((s,r)=>s+r.invalidRecoveries,0)};
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{report.finishedUtc=new Date().toISOString();await save();console.log(JSON.stringify({out,complete:report.complete,totals:report.totals,failure:report.failure}));}
