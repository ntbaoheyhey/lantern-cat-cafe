/** Original-mesh motion fingerprint across key boundaries and reduced motion. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-motion-probe');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Frozen real loaded drawings: vertex buffer SHA256, sockets and face corners across pose/contact/recovery boundaries and reduced motion. Diagnostic mathematical equivalence, not gameplay FPS.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===id),{fixedClock:false});report.url=page.url();
  report.rows.push(...await page.evaluate(async id=>{
   const s=window.__depthScene,rows=[],cases={idle:[0,.3,.6,1.003106305,2.4,8.2],attack:[0,.05,.27,.3,.329,.33,.35,.439,.44,.56,.799],ult:[.29,.3,.6,1.1,1.189,1.19,1.759,1.76,1.8,2.199],hurt:[0,.089,.09,.179,.18,.399],ko:[.3],victory:[1]};
   for(const [actorId,e]of s.actors){
    const d=e.craftPose?.drawing;if(!d)continue;
    for(const reduced of [false,true])for(const [clip,times]of Object.entries(cases))for(const at of times){
     d.sample(clip,at,reduced,undefined,30+at,.7);
     const array=d.geometry.attributes.position.array,vertexSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(array.buffer,array.byteOffset,array.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
     rows.push({fixture:id,actorId,asset:e.asset,clip,at,reduced,key:d.key,vertexSha256,sockets:Object.fromEntries(Object.entries(d.frame.sockets).map(([name,p])=>[name,d.point(p)])),face:d.faceCorners(),feet:d.contactPoints()});
    }
   }
   return rows;
  },id));
  report.errors.push(...errors);await page.close();
 }
 const sort=rows=>rows.sort((a,b)=>JSON.stringify([a.fixture,a.actorId,a.clip,a.at,a.reduced]).localeCompare(JSON.stringify([b.fixture,b.actorId,b.clip,b.at,b.reduced])));sort(report.rows);
 if(process.env.CXV_COMPARE){
  const baseline=JSON.parse(await readFile(resolve(process.env.CXV_COMPARE),'utf8'));sort(baseline.rows);
  report.differences=report.rows.flatMap((row,i)=>JSON.stringify(row)===JSON.stringify(baseline.rows[i])?[]:[{index:i,actual:row,expected:baseline.rows[i]}]);
  if(report.differences.length)report.errors.push(`${report.differences.length} motion differences`);else report.exactMatchTo=resolve(process.env.CXV_COMPARE);
 }
 report.ended=new Date().toISOString();report.pass=report.rows.length>=500&&!report.errors.length;
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,rows:report.rows.length,exactMatchTo:report.exactMatchTo,errors:report.errors}));assert(report.pass);
}finally{await browser.close();}
