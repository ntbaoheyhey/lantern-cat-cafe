/** Visible DrawingLayer evidence plus one indicative shared-machine boss FPS check. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(process.env.CXV_MOTION_OUT??'work/v5/CXV/films/V2');
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 method:'Four close-up sheets: six idle samples plus six hit samples; exact simulation times. FPS is a separate six-second RAF run, shared machine, 1280x720 high quality.',sheets:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const consoleErrors=[];
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:process.env.CXV_URL??'http://127.0.0.1:6310',fixedClock:false,
  setupPage:page=>{page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});}});
 report.url=page.url();
 for(const owner of ['mochi','soot','clover','panko']){
  const dir=resolve(out,owner);await mkdir(dir,{recursive:true});
  const setup=await page.evaluate(owner=>{
   const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.animationAt=0;
   const [id,entry]=[...s.actors].find(([,e])=>e.asset===owner);entry.hurtAt=-100;
   s.render({...s.view(),frame:null,fixedTime:20,paused:true,galleryPreview:true},0);
   const a=s.anchors.find(a=>a.id===id),b=a.body;
   const x=Math.max(0,Math.floor(b.x-65)),y=Math.max(0,Math.floor(b.y-60));
   return {id,clip:{x,y,width:Math.min(1280-x,Math.ceil(b.width+130)),height:Math.min(720-y,Math.ceil(b.height+100))}};
  },owner);
  const samples=[];
  const times=[0,.4,.8,1.4,2.2,3,0,.04,.1,.18,.3,.5];
  for(let i=0;i<times.length;i++){
   const hit=i>=6,at=times[i];
   const audit=await page.evaluate(({id,hit,at})=>{
    const s=window.__depthScene,entry=s.actors.get(id);entry.hurtAt=hit?24:-100;
    s.render({...s.view(),frame:null,fixedTime:(hit?24:20)+at,paused:true,galleryPreview:true},0);
    const d=entry.craftPose.drawing,head=s.socket(id,'head');
    return {key:d.key,clock:d.secondary.clock,blink:[d.secondary.leftBlink,d.secondary.rightBlink],ear:d.secondary.earFlatten,
      feet:d.contactPoints(),root:entry.actor.root.position.toArray(),head};
   },{id:setup.id,hit,at});
   const path=resolve(dir,`frame-${String(i).padStart(2,'0')}.png`);
   await page.screenshot({path,clip:setup.clip});samples.push({hit,at,...audit});
  }
  const labels=times.map((t,i)=>`drawtext=text='${owner} ${i<6?'idle':'hit'} ${t.toFixed(2)}s':x=${(i%4)*320+8}:y=${Math.floor(i/4)*320+8}:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.7`).join(',');
  const sheet=resolve(out,owner+'.jpg');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-threads','1','-filter_threads','1','-i',resolve(dir,'frame-%02d.png'),
   '-vf',`scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2,tile=4x3,${labels}`,'-frames:v','1','-q:v','3','-y',sheet]);
  report.sheets.push({owner,...setup,sheet,samples});process.stdout.write(`${owner}: ${sheet}\n`);
  await page.evaluate(id=>{window.__depthScene.actors.get(id).hurtAt=-100;},setup.id);
 }
 await page.evaluate(async root=>{
  const {pilotFixture}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/vfx-layered/fixture.ts');
  const {configureSequence}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/sequence.ts');
  const fixture=pilotFixture('enemy:yarn-giant'),m=window.__depthReview,s=window.__depthScene;
  m.galleryBattle=fixture.battle;m.plan=configureSequence(fixture.plan);m.galleryId='enemy:yarn-giant';m.animationAt=0;m.paused=true;m.notify(false);
  cancelAnimationFrame(s.raf);s.ensureActors(s.view());
 },root);
 await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
 report.fps=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
  return await new Promise(resolve=>{
   let start=0,last=0,frames=0;const deltas=[];
   function frame(now){
    if(!start){start=now;last=now;}else{deltas.push(now-last);frames++;last=now;}
    const elapsed=now-start;m.animationAt=elapsed%m.plan.duration;
    s.render({...s.view(),fixedTime:30+elapsed/1000,paused:true},1/60);
    if(elapsed<6000)requestAnimationFrame(frame);else{
     const sorted=[...deltas].sort((a,b)=>a-b);
     resolve({label:'shared machine',frames,elapsedMs:elapsed,fps:frames*1000/elapsed,p95Ms:sorted[Math.floor(sorted.length*.95)],stats:s.stats});
    }
   }requestAnimationFrame(frame);
  });
 });
 report.errors=errors;report.consoleErrors=consoleErrors;report.finished=new Date().toISOString();
 await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));
 process.stdout.write(`shared machine boss FPS ${report.fps.fps.toFixed(2)}; errors ${errors.length+consoleErrors.length}\n`);
 if(errors.length||consoleErrors.length)throw Error('Browser errors; see capture.json');
 if(report.fps.fps<55)throw Error('Boss FPS below 55; see capture.json');
}finally{await browser.close();}
