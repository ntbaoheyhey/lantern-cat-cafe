import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {installPankoExperiment} from './panko-living-experiment.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const native=process.env.CXV_M_NATIVE==='1';
const out=resolve(process.env.CXV_M_OUT??'work/v5/CXV/films/M-V1-panko-R1');await mkdir(out,{recursive:true});
const sha=v=>createHash('sha256').update(v).digest('hex');
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},prototypeSha256:sha(await readFile('tools/v5vfx/panko-living-experiment.mjs')),method:'Source-free Panko-only dev-page prototype; deterministic fullroute1280x720 samples. No production or gameplay/FPS claim.',modes:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
 report.url=page.url();report.artifactSha256=sha(await (await page.request.get('http://127.0.0.1:6310/')).body());
 const measure=async(reduced=false)=>page.evaluate(reduced=>{
  const rows=[];
  for(const [id,e]of window.__depthScene.actors){
   if(!['panko','soot'].includes(e.asset))continue;
   const d=e.craftPose.drawing,points=[...d.frame.feet,d.frame.sockets.head,...(d.frame.overlap??[]).map(o=>o.center)],samples=[];
   for(let n=0;n<=300;n++){
    const t=n/30;d.sample('idle',t%3.6,reduced,undefined,t,0);
    samples.push({t,points:points.map(p=>({...d.point(p)})),blink:[d.secondary.leftBlink,d.secondary.rightBlink],signals:[d.secondary.body,d.secondary.turn,d.secondary.tilt],vertices:n%30===0?Array.from(d.geometry.attributes.position.array):undefined});
   }
   rows.push({cat:e.asset,height:d.set.manifest.opaqueHeight*d.pixelScale,points:['footLeft','footRight','head',...(d.frame.overlap??[]).map(o=>o.part)],samples});
  }return rows;
 },reduced);
 const render=async(t,reduced=false)=>page.evaluate(({t,reduced})=>{const s=window.__depthScene;for(const e of s.actors.values())e.hurtAt=-100;s.render({...s.view(),frame:null,fixedTime:t,paused:true,galleryPreview:true,reducedMotion:reduced},0);},{t,reduced});
 for(const mode of (native?['candidate']:['baseline','candidate'])){
  if(mode==='candidate'&&!native)report.prototype=await installPankoExperiment(page);
  const dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  const measures=await measure();await writeFile(resolve(dir,'measure.json'),JSON.stringify(measures));
  const soot=measures.find(r=>r.cat==='soot');report.modes.push({mode,sootSha256:sha(JSON.stringify(soot)),measure:resolve(dir,'measure.json')});
  await render(20);
  const box=await page.evaluate(()=>{const s=window.__depthScene,id=[...s.actors].find(([,e])=>e.asset==='panko')[0],b=s.anchors.find(a=>a.id===id).body;return{x:Math.max(0,Math.floor(b.x-32)),y:Math.max(0,Math.floor(b.y-32)),width:Math.ceil(b.width+64),height:Math.ceil(b.height+64),body:b};});
  report.modes.at(-1).box=box;const {body,...clip}=box;
  for(let i=0;i<4;i++){await render(20+i*2.5);await page.screenshot({path:resolve(dir,`field-${i}.png`)});await page.screenshot({path:resolve(dir,`cat-${i}.png`),clip});}
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',resolve(dir,'cat-%d.png'),'-vf','scale=256:288:force_original_aspect_ratio=decrease,pad=256:288:(ow-iw)/2:(oh-ih)/2,tile=4x1','-frames:v','1','-y',resolve(dir,'cat-sheet.jpg')]);
 }
 const baseline=native?JSON.parse(await readFile('work/v5/CXV/films/M-V1-panko-R1/report.json','utf8')):report;
 report.sootExact=baseline.modes[0].sootSha256===report.modes.at(-1).sootSha256;
 if(native){report.method='Native Panko pilot after L1 study, current devsource fullroute1280x720; deterministic simulation film, not performance.';report.prototypeSha256=null;}
 // Deterministic simulation samples at 30Hz, played back at the same rate as the 30fps source.
 const dir=resolve(out,'candidate','frames');await mkdir(dir,{recursive:true});
 for(let n=0;n<300;n++){await render(20+n/30);await page.screenshot({path:resolve(dir,`${String(n).padStart(3,'0')}.png`)});}
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-framerate','30','-i',resolve(dir,'%03d.png'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-y',resolve(out,'candidate','panko-1280x720.mp4')]);
 if(native){
  const reducedDir=resolve(out,'reduced');await mkdir(reducedDir,{recursive:true});
  await writeFile(resolve(reducedDir,'measure.json'),JSON.stringify(await measure(true)));
  for(let i=0;i<4;i++){await render(20+i*2.5,true);await page.screenshot({path:resolve(reducedDir,`field-${i}.png`)});}
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',resolve(reducedDir,'field-%d.png'),'-vf','scale=512:288,tile=2x2','-frames:v','1','-y',resolve(reducedDir,'field-sheet.jpg')]);
 }
 report.errors=errors;report.blockedRequests=blockedRequests;report.completedUTC=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,sootExact:report.sootExact,errors,completedUTC:report.completedUTC}));if(errors.length||!report.sootExact)process.exitCode=1;
}finally{await browser.close();}
