/** Public reset/callback/exception semantics before a runtime cache is considered. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {installSetupCacheOverride,hash} from './setup-vertex-cache-source.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-setup-cache-semantics-r1');
assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:hash(await readFile(new URL(import.meta.url))),prototypeSha256:hash(await readFile(new URL('./setup-vertex-cache-source.mjs',import.meta.url))),viewport:{width:1280,height:720},runs:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const mode of ['baseline','cached']){
  let override;const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false,setupPage:async p=>{await p.addInitScript(()=>{Math.random=()=>.5;});override=await installSetupCacheOverride(p,{mode});}});
  const result=await page.evaluate(async()=>{
   const s=window.__depthScene;cancelAnimationFrame(s.raf);const rows=[],cues=[],cache=[];
   const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
   const snap=d=>({key:d.key,clip:d.clip,seconds:d.seconds,reduced:d.reduced,mapKey:Object.entries(d.set.textures).find(([,t])=>t===d.material.map)?.[0],bounds:d.userData.opaquePixelBounds,vertices:Float32Array.from(d.geometry.attributes.position.array),feet:d.contactPoints(),face:d.faceCorners(),secondary:structuredClone(d.secondary),depth:structuredClone(d.faceDepth),blink:d.expression.blink.value.toArray()});
   const digest=async row=>{const v=row.vertices;delete row.vertices;row.vertexSha256=await hash(new Uint8Array(v.buffer,v.byteOffset,v.byteLength));return row;};
   for(const [id,e]of s.actors){
    const d=e.craftPose?.drawing,a=e.actor;if(!d)continue;
    for(const reset of ['setToSetupPose','clearTracks']){
     d.sample('ult',1.15,false,undefined,31.15,.7,.12);
     if(reset==='setToSetupPose')a.mesh.skeleton.setToSetupPose();else a.mesh.state.clearTracks();
     rows.push({id,operation:reset,...await digest(snap(d)),bones:a.mesh.bones.map(b=>[b.worldX,b.worldY,b.a,b.b,b.c,b.d])});
    }
    const clip=[...a.clips].find(([name,c])=>!['idle','idle-phase2','victory'].includes(name)&&c.cues.length);
    if(clip){
     const [name,c]=clip,at=Math.max(...c.cues.map(c=>c.time)),original=a.onCue;
     try{
      a.onCue=cue=>cues.push({id,operation:'callback',cue:structuredClone(cue),...snap(d)});
      d.sample('ult',1.1,false);a.sample(name,'cache-callback-'+id,at,0,s.camera,false);
      a.onCue=cue=>{cues.push({id,operation:'throwing-callback',cue:structuredClone(cue),...snap(d)});throw Error('intentional setup cache cue');};
      d.sample('attack',.3,false);let caught;
      try{a.sample(name,'cache-throw-'+id,at,0,s.camera,false);}catch(error){caught=error.message;}
      rows.push({id,operation:'exception-return',caught,...await digest(snap(d))});
     }finally{a.onCue=original;}
    }
    const inputs=[['positive-zero',0,false,undefined,0,0,-1],['negative-time',-0,false,undefined,0,0,-1],['negative-clock',0,false,undefined,-0,0,-1],['negative-target',0,false,undefined,0,-0,-1],['reduced',0,true,undefined,0,0,-1],['retaliation',0,false,0,0,0,-1],['nan',NaN,false,undefined,0,0,-1],['infinity',0,false,undefined,Infinity,0,-1],['recover',0,false,undefined,0,0,-1]];
    for(const [label,...args]of inputs){let caught;try{d.sample('idle',...args);}catch(error){caught=error.message;}rows.push({id,operation:label,caught,...await digest(snap(d))});}
    // A replacement attribute and a custom point function must use the live calculation.
    const originalPosition=d.geometry.attributes.position,replacement=originalPosition.clone();d.geometry.setAttribute('position',replacement);
    d.sample('ult',1.1,false);d.sample('idle',0,false);rows.push({id,operation:'replacement-attribute',...await digest(snap(d))});d.geometry.setAttribute('position',originalPosition);
    const point=d.point;d.point=function(...args){const p=point.apply(this,args);p.x+=.01;return p;};
    try{d.sample('idle',0,false);rows.push({id,operation:'custom-point',...await digest(snap(d))});}finally{d.point=point;}
    d.sample('idle',0,false);rows.push({id,operation:'restored-point',...await digest(snap(d))});
    cache.push({id,bytes:d.setupVertices?.data.byteLength??0,attributeMatches:!d.setupVertices||d.setupVertices.attribute===d.geometry.attributes.position});
   }
   for(const row of cues)await digest(row);
   return{rows,cues,cache};
  });
  report.runs.push({mode,url:page.url(),override,errors,blockedRequests,...result});await page.close();
 }
 const [a,b]=report.runs;report.rowsExact=JSON.stringify(a.rows)===JSON.stringify(b.rows);report.cuesExact=JSON.stringify(a.cues)===JSON.stringify(b.cues);
 report.pass=report.rowsExact&&report.cuesExact&&b.cache.every(r=>r.bytes===13068&&r.attributeMatches)&&b.cues.some(r=>r.operation==='throwing-callback')&&report.runs.every(r=>!r.errors.length&&r.override.modules.length>0);
 report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,rows:a.rows.length,cues:a.cues.length,rowsExact:report.rowsExact,cuesExact:report.cuesExact,cache:b.cache,errors:report.runs.flatMap(r=>r.errors)}));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
