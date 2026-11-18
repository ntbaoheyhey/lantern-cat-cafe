/** Whole ultimate focus placement against the unchanged scene and CSS. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {installFocusReadOverride} from './focus-read-source.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-focus-read-order');await mkdir(out,{recursive:true});
const freezeCss=true;
const native=process.env.CXV_NATIVE_FOCUS_READ==='1';
const hash=x=>createHash('sha256').update(x).digest('hex');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:hash(await readFile(new URL(import.meta.url))),overrideSha256:hash(await readFile(new URL('./focus-read-source.mjs',import.meta.url))),viewport:{width:1280,height:720},method:'Browser-only module override, actual scene/current CSS at fixed300ms ultimate focus. Compare existing batched layout versus same-paint HUD/title read reuse: current/pending footprints, placed labels, protected faces and title across4heroes, normal/reduced,6pending cases and4invalidation cases. No production acceptance or FPS claim. Screenshots follow geometry measurement.',modes:[],checks:[],errors:[]};
if(native)report.method='Native application read reuse, audit-only focus instrumentation. Compare current/pending footprints and banner placement against the preserved original80group baseline;CSS animations fixed at300ms for exact screenshot comparison. No behavioral module override;not production acceptance.';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const batch of native?[true]:[false,true]){
  const mode={batch,rows:[]};let override;
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false,setupPage:async p=>{await p.addInitScript(()=>{Math.random=()=>.5;});override=await installFocusReadOverride(p,{candidate:batch,audit:true,native});}});
  report.url=page.url();await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  for(const hero of ['mochi','soot','clover','panko'])for(const reduced of [false,true]){
   await page.evaluate(async({hero,reduced})=>{
    const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
    const f=pilotFixture(hero+'-4'),m=window.__depthReview,s=window.__depthScene;
    Object.assign(m,{galleryBattle:f.battle,plan:configureSequence(f.plan),galleryId:hero+'-4',animationAt:300,paused:true,sceneStarted:true,labOpen:false});m.state.settings.reducedMotion=reduced;m.notify(false);s.ensureActors(s.view());cancelAnimationFrame(s.raf);
   },{hero,reduced});
   await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));cancelAnimationFrame(window.__depthScene.raf);});
   const rows=await page.evaluate(async()=>{
    const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);s.phaseNoticeAt=-100;
    s.render({...s.view(),fixedTime:20.3,paused:true,galleryPreview:true},0);
    const bindWorldStatusSource=globalThis.__cxvStatusSourceBinder;if(!bindWorldStatusSource)throw Error('Active focus status source binder missing');
    const nodes=[...document.querySelectorAll('.b3-world')],parents=[...new Set(nodes.map(n=>n.parentElement))];
    const actual=()=>m.visualBattle.actors.map(a=>({id:a.id,shield:a.shield>0,stacks:a.statuses.map(v=>v.stacks)}));
    const cases=[['current',actual()],['empty',nodes.map(n=>({id:n.dataset.actor,shield:false,stacks:[]}))],['shield',nodes.map(n=>({id:n.dataset.actor,shield:true,stacks:[]}))],['wide',nodes.map(n=>({id:n.dataset.actor,shield:true,stacks:[12345,99,3]}))],['overflow',nodes.map(n=>({id:n.dataset.actor,shield:true,stacks:[12345,99,3,4,5]}))],['missing',[]]],result=[];
    try{
     for(const [name,pending]of cases){
      for(const parent of parents)bindWorldStatusSource(parent,()=>pending);
      const before=nodes.map(n=>n.outerHTML);globalThis.__cxvFullFocusInputs=[];s.cinema.identified.reset();
      s.render({...s.view(),fixedTime:20.3,paused:true,galleryPreview:true},0);
      const title=document.querySelector('.b3-focus-name'),r=title.getBoundingClientRect(),inputs=structuredClone(globalThis.__cxvFullFocusInputs);
      result.push({name,inputs,placement:{x:r.x,y:r.y,width:r.width,height:r.height,style:title.getAttribute('style'),caster:title.dataset.caster,clear:title.dataset.placement,hidden:title.hidden,text:title.textContent},clean:JSON.stringify(before)===JSON.stringify(nodes.map(n=>n.outerHTML))&&!parents.some(p=>p.querySelector('[inert][aria-hidden="true"]'))});
     }
     for(const parent of parents)bindWorldStatusSource(parent,actual);
     for(const name of ['resize-hud','font','translated-parent','hidden-hud']){
      const top=document.querySelector('.b3-top'),root=titleParent(),title=document.querySelector('.b3-focus-name');
      const saved=[top,root,title].map(node=>({node,style:node.getAttribute('style'),hidden:node.hidden}));
      try{
       if(name==='resize-hud')top.style.transform='translate(13px,7px)';
       if(name==='font')title.style.fontSize='29px';
       if(name==='translated-parent')root.style.transform='translate(13px,-7px)';
       if(name==='hidden-hud')top.hidden=true;
       globalThis.__cxvFullFocusInputs=[];
       if(name==='font')document.fonts.dispatchEvent(new Event('loadingdone'));else window.dispatchEvent(new Event('resize'));
       const before=nodes.map(n=>n.outerHTML);s.render({...s.view(),fixedTime:20.3,paused:true,galleryPreview:true},0);
       const r=title.getBoundingClientRect(),inputs=structuredClone(globalThis.__cxvFullFocusInputs);
       result.push({name,inputs,placement:{x:r.x,y:r.y,width:r.width,height:r.height,style:title.getAttribute('style'),caster:title.dataset.caster,clear:title.dataset.placement,hidden:title.hidden,text:title.textContent},clean:JSON.stringify(before)===JSON.stringify(nodes.map(n=>n.outerHTML))&&!parents.some(p=>p.querySelector('[inert][aria-hidden="true"]'))});
      }finally{for(const {node,style,hidden}of saved){if(style===null)node.removeAttribute('style');else node.setAttribute('style',style);node.hidden=hidden;}window.dispatchEvent(new Event('resize'));s.render({...s.view(),fixedTime:20.3,paused:true,galleryPreview:true},0);}
     }
     function titleParent(){return document.querySelector('.b3-focus-name').parentElement;}
    }finally{for(const parent of parents)bindWorldStatusSource(parent,actual);delete globalThis.__cxvFullFocusInputs;}
    s.cinema.identified.reset();s.render({...s.view(),fixedTime:20.3,paused:true,galleryPreview:true},0);return result;
   });
   const animations=freezeCss?await page.evaluate(async()=>{const animations=document.getAnimations();for(const animation of animations){animation.currentTime=300;animation.pause();}await Promise.all(animations.map(a=>a.ready));return animations.map(a=>({name:a.animationName??null,time:a.currentTime,state:a.playState}));}):undefined;
   const capture=resolve(out,`${hero}-${reduced?'reduced':'normal'}-${batch?'batch':'single'}.png`);await page.screenshot({path:capture});
   mode.rows.push({hero,reduced,rows,capture,animations});
   console.log(`${batch?'batch':'single'} ${hero} ${reduced?'reduced':'normal'} ${rows.length} groups`);
  }
  mode.override=override;report.modes.push(mode);report.errors.push(...errors);await page.close();
 }
 const baseline=native?JSON.parse(await readFile(resolve(process.env.CXV_BASELINE??'work/v5/CXV/films/V7-F-focus-read-order/report.json'),'utf8')):null;
 const [single,batch]=native?[baseline.modes[0],report.modes[0]]:report.modes;
 for(let i=0;i<single.rows.length;i++)for(let j=0;j<single.rows[i].rows.length;j++){
  const a=single.rows[i],b=batch.rows[i],x=a.rows[j],y=b.rows[j];let equal=true,detail;
  try{assert.deepEqual(y,x);}catch(error){equal=false;detail=error.message;}
  report.checks.push({hero:a.hero,reduced:a.reduced,name:x.name,equal,clean:x.clean&&y.clean,measured:x.inputs.length===1&&y.inputs.length===1,detail});
 }
 for(const hero of ['mochi','soot','clover','panko']){
  const inputs=[single.rows.find(r=>r.hero===hero&&!r.reduced),batch.rows.find(r=>r.hero===hero&&!r.reduced),single.rows.find(r=>r.hero===hero&&r.reduced),batch.rows.find(r=>r.hero===hero&&r.reduced)].flatMap(row=>['-i',row.capture]);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...inputs,'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',resolve(out,hero+'-comparison.jpg')]);
 }
 report.pixelChecks=[];
 if(freezeCss)for(let i=0;i<single.rows.length;i++){
  const a=single.rows[i],b=batch.rows[i],pixels=[a,b].map(row=>execFileSync('ffmpeg',['-v','error','-i',row.capture,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024}));
  report.pixelChecks.push({hero:a.hero,reduced:a.reduced,equal:pixels[0].equals(pixels[1]),rgbSha256:pixels.map(hash)});
 }
 report.native=native;report.baseline=native?{source:baseline.source,utc:baseline.utc,overrideSha256:baseline.overrideSha256}:undefined;
 report.freezeCss=freezeCss;report.pass=!report.errors.length&&report.checks.length===80&&report.checks.every(c=>c.equal&&c.clean&&c.measured)&&report.pixelChecks.every(c=>c.equal);
}catch(error){report.pass=false;report.error=String(error);}
finally{await browser.close();report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,error:report.error,errors:report.errors,checks:report.checks.length,failures:report.checks.filter(c=>!c.equal||!c.clean||!c.measured).map(({detail,...c})=>c)}));if(!report.pass)process.exitCode=1;}
