/** Bounded current-build art evidence; native decoded frames, unchanged application. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl,waitForDecodedMediaFrame} from './media-production-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(process.env.CXV_MEDIA_CAT,'clover');
const buildPath=process.env.CXV_MEDIA_BUILD,build=JSON.parse(await readFile(buildPath));
const out=resolve(process.env.CXV_CAPTURE_OUT??'');assert(out.startsWith(resolve(root,'work/v5/CXV')+'/')&&!existsSync(out));
await mkdir(resolve(out,'frames'),{recursive:true});
const frameList=[0,75,150,225,...Array.from({length:61},(_,i)=>270+i)];
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,
 build:{path:buildPath,sha256:sha(await readFile(buildPath))},registryOverride:build.registryOverride,runtimePatchSha256:sha(''),runtimeSourceSubstitutions:[],
 harnessSha256:sha(await readFile(import.meta.filename)),fixtureSha256:runtimeEvidence().harnessSha256,
 preregistration:{frames:frameList,phaseOffsetFrames:.25,method:'Four quarter-cycle poses plus61 consecutive native decoded frames spanning9..11s;all original1280x720 captures. Tail/whole-body seam metrics and native-scale art crops prepared before any view. No original alpha ground truth or hidden-layer recovery claim.'},rows:[],captures:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);};
let browser;
try{
 stop();assert.equal(runtimeEvidence().indexSha256,build.indexSha256);assert.equal(sha(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),build.indexSha256);
 await save();browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'));
 await page.evaluate(()=>{const m=window.__depthReview;m.paused=true;m.plan=null;m.notify(false);});
 await page.locator('.b3-wave-intro').waitFor({state:'detached',timeout:10000});
 const phaseOffset=await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:30,paused:true,frame:null},0);return[...s.actors.values()].find(e=>e.asset==='clover').actor.designerMedia.media.state.desired;});
 report.phaseOffset=phaseOffset;report.introSettledUTC=new Date().toISOString();
 for(const frame of frameList){
  stop();const fixedTime=40+(frame+.25)/30-phaseOffset;
  await page.evaluate(fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true,frame:null,reducedMotion:false},0);},fixedTime);
  await waitForDecodedMediaFrame(page,{sourceFrame:frame%300,reduced:false});
  const row=await page.evaluate(({frame,fixedTime})=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true,frame:null,reducedMotion:false},0);
   const [id,e]=[...s.actors].find(([,e])=>e.asset==='clover'),a=e.actor,adapter=a.designerMedia,media=adapter.media,manifest=media.manifest;
   const foot=a.root.position.clone().set(0,0,0);a.root.localToWorld(foot);
   const quad=[[0,0],[manifest.width,0],[0,manifest.height],[manifest.width,manifest.height]].map(([x,y])=>{const p=adapter.point(x,y);return s.screen(a.root.localToWorld(a.root.position.clone().set(p.x,p.y,1)));});
   return{frame,sourceFrame:frame%300,utc:new Date().toISOString(),fixedTime,url:location.href,ready:s.ready,sceneError:m.sceneError,source:a.source,
    media:{...media.state},decoded:window.__cxvMediaAudit.decoded.at(-1),introCount:document.querySelectorAll('.b3-wave-intro').length,
    worldFoot:foot.toArray(),root:a.root.matrixWorld.toArray(),body:s.anchors.find(x=>x.id===id)?.body,host:s.renderer.domElement.getBoundingClientRect().toJSON(),quad,
    manifest:frame===0?manifest:undefined};
  },{frame,fixedTime});
  assert.equal(row.url,judgeUrl);assert(row.ready&&!row.sceneError&&row.source==='media'&&row.body?.height>0);assert.equal(row.introCount,0);
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.rows.push(row);
  const path=resolve(out,'frames',String(frame).padStart(3,'0')+'.png');await page.screenshot({path,scale:'css'});const bytes=await readFile(path);
  assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);report.captures.push({frame,path,sha256:sha(bytes),bytes:bytes.length,utc:new Date().toISOString()});
 }
 const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));report.maxFootDelta=Math.max(...report.rows.map(r=>delta(r.worldFoot,report.rows[0].worldFoot)));
 assert(report.maxFootDelta<1e-6);assert.equal(sha(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),build.indexSha256);
 report.loopFilm=resolve(out,'clover-native-loop-window-1280x720.mp4');execFileSync('ffmpeg',['-v','error','-framerate','30','-start_number','270','-i',resolve(out,'frames','%03d.png'),'-frames:v','60','-c:v','libx264','-crf','19','-pix_fmt','yuv420p',report.loopFilm]);
 report.loopFilmSha256=sha(await readFile(report.loopFilm));report.errors=errors;report.blockedRequests=blockedRequests;report.pass=true;
 report.limits='Deterministic phase capture,not realtime FPS. Original opaque MP4 cannot establish true alpha/halo recovery. Scene crop differences also contain antialiasing and background;source-only comparison remains separate.';
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,rows:report.rows.length,captures:report.captures.length,failure:report.failure}));}
