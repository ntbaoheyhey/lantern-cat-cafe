/** Isolated pinned-source attribution on actual production actor roots. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const ts=require('typescript'),label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve(root,'work/v5/CXI/performance',label);
try{await access(out);throw Error('Fresh label required');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});
const path='apps/web/src/game/cardrpg/stage/opaque-pose-bounds.ts';
const refs={baseline:'v5-m1.10',candidate:'7ed0ce4f06d93251a4f44a7bd2a9884e8b4df37e'},sources={},sourceHashes={};
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const [name,ref]of Object.entries(refs)){
 const source=execFileSync('git',['show',`${ref}:${path}`],{cwd:root,encoding:'utf8'});
 sourceHashes[name]=hash(source);
 sources[name]=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
}
assert.equal(hash(await readFile(resolve(root,path))),sourceHashes.candidate,'Current candidate source changed');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),refs,sourceHashes,...runtimeEvidence(),toolSha256:hash(await readFile(import.meta.filename)),viewport:{width:1280,height:720},method:'Pinned m1.10 and packed source functions, independently transpiled without code substitutions, evaluated on actual production roots at five authored poses. Alternating warmed blocks at4xCPU; exact outputs compared first. This isolates bounds evaluation, excludes construction/GPU/frame scheduling, and is not an FPS claim.',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3','boss']){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id===id));report.url=page.url();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const result=await page.evaluate(async({sources,id})=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.plan=null;m.paused=true;
   const modules={};for(const [name,source]of Object.entries(sources)){
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));try{modules[name]=await import(url);}finally{URL.revokeObjectURL(url);}
   }
   const rows=[],blocks=[];let checksum=0;
   const entries=[...s.actors.entries()].filter(([,e])=>e.craftPose?.drawing);
   for(const [key,clip,at]of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]]){
    const restore=[];
    for(const [,e]of entries){const d=e.craftPose.drawing,original=d.sample;restore.push(()=>d.sample=original);d.sample=function(){return original.call(this,clip,at,false,undefined,30);};}
    try{s.render({...s.view(),frame:null,fixedTime:30,paused:true,galleryPreview:true},0);}finally{restore.forEach(f=>f());}
    for(const [actorId,e]of entries){
     const a=modules.baseline.opaqueWorldBounds(e.actor.root),b=modules.candidate.opaqueWorldBounds(e.actor.root);
     if(JSON.stringify(a)!==JSON.stringify(b))throw Error(`Bounds mismatch ${id}/${actorId}/${key}`);
     rows.push({actorId,key,bounds:a});
    }
    for(let warm=0;warm<12;warm++)for(const name of ['baseline','candidate'])for(const [,e]of entries)modules[name].opaqueWorldBounds(e.actor.root);
    for(let block=0;block<9;block++){
     const times={};for(const name of block%2?['candidate','baseline']:['baseline','candidate']){
      const start=performance.now();let sum=0;
      for(let cycle=0;cycle<30;cycle++)for(const [,e]of entries){const b=modules[name].opaqueWorldBounds(e.actor.root);sum+=b.x+b.y+b.width+b.height;}
      times[name]=performance.now()-start;checksum+=sum;
     }
     blocks.push({key,block,callsPerVariant:entries.length*30,...times});
    }
   }
   return{id,actors:entries.length,exactRows:rows,blocks,checksum};
  },{sources,id});
  assert.equal(blockedRequests.length,0);report.fixtures.push(result);report.errors.push(...errors);await page.context().close();
 }
 assert.equal(report.errors.length,0);report.pass=true;report.ended=new Date().toISOString();
}finally{await browser.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));}
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
for(const f of report.fixtures)console.log(JSON.stringify({fixture:f.id,exactBounds:f.exactRows.length,baselineBlockMs:median(f.blocks.map(b=>b.baseline)),candidateBlockMs:median(f.blocks.map(b=>b.candidate)),medianPairedRatio:median(f.blocks.map(b=>b.candidate/b.baseline))}));
