/** Current candidate scene gate. Fixed-frame diagnostics; not an FPS or release claim. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';

const label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const base=resolve('work/v5/CXI/batch-m',label),build=JSON.parse(await readFile(resolve(base,'build.json')));
const out=resolve(base,'scene-probe');assert(!existsSync(out));await mkdir(out);
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(runtimeEvidence().indexSha256,build.indexSha256);
const report={utc:new Date().toISOString(),url:judgeUrl,sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,registryOverride:build.registryOverride,viewport:[1280,720],toolSha256:hash(await readFile(import.meta.filename)),method:'Own production candidate at exact judge URL. Fixed-time native media seeks through all300 idle frames, normal/reduced scene placement. No response substitutions. Full-motion, cast, anatomy, cold bytes and frame-time acceptance remain separate.',rows:[],captures:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{setupPage:p=>p.addInitScript(()=>{
  window.__zeroReadbacks=[];const read=CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData=function(...args){if(args[2]<=0||args[3]<=0)window.__zeroReadbacks.push(args.slice(0,4));return read.apply(this,args);};
 })});
 await page.waitForFunction(()=>window.__depthScene.actors.get('mochi')?.actor.designerMedia?.media.state.ready);
 const phaseOffset=await page.evaluate(()=>{
  const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.paused=true;m.plan=null;
  s.render({...s.view(),fixedTime:30,paused:true,frame:null},0);
  return s.actors.get('mochi').actor.designerMedia.media.state.desired;
 });
 for(const reduced of [false,true]){
  for(const frame of reduced?[0,150,299]:Array.from({length:300},(_,i)=>i)){
   for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);
   const fixedTime=40+frame/30-phaseOffset;
   await page.evaluate(({fixedTime,reduced})=>{
    const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true,frame:null,reducedMotion:reduced},0);
   },{fixedTime,reduced});
   await page.waitForFunction(()=>{const v=window.__depthScene.actors.get('mochi').actor.designerMedia.media.state;return v.ready&&!v.seeking&&Math.abs(((v.currentTime-v.desired+15)%10)-5)<=1/60;},null,{timeout:10000});
   const row=await page.evaluate(({fixedTime,reduced,frame})=>{
    const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true,frame:null,reducedMotion:reduced},0);
    const a=s.actors.get('mochi').actor,media=a.designerMedia.media,p=media.plane.geometry.attributes.position,idx=media.plane.geometry.index,base=media.basePositions;
    let minTriangleRatio=Infinity;
    for(let i=0;i<idx.count;i+=3){const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)],area=get=>{const[x,y,z]=ids.map(get);return(y[0]-x[0])*(z[1]-x[1])-(y[1]-x[1])*(z[0]-x[0]);};const before=area(j=>[base[j*3],base[j*3+1]]),after=area(j=>[p.getX(j),p.getY(j)]);if(before)minTriangleRatio=Math.min(minTriangleRatio,after/before);}
    const foot=a.root.position.clone();a.root.localToWorld(foot.set(0,0,0));foot.project(s.camera);
    return{frame,reduced,fixedTime,url:location.href,ready:s.ready,sceneReady:m.sceneReady,sceneError:m.sceneError,source:a.source,media:{...media.state},videoDimensions:[media.video.width,media.video.height,media.video.videoWidth,media.video.videoHeight],opaqueWorld:a.opaqueWorld,units:s.sizeAudit().units,foot:[(foot.x+1)*s.width/2,(1-foot.y)*s.height/2],minTriangleRatio,zeroReadbacks:window.__zeroReadbacks};
   },{fixedTime,reduced,frame});
   assert.equal(row.url,judgeUrl);assert(row.ready&&row.sceneReady&&!row.sceneError);assert.equal(row.source,'media');assert(row.media.ready&&!row.media.failure);assert(row.opaqueWorld?.height>0);assert(Object.values(row.opaqueWorld).every(Number.isFinite));assert(row.minTriangleRatio>0);assert.deepEqual(row.zeroReadbacks,[]);assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);
   report.rows.push(row);
   if((!reduced&&[0,99,299].includes(frame))||(reduced&&frame===0)){
    const name=`idle-${reduced?'reduced':'normal'}-${frame}`,path=resolve(out,name+'.png'),preview=resolve(out,name+'-1024.jpg');
    await page.screenshot({path});execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-q:v','2',preview]);
    report.captures.push({frame,reduced,path,sha256:hash(await readFile(path)),preview,previewSha256:hash(await readFile(preview)),utc:new Date().toISOString(),viewed:false});
   }
   if(frame%30===0)await save();
  }
 }
 report.errors=errors;report.blockedRequests=blockedRequests;assert.equal(runtimeEvidence().indexSha256,build.indexSha256);report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await browser.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,rows:report.rows.length,captures:report.captures.length,failure:report.failure}));}
