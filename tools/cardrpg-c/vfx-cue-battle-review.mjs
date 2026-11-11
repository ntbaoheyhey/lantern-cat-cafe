/** Contact-phase paint with the actual A6 battle HUD; presentation fixtures only. */
import{createRequire}from'node:module';import{resolve}from'node:path';import{mkdir,writeFile}from'node:fs/promises';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const output=resolve(root,'reports/cardrpg-c/shots/c11-vfx-cues-battle');await mkdir(output,{recursive:true});
const report={method:'Contact phase against actual A6 battle HUD, no combat progression or timing measurement.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.waitForFunction(()=>window.__depthReview);
 for(const[width,height]of[[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const id of['panko-4','sorrel-4','velvet-3','enemy:kettle-knight','enemy:pollen-scout'])for(const reduced of(id==='panko-4'?[false,true]:[false])){
   await page.evaluate(async({id,reduced})=>{const m=window.__depthReview;m.inspect(id,0);const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');m.galleryBattle=R.createBattle({...m.galleryBattle.initial,gameplayV4:true,skillsV5:true,gameplayA6:true});m.ultimateBannerUntil=Number.MAX_SAFE_INTEGER;m.state.settings.reducedMotion=reduced;m.state.settings.speed=1;m.notify(false);},{id,reduced});
   await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s?.ready&&s.audit().stage.source==='painted'&&m.galleryBattle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);});
   const audit=await page.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview;if(!window.cueBase){window.cueBase=s.view.bind(s);s.view=()=>({...window.cueBase(),fixedTime:window.cueTime});}window.cueTime=3;s.effects.clear();s.eventAudit.length=0;s.prepare(s.view());const before=JSON.stringify(m.battle);for(let at=0;at<=m.plan.beats[2].start+150;at+=1000/60){m.animationAt=at;window.cueTime=3+at/1000;s.render({...s.view(),frame:m.frame},0);}return{draws:s.stats.calls+s.effects.stats.draws,active:s.effects.stats.active,dropped:s.effects.stats.dropped,labels:s.labelAudit.overlaps,heads:s.labelAudit.heads,cards:s.labelAudit.cards,zoom:s.camera.zoom,stage:s.audit().stage,events:s.eventAudit.map(e=>e.name),unchanged:before===JSON.stringify(m.battle)};});
   report.cases.push({width,height,id,reduced,...audit});if(!audit.active||audit.dropped||audit.labels||audit.draws>150||!audit.unchanged||audit.events.filter(e=>e==='hit').length!==1||reduced&&(audit.zoom!==1||audit.stage.offsets.some(x=>x!==0)))throw Error('Battle cue gate '+id);
   const name=id+' '+(reduced?'calm':'motion'),file=id.replaceAll(':','-')+'-'+(reduced?'calm':'motion')+'-'+width+'.webp';await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(output,file));report.shots.push({name,file,width,height});
  }
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,maxDraws:Math.max(...report.cases.map(c=>c.draws)),errors:report.errors}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
