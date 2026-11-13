import {returningGuest} from '../../tools/cinematic-compositor/review-guest.mjs';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from './browser-fixture.mjs';
import {root,evidenceMeta} from './check-gates.mjs';
const out=resolve(root,'reports/v3-battle/a2/V1');await mkdir(out,{recursive:true});
const ids=(await readdir(resolve(root,'tools/cinematic-compositor/plates'))).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const b=await chromium.launch({headless:true,args:['--use-angle=metal']}),rows=[],errors=[];
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const p=await b.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(e.message));
  await returningGuest(p);await p.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await p.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
  for(const id of ids){
   const unit=id.replace(/-ult$/,''),skill=unit==='yarn-giant'?'enemy:yarn-giant':unit+'-4';
   await p.evaluate(skill=>window.__depthReview.inspect(skill,0),skill);
   await p.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s?.ready&&[...s.actors.keys()].sort().join()===m.battle.actors.map(a=>a.id).sort().join();},null,{timeout:90000});
   await p.evaluate(()=>document.fonts.ready);
   const start=await p.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.paused=true;return m.plan.sequence.plate.start;});
   const seek=async t=>p.evaluate(t=>{const s=window.__depthScene,m=window.__depthReview;m.animationAt=t;m.notify(false);s.render({...s.view(),frame:m.frame,fixedTime:t/1000,paused:true},0);},t);
   await seek(start-34);
   if(width===1280)await p.locator('.b3-cinema').screenshot({path:resolve(out,id+'-field.png')});
   await seek(start+1800);
   await p.waitForFunction(()=>{const v=document.querySelector('video.b3-plate');return v&&v.readyState>=1;},null,{timeout:20000});
   // Metadata is asynchronous; the production player seeks on its next render too.
   await seek(start+1800);
   // This audit stops the scene RAF. Match the live player's next render
   // after decoding so the readiness guard can reveal the sought frame.
   await p.waitForFunction(()=>{const v=document.querySelector('video.b3-plate');return v&&v.readyState>=2&&Math.abs(v.currentTime-1.8)<.05;},null,{timeout:20000});
   await seek(start+1800);
   await p.waitForFunction(()=>{const v=document.querySelector('video.b3-plate');return v&&!v.hidden&&v.readyState>=2&&Math.abs(v.currentTime-1.8)<.05;},null,{timeout:20000});
   const fit=await p.evaluate(()=>{
    const v=document.querySelector('video.b3-plate'),h=document.querySelector('.b3-cinema'),r=v.getBoundingClientRect(),box=h.getBoundingClientRect(),css=getComputedStyle(v);
    const scale=css.objectFit==='cover'?Math.max(r.width/v.videoWidth,r.height/v.videoHeight):Math.min(r.width/v.videoWidth,r.height/v.videoHeight);
    const content={width:scale*v.videoWidth,height:scale*v.videoHeight};
    return {host:{width:box.width,height:box.height},video:{width:r.width,height:r.height},objectFit:css.objectFit,content,viewportFill:Math.min(1,r.width/box.width,r.height/box.height,content.width/box.width,content.height/box.height),currentTime:v.currentTime};
   });
   rows.push({id,width,height,...fit});
   await p.screenshot({path:resolve(out,`${id}-integrated-${width}.png`)});
  }
  await p.close();
 }
 await writeFile(resolve(out,'browser.json'),JSON.stringify({_meta:evidenceMeta(),rows,errors},null,2)+'\n');
 console.log(JSON.stringify({captures:rows.length,minViewportFill:Math.min(...rows.map(r=>r.viewportFill)),errors}));
 if(errors.length)process.exitCode=1;
}finally{await b.close();}
