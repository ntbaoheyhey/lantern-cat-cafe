/** Own 30Hz/1x commissioned media comparison capture from the production scene. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl,waitForDecodedMediaFrame} from './media-production-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),hash=x=>createHash('sha256').update(x).digest('hex');
const cat=process.env.CXV_MEDIA_CAT??'mochi';assert(['mochi','clover'].includes(cat));
const buildPath=process.env.CXV_MEDIA_BUILD;assert(buildPath);const build=JSON.parse(await readFile(buildPath));
const out=resolve(process.env.CXV_CAPTURE_OUT??'');assert(out.startsWith(resolve(root,'work/v5/CXV')+'/')&&!existsSync(out));await mkdir(out,{recursive:true});
const frames=resolve(out,'frames');await mkdir(frames);
const report={utc:new Date().toISOString(),cat,url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,registryOverride:build.registryOverride,buildPath,buildSha256:hash(await readFile(buildPath)),harnessSha256:hash(await readFile(import.meta.filename)),runtimeSourceSubstitutions:[],rows:[],captures:[],pass:false,method:'Own current production scene. Exact native-callback frame0..299 captured at30Hz, requests at(frame+.25)/30 to avoid timestamp-boundary ambiguity, encoded at30fps/1x. Extra frame300 checks wrap; reduced samples0/150/300. Deterministic diagnostic, not realtime FPS evidence.'};
report.fixtureSha256=runtimeEvidence().harnessSha256;
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);};
let browser;
try{
 stop();assert.equal(runtimeEvidence().indexSha256,build.indexSha256);assert.equal(hash(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),build.indexSha256);
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'));
 await page.waitForFunction(cat=>[...window.__depthScene.actors.values()].find(e=>e.asset===cat)?.actor.designerMedia?.media.state.ready,cat,{timeout:90000});
 await page.evaluate(()=>{const m=window.__depthReview;m.paused=true;m.plan=null;m.notify(false);});
 const phaseOffset=await page.evaluate(cat=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:30,paused:true,frame:null},0);return[...s.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media.state.desired;},cat);report.phaseOffset=phaseOffset;
 for(const reduced of [false,true])for(const frame of reduced?[0,150,300]:Array.from({length:301},(_,i)=>i)){
  stop();const fixedTime=40+(frame+.25)/30-phaseOffset;
  await page.evaluate(({fixedTime,reduced})=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true,frame:null,reducedMotion:reduced},0);},{fixedTime,reduced});
  await page.waitForFunction(cat=>{const media=[...window.__depthScene.actors.values()].find(e=>e.asset===cat).actor.designerMedia.media.state;return media.ready&&!media.seeking&&Math.abs(((media.currentTime-media.desired+15)%10)-5)<=1/60;},cat,{timeout:10000});
  await waitForDecodedMediaFrame(page,{sourceFrame:frame%300,reduced});
  const row=await page.evaluate(({cat,reduced,frame,fixedTime})=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true,frame:null,reducedMotion:reduced},0);
   const[id,e]=[...s.actors].find(([,e])=>e.asset===cat),a=e.actor,media=a.designerMedia.media,foot=a.root.position.clone().set(0,0,0);a.root.localToWorld(foot);
   return{frame,reduced,fixedTime,ready:s.ready,sceneError:m.sceneError,source:a.source,media:{...media.state},decoded:window.__cxvMediaAudit.decoded.at(-1),worldFoot:foot.toArray(),root:a.root.matrixWorld.toArray(),opaqueWorld:a.opaqueWorld,body:s.anchors.find(x=>x.id===id)?.body,unit:s.sizeAudit().units.find(x=>x.id===id),manifest:!reduced&&frame===0?media.manifest:undefined,url:location.href};
  },{cat,reduced,frame,fixedTime});
  report.rows.push(row);assert.equal(row.url,judgeUrl);assert(row.ready&&!row.sceneError&&row.source==='media');assert(row.opaqueWorld?.height>0&&row.body?.height>0);assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);
  if(!reduced&&frame<300){const path=resolve(frames,String(frame).padStart(3,'0')+'.png');await page.screenshot({path});report.captures.push({frame,path,sha256:hash(await readFile(path))});}
  if(frame%30===0)await save();
 }
 const first=report.rows[0],end=report.rows.find(r=>!r.reduced&&r.frame===300),delta=(a,b)=>Math.max(...a.map((x,i)=>Math.abs(x-b[i])));
 report.maxIdleFootDelta=Math.max(...report.rows.filter(r=>!r.reduced).map(r=>delta(first.worldFoot,r.worldFoot)));report.loopRootDelta=delta(first.root,end.root);
 assert(report.maxIdleFootDelta<1e-6&&report.loopRootDelta<1e-6);assert.equal(runtimeEvidence().indexSha256,build.indexSha256);assert.equal(hash(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),build.indexSha256);
 report.video=resolve(out,cat+'-idle-production-1280x720.mp4');execFileSync('ffmpeg',['-v','error','-framerate','30','-i',resolve(frames,'%03d.png'),'-c:v','libx264','-crf','19','-pix_fmt','yuv420p',report.video]);report.videoSha256=hash(await readFile(report.video));
 report.errors=errors;report.blockedRequests=blockedRequests;report.pass=true;report.limits='Own deterministic production candidate film. Full art/seam review, independent sockets, cast and byte gates remain separate; no general FPS claim.';
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,rows:report.rows.length,captures:report.captures.length,failure:report.failure}));}
