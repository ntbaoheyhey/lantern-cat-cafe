/** C11 painting integration: changed backdrop with representative effects, no progression claim. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const output=resolve(root,'reports/cardrpg-c/shots/c11-stage-effects');await mkdir(output,{recursive:true});
const slots=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/spine/slots.json')));
const skills=['mochi-4','soot-4','marigold-4'];
if(skills.some(id=>!slots.units.some(u=>u.skills.some(s=>s.id===id))))throw Error('Unknown skill');
const report={method:'Deterministic presentation only; no gameplay progression or wall-clock performance claim.',errors:[],ultimates:[],phases:[],entrances:[],screenshots:[]};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text())});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 const init=async(id,speed=1,reduced=false)=>{
  await page.evaluate(async({id,speed,reduced})=>{const m=window.__depthReview;m.inspect(id,id.startsWith('enemy:')?-1:0);const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');m.galleryBattle=R.createBattle({...m.galleryBattle.initial,gameplayV4:true,skillsV5:true,gameplayA6:true});m.ultimateBannerUntil=Number.MAX_SAFE_INTEGER;m.state.settings.reducedMotion=reduced;m.state.settings.speed=speed;m.notify(false);},{id,speed,reduced});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady,null,{timeout:90000});
  await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return s.ready&&s.audit().stage.source==='painted'&&m.galleryBattle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);});
  await page.evaluate(()=>{const s=window.__depthScene;if(!window.c9Base){window.c9Base=s.view.bind(s);s.view=()=>({...window.c9Base(),fixedTime:window.c9Time,...window.c9Extra});}window.c9Time=10;window.c9Extra={};s.effects.clear();s.eventAudit.length=0;s.prepare(s.view());s.render({...s.view(),frame:window.__depthReview.frame},0);});
 };
 const sample=async(at)=>page.evaluate(at=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=at;window.c9Time=10+at/1000;s.render({...s.view(),frame:m.frame},0);return s.audit();},at);
 const shot=async(name)=>{await page.waitForTimeout(50);await page.locator('.spine-ultimate-cutin img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(output,name));report.screenshots.push(name);};
 for(const [width,height] of [[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const id of skills){
   for(const speed of [1,2,3]){
    await init(id,speed);
    const audit=await page.evaluate(({id,speed})=>{
     const m=window.__depthReview,s=window.__depthScene,intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
     const before=JSON.stringify(m.battle),duration=m.plan.duration,stageTextures=s.stage.textures.map(t=>t.uuid).join(',');let visible=0,overlaps=0,zoom=1,draws=0,labels=0,lastVisible=0;
     for(let at=0;at<=duration+500;at+=1000/60*speed){m.animationAt=Math.min(at,duration);window.c9Time=10+at/1000;s.render({...s.view(),frame:m.frame},0);const c=s.cinematic;if(c.ultimateVisible){visible++;lastVisible=at;overlaps+=[...s.labelAudit.heads,...s.labelAudit.cards].filter(b=>intersects(c.box,b)).length;}zoom=Math.max(zoom,s.camera.zoom);draws=Math.max(draws,s.stats.calls+s.effects.stats.draws);labels+=s.labelAudit.overlaps;}
     return{id,speed,stage:s.audit().stage,stableTextures:stageTextures===s.stage.textures.map(t=>t.uuid).join(','),visible,lastVisible,overlaps,labels,zoom,draws,dropped:s.effects.stats.dropped,unchanged:before===JSON.stringify(m.battle),events:s.eventAudit.map(e=>e.name),hiddenAtEnd:!s.cinematic.ultimateVisible};
    },{id,speed});
    report.ultimates.push({width,height,...audit});
    if(!audit.stableTextures||audit.stage.layers!==3||audit.stage.source!=='painted'||!audit.visible||audit.overlaps||audit.labels||audit.zoom>1.15||audit.draws>150||audit.dropped||!audit.hiddenAtEnd||!audit.unchanged||audit.events.filter(e=>e==='ult-start').length!==1||audit.events.filter(e=>e==='ult-end').length!==1)throw Error('Ultimate safety '+JSON.stringify(audit));
   }
   await init(id);const at=await page.evaluate(()=>window.__depthReview.plan.beats[2].start*.6);await sample(at);await sample(at+180);
   await page.waitForFunction(()=>document.querySelector('.spine-ultimate-cutin')?.hidden===false,null,{timeout:2000});
   await shot(`${id}-${width}.webp`);
  }
  for(const id of ['yarn-giant']){
   await init('enemy:'+id);
   for(const phase of [2,3]){
    const audit=await page.evaluate(({id,phase})=>{const s=window.__depthScene,m=window.__depthReview,unit=m.battle.actors.find(a=>a.catalogId===id);window.c9Extra={bossPhases:{[unit.id]:phase}};window.c9Time+=1.6;s.render(s.view(),0);window.c9Time+=.18;s.render(s.view(),0);return{phase,text:s.cinematic.phaseText,visible:s.cinematic.phaseVisible,draws:s.stats.calls+s.effects.stats.draws,labels:s.labelAudit.overlaps,phaseState:s.actors.get(unit.id).phase};},{id,phase});
    report.phases.push({width,id,...audit});if(!audit.visible||audit.phaseState!==phase||audit.labels||audit.draws>150)throw Error('Boss phase '+JSON.stringify(audit));
    await shot(`${id}-phase${phase}-${width}.webp`);
   }
  }
  for(const reduced of [false,true]){
   await init('mochi-4',1,reduced);const audit=await page.evaluate(reduced=>{const s=window.__depthScene,m=window.__depthReview;window.c9Extra={battleKey:{entryFixture:reduced},galleryPreview:false,frame:null};window.c9Time=s.time;s.prepare(s.view());s.render(s.view(),0);const begin=[...s.sampled.values()].map(v=>v.name);window.c9Time+=.85;s.render(s.view(),0);const end=[...s.sampled.values()].map(v=>v.name);return{reduced,begin,end,draws:s.effects.stats.draws,zoom:s.camera.zoom,shake:s.camera.position.x,labels:s.labelAudit.overlaps};},reduced);
   report.entrances.push({width,...audit});if(audit.labels||reduced&&(audit.zoom!==1||audit.shake!==0||audit.begin.some(n=>n==='appear')||audit.draws!==0)||!reduced&&!audit.begin.some(n=>n==='appear'))throw Error('Entrance '+JSON.stringify(audit));await shot(`entrance-${reduced?'calm':'motion'}-${width}.webp`);
   await init('soot-4',1,reduced);const at=await page.evaluate(()=>window.__depthReview.plan.beats[2].start*.65);await sample(at);const focus=await sample(at+160);if(reduced&&(focus.zoom!==1||focus.stage.offsets.some(x=>x!==0)))throw Error('Reduced zoom');await shot(`soot-4-${reduced?'calm':'motion'}-${width}.webp`);
   if(reduced){const animation=await page.locator('.spine-ultimate-cutin').evaluate(el=>getComputedStyle(el).animationName);if(animation!=='none')throw Error('Reduced cut-in animation '+animation);}
  }
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));
 console.log(JSON.stringify({ultimates:report.ultimates.length,phases:report.phases.length,entrances:report.entrances.length,shots:report.screenshots.length,maxDraws:Math.max(...report.ultimates.map(a=>a.draws)),maxZoom:Math.max(...report.ultimates.map(a=>a.zoom)),errors:report.errors}));
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
