/** Fresh production or local runtime capture using the shipped review API. */
import {chromium} from './browser-fixture.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runtimeEvidence} from './runtime-evidence.mjs';
const root=process.cwd(), out=resolve(process.env.CXV_CAPTURE_OUT), url=(process.env.CXV_URL??'http://127.0.0.1:6310')+'/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1';
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),url,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),reportedBuildSource:process.env.CXV_BUILD_SOURCE??null,rows:[],errors:[]};
if(process.env.CXV_DIST)report.indexSha256=createHash('sha256').update(await readFile(resolve(process.env.CXV_DIST,'index.html'))).digest('hex');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)||['blob:','data:'].includes(u.protocol)?r.continue():r.abort();});
 await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
 await page.goto(url);
 if(await page.getByRole('button',{name:'Play free',exact:true}).isVisible())await page.getByRole('button',{name:'Play free',exact:true}).click();
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:60000});
 for(const id of (process.env.CXV_SKILLS??'enemy:button-guard,enemy:spool-ram,enemy:kettle-knight').split(',')){
  const dir=resolve(out,id);await mkdir(dir,{recursive:true});
  await page.evaluate(id=>{const m=window.__depthReview;m.state.tutorial=4;m.state.formationC2=true;m.state.gameplayA6=true;Object.assign(m.state.settings,{quality:'high',speed:1,reducedMotion:false});m.labOpen=false;m.inspect(id,0,false);},id);
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  const contact=await page.evaluate(()=>window.__depthReview.plan.beats[2].start),samples=[];
  for(const [i,ms]of [contact-100,contact,contact+90,contact+220].entries()){
   samples.push(await page.evaluate(ms=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);return{ms,skill:m.plan.skillId,draws:s.effects.stats.draws,timeline:s.effects.timeline.audit.id,passes:s.effects.blendLayers.passes.map(p=>({blend:p.blend,active:p.active,style:p.canvas.style.cssText,pixels:p.context.getImageData(0,0,p.canvas.width,p.canvas.height).data.reduce((n,v,i)=>n+(i%4===3&&v>5?1:0),0)}))};},ms));
   await page.screenshot({path:resolve(dir,`frame-${i}.png`)});
  }
  const sheet=resolve(out,id+'.jpg');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','6','-i',resolve(dir,'frame-%d.png'),'-vf','scale=640:-1,tile=2x2','-frames:v','1','-q:v','4',sheet]);report.rows.push({id,contact,samples,sheet});
 }
 report.pass=report.errors.length===0;
}finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));}
if(!report.pass)process.exitCode=1;console.log(JSON.stringify({rows:report.rows.length,errors:report.errors,pass:report.pass}));
