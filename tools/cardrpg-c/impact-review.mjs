/** Presentation-clock regression: brief impacts, stable pause, clean recovery. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const offline=process.argv.includes('--offline'),tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c11-impact';
if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid evidence tag');
const output=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(output,{recursive:true});
const report={method:'Deterministic advancing gallery clock at x1/x2/x3, frozen-clock redraws, real pause/resume controls; no combat balance or frame-time claim.',offline,cases:[],controls:[],shots:[],errors:[],http:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try {
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('request',r=>{if(offline&&/^https?:/.test(r.url()))report.http.push(r.url());});
 await page.goto(offline?'file://'+root+'/docs/cardrpg-c/vfx.html':'http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');
 await page.waitForFunction(()=>window.vfxGallery?.scene.ready&&window.vfxGallery.scene.audit().stage.source==='painted');await page.evaluate(()=>window.vfxGallery.manual(true));
 async function shot(name,width,height){const file=`${width}-${name}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(output,file));report.shots.push({name,file,width,height});}
 for(const[width,height]of[[1280,720],[1440,900]]) {
  await page.setViewportSize({width,height});
  for(const reduced of [false,true]) {
   await page.locator('#motion').setChecked(reduced);
   for(const id of ['soot-1','soot-4','enemy:yarn-giant','marigold-4','mochi-4'])for(const speed of [1,2,3]) {
    await page.evaluate(({id,speed})=>{const g=window.vfxGallery;g.select(id);g.setSpeed(speed);}, {id,speed});
    await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
    const first=await page.evaluate(({speed})=>{
     const g=window.vfxGallery,s=g.scene,step=1000/60*speed;s.eventAudit.length=0;
     let at=0;for(;at<=g.fixture.plan.duration+step;at+=step){g.sample(at,3+at/1000);if(s.eventAudit.some(e=>e.name==='hit'))break;}
     if(at>g.fixture.plan.duration+step)throw Error('No hit event');
     const impacts=s.effects.stats.impacts,before=s.effects.canvas.toDataURL();let frozen=true;
     for(let i=0;i<3;i++){g.sample(at,3+at/1000);frozen&&=s.effects.stats.impacts===impacts&&s.effects.canvas.toDataURL()===before;}
     const c=s.effects.canvas.getContext('2d');let opaque=0,points=0;
     const check=(x,y,w,h)=>{const pixels=c.getImageData(x,y,w,h).data;for(let i=3;i<pixels.length;i+=4){points++;if(pixels[i])opaque++;}};
     for(const actor of g.view.actors){const p=s.socket(actor.id,'head');if(p)check(Math.round(p.x)-2,Math.round(p.y)-2,4,4);}
     for(const b of s.labelAudit.cards)check(Math.round(b.x+1),Math.round(b.y+1),Math.max(1,Math.floor(b.width-2)),Math.max(1,Math.floor(b.height-2)));
     return{at,step,impacts,frozen,mask:{opaque,points},zoom:s.camera.zoom,offsets:s.audit().stage.offsets};
    },{speed});
    const friendly=id==='marigold-4'||id==='mochi-4';
    if(!first.frozen||first.mask.opaque||friendly&&first.impacts!==0||!friendly&&!first.impacts||reduced&&(first.zoom!==1||first.offsets.some(x=>x!==0)))throw Error('Initial impact '+JSON.stringify({id,speed,reduced,first}));
    if(id==='soot-1'&&speed===1)await shot(`impact-${reduced?'calm':'motion'}`,width,height);
    const tail=await page.evaluate(({at,step,impacts})=>{
     const g=window.vfxGallery,s=g.scene,duration=g.fixture.plan.duration;let frames=impacts?1:0,draws=s.stats.calls+s.effects.stats.draws;
     for(let cursor=at+step;cursor<=duration+2200;cursor+=step){g.sample(cursor,3+cursor/1000);if(s.effects.stats.impacts)frames++;draws=Math.max(draws,s.stats.calls+s.effects.stats.draws);}
     return{visibleFrames:frames,late:{active:s.effects.stats.active,draws:s.effects.stats.draws,impacts:s.effects.stats.impacts},draws,dropped:s.effects.stats.dropped,labels:s.labelAudit.overlaps,hits:s.eventAudit.filter(e=>e.name==='hit').length};
    },first);
    const row={width,height,id,speed,reduced,first,tail};report.cases.push(row);
    if((friendly?tail.visibleFrames!==0:tail.visibleFrames<1||tail.visibleFrames>2)||tail.late.active||tail.late.draws||tail.dropped||tail.labels||tail.draws>150||tail.hits!==1)throw Error('Impact tail '+JSON.stringify(row));
    if(id==='soot-1'&&speed===1)await shot(`late-${reduced?'calm':'motion'}`,width,height);
   }
  }
  await page.locator('#motion').uncheck();await page.locator('#speed').selectOption('1');
  await page.evaluate(()=>{const g=window.vfxGallery;g.select('soot-4');g.manual(false);});
  await page.waitForFunction(()=>window.vfxGallery.scene.effects.stats.active>0);
  await page.locator('#pause').click();
  const frozen=await page.evaluate(()=>({time:window.vfxGallery.view.fixedTime,pixels:window.vfxGallery.scene.effects.canvas.toDataURL()}));
  await page.waitForTimeout(180);
  const stable=await page.evaluate(frozen=>window.vfxGallery.view.fixedTime===frozen.time&&window.vfxGallery.scene.effects.canvas.toDataURL()===frozen.pixels,frozen);
  await page.locator('#pause').click();await page.waitForFunction(time=>window.vfxGallery.view.fixedTime>time,frozen.time);
  await page.evaluate(()=>window.vfxGallery.manual(true));report.controls.push({width,pausedStable:stable,resumed:true});if(!stable)throw Error('Pause control advanced');
 }
 if(report.errors.length||report.http.length)throw Error(JSON.stringify({errors:report.errors,http:report.http}));report.complete=true;
 console.log(JSON.stringify({cases:report.cases.length,controls:report.controls,shots:report.shots.length,maxDraws:Math.max(...report.cases.map(c=>c.tail.draws)),errors:report.errors,http:report.http}));
} finally {await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
