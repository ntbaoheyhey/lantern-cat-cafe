/** Current HUD semantics, DOM mutation volume and fresh viewport position under study overrides. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {installHudGeometryOverride} from './hud-geometry-override.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-hud-dom');
await mkdir(out,{recursive:true});
const native=process.env.CXV_HUD_NATIVE==='1',prototype=process.env.CXV_HUD_PROTOTYPE??'stable',hash=v=>createHash('sha256').update(v).digest('hex');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),native,viewport:{width:1280,height:720},toolSha256:hash(await readFile(new URL(import.meta.url))),method:'Controlled candidate HUD snapshots, repeated paused RAF mutations, ancestor translation and scroll. Four hero ultimates in normal/reduced motion. CSS animation clocks frozen for exact full-frame RGB comparisons; synthetic fixture evidence, not ordinary-play production acceptance.',modes:[],checks:[],pixelChecks:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const mode of native?['native']:['baseline',prototype]){
  let override;
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:async p=>{
   await p.addInitScript(()=>{Math.random=()=>.5;});
   if(mode!=='native')override=await installHudGeometryOverride(p,{mode,audit:false});
  }});
  report.url=page.url();
  const rows=[],captures=[];
  for(const hero of ['mochi','soot','clover','panko'])for(const reduced of [false,true]){
   await page.evaluate(async({hero,reduced})=>{
    const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
    const f=pilotFixture(hero+'-4'),m=window.__depthReview,s=window.__depthScene;
    Object.assign(m,{galleryBattle:f.battle,plan:configureSequence(f.plan),galleryId:hero+'-4',animationAt:0,paused:true,sceneStarted:true,labOpen:false});
    m.state.settings.reducedMotion=reduced;m.notify(false);s.ensureActors(s.view());cancelAnimationFrame(s.raf);
   },{hero,reduced});
   const deadline=Date.now()+90000;
   while(!await page.evaluate(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length)){
    if(Date.now()>deadline)throw Error('Timed out loading '+hero+' fixture');
    await new Promise(resolve=>setTimeout(resolve,50));
   }
   await page.clock.runFor(50);
   for(const age of [0,300,1100,1300,2400]){
    await page.evaluate(age=>{
     const m=window.__depthReview,s=window.__depthScene;
     m.animationAt=age;cancelAnimationFrame(s.raf);s.phaseNoticeAt=-100;
     for(const e of s.actors.values()){e.entered=-100;e.hurtAt=-100;}
     s.render({...s.view(),fixedTime:20+age/1000,paused:true,galleryPreview:true},0);
    },age);
    await page.clock.runFor(age===2400?1100:34);
    const state=await page.evaluate(()=>{
     const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
     s.render({...s.view(),fixedTime:20+m.animationAt/1000,paused:true,galleryPreview:true},0);
     const box=node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
     const total=document.querySelector('.b3-total'),skip=document.querySelector('.b3-skip-plate');
     return{canvas:box(document.querySelector('.dp-canvas')),total:{hidden:total.hidden,text:total.textContent,box:box(total)},skipHidden:skip.hidden,occluded:document.body.classList.contains('b3-cinema-occludes'),labels:[...document.querySelectorAll('.b3-world')].map(n=>({id:n.dataset.actor,hidden:n.hidden,text:n.textContent,left:n.style.left,top:n.style.top,box:box(n)}))};
    });
    rows.push({hero,reduced,age,state});
    if(age===1300){
     await page.evaluate(async()=>{const animations=document.getAnimations();for(const a of animations){a.currentTime=300;a.pause();}await Promise.all(animations.map(a=>a.ready));});
     const path=resolve(out,hero+'-'+(reduced?'reduced':'normal')+'-'+mode+'.png');
     await page.screenshot({path});captures.push({hero,reduced,path});
    }
   }
  }
  // Exercise position-only ancestor movement: a size observer alone cannot capture this change.
  const positions=[];
  for(const transform of ['none','translate(37px, -19px)','translate(-23px, 17px)','none']){
   await page.evaluate(transform=>{const canvas=document.querySelector('.dp-canvas');canvas.parentElement.style.transform=transform;},transform);
   await page.clock.runFor(34);
   positions.push(await page.evaluate(()=>{const canvas=document.querySelector('.dp-canvas'),r=canvas.getBoundingClientRect();return{canvas:{left:r.left,top:r.top,width:r.width,height:r.height},labels:[...document.querySelectorAll('.b3-world')].map(n=>({id:n.dataset.actor,left:n.style.left,top:n.style.top,hidden:n.hidden}))};}));
  }
  await page.evaluate(()=>{document.querySelector('.dp-canvas').parentElement.style.removeProperty('transform');});
  // Mutations are measured separately from performance trials to avoid observer overhead bias.
  await page.evaluate(()=>{
   globalThis.__cxvHudMutations={text:0,hidden:0,other:0};
   globalThis.__cxvHudObserver=new MutationObserver(records=>{for(const r of records){const group=r.type==='childList'?'text':r.attributeName==='hidden'?'hidden':'other';globalThis.__cxvHudMutations[group]++;}});
   globalThis.__cxvHudObserver.observe(document.querySelector('.b3-hud'),{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  });
  await page.clock.runFor(200);
  const mutations=await page.evaluate(()=>{globalThis.__cxvHudObserver.disconnect();return globalThis.__cxvHudMutations;});
  report.modes.push({mode,override,rows,captures,positions,mutations});report.errors.push(...errors);await page.close();
 }
 const saved=native?JSON.parse(await readFile(resolve(process.env.CXV_HUD_BASELINE??'work/v5/CXV/films/V7-F-hud-dom/report.json'),'utf8')):null;
 const [a,b]=native?[saved.modes[0],report.modes[0]]:report.modes;
 for(let i=0;i<a.rows.length;i++){let equal=true,detail;try{assert.deepEqual(b.rows[i],a.rows[i]);}catch(e){equal=false;detail=e.message;}report.checks.push({hero:a.rows[i].hero,reduced:a.rows[i].reduced,age:a.rows[i].age,equal,detail});}
 report.positionEqual=JSON.stringify(a.positions)===JSON.stringify(b.positions);
 report.positionChanges=a.positions.map((p,i)=>({index:i,dx:p.canvas.left-a.positions[0].canvas.left,dy:p.canvas.top-a.positions[0].canvas.top,width:p.canvas.width,height:p.canvas.height}));
 for(let i=0;i<a.captures.length;i++){
  const x=a.captures[i],y=b.captures[i],rgb=[x,y].map(v=>execFileSync('ffmpeg',['-v','error','-i',v.path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024}));
  report.pixelChecks.push({hero:x.hero,reduced:x.reduced,equal:rgb[0].equals(rgb[1]),rgbSha256:rgb.map(hash)});
 }
 for(const hero of ['mochi','soot','clover','panko']){
  const paths=[a,b].flatMap(v=>v.captures.filter(c=>c.hero===hero).map(c=>c.path));
  execFileSync('ffmpeg',['-v','error','-y',...paths.flatMap(p=>['-i',p]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',resolve(out,hero+'-comparison.jpg')]);
 }
 report.pass=!report.errors.length&&report.checks.length===40&&report.checks.every(c=>c.equal)&&report.positionEqual&&report.pixelChecks.every(c=>c.equal);
}catch(error){report.pass=false;report.error=String(error);}
finally{await browser.close();report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,error:report.error,errors:report.errors,checks:report.checks.length,pixels:report.pixelChecks,mutations:report.modes.map(m=>({mode:m.mode,...m.mutations})),failures:report.checks.filter(c=>!c.equal).map(({detail,...c})=>c)}));if(!report.pass)process.exitCode=1;}
