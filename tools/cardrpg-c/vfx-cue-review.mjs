/** Self-effect contact regression and coverage of changed cue routing. No gameplay claims. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const offline=process.argv.includes('--offline'),capturesOnly=process.argv.includes('--captures-only'),tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c11-vfx-cues';
if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid evidence tag');
const output=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(output,{recursive:true});
const only=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',');
const featured=only??['panko-4','sorrel-4','velvet-3','enemy:kettle-knight','enemy:pollen-scout','enemy:pantry-crown','soot-4','mochi-4'];
const report={method:'Deterministic authored cues with advancing presentation time; socket/paint/expiry checks. Full review includes x1/x2/x3 and real Pause/Play; captures-only refreshes x1 images. Forced redraw pixel equality is supplemental and PARTIAL; no progression or wall-clock timing claim.',offline,capturesOnly,cases:[],pauseControls:[],shots:[],errors:[],http:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try {
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('request',r=>{if(offline&&/^https?:/.test(r.url()))report.http.push(r.url());});
 await page.goto(offline?'file://'+root+'/docs/cardrpg-c/vfx.html':'http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');
 await page.waitForFunction(()=>window.vfxGallery?.scene.ready&&window.vfxGallery.scene.audit().stage.source==='painted');await page.evaluate(()=>window.vfxGallery.manual(true));
 const ids=await page.locator('#choose option').evaluateAll(options=>options.map(o=>o.value).filter(id=>!id.startsWith('status:')));
 if(only?.some(id=>!ids.includes(id)))throw Error('Unknown skill');
 async function shot(id,width,height,phase,reduced){const name=`${id} ${phase} ${reduced?'calm':'motion'}`,file=`${id.replaceAll(':','-')}-${phase}-${reduced?'calm':'motion'}-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(output,file));report.shots.push({name,id,width,height,phase,reduced,file});}
 for(const[width,height]of[[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const reduced of[false,true]){
   await page.locator('#motion').setChecked(reduced);
   for(const id of(capturesOnly?(reduced?['panko-4']:featured):ids))for(const speed of(capturesOnly?[1]:[1,2,3])){
    if(only&&!only.includes(id))continue;
    if(speed===1&&featured.includes(id))await page.locator('#speed').selectOption('1');
    await page.evaluate(({id,speed})=>{const g=window.vfxGallery;g.select(id);g.setSpeed(speed);},{id,speed});
    await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
    const first=await page.evaluate(({id,speed})=>{
     const g=window.vfxGallery,s=g.scene,fx=s.effects;s.eventAudit.length=0;
     const step=1000/60*speed,hit=g.fixture.plan.beats[2].start,before=JSON.stringify(g.fixture.battle);let draws=0,peak=0,earlyContact=0,at=0;
     for(;at<hit;at+=step){g.sample(at,3+at/1000);draws=Math.max(draws,s.stats.calls+fx.stats.draws);peak=Math.max(peak,fx.stats.active);if(id==='panko-4')earlyContact+=fx.pool.filter(p=>p.active&&p.layer.phase==='contact').length;}
     return{step,hit,at,draws,peak,earlyContact,before};
    },{id,speed});
    if(first.earlyContact)throw Error('Self-shield appeared before hit '+id);
    if(id==='panko-4'&&speed===1)await shot(id,width,height,'windup',reduced);
    const contact=await page.evaluate(first=>{
     const g=window.vfxGallery,s=g.scene,fx=s.effects;let at=first.at,last=at,draws=first.draws,peak=first.peak;
     for(;at<=first.hit+150;at+=first.step){g.sample(at,3+at/1000);last=at;draws=Math.max(draws,s.stats.calls+fx.stats.draws);peak=Math.max(peak,fx.stats.active);}
     const ctx=fx.canvas.getContext('2d');let opaque=0,protectedPoints=0;
     const check=(x,y,w,h)=>{const pixels=ctx.getImageData(x,y,w,h).data;for(let i=3;i<pixels.length;i+=4){protectedPoints++;if(pixels[i])opaque++;}};
     for(const actor of g.view.actors){const p=s.socket(actor.id,'head');if(p)check(Math.round(p.x)-2,Math.round(p.y)-2,4,4);}
     for(const b of s.labelAudit.cards)check(Math.round(b.x+1),Math.round(b.y+1),Math.max(1,Math.floor(b.width-2)),Math.max(1,Math.floor(b.height-2)));
     const alpha=ctx.getImageData(0,0,fx.canvas.width,fx.canvas.height).data;let paintedPixels=0;for(let i=3;i<alpha.length;i+=4)if(alpha[i]>15)paintedPixels++;
     const sockets=()=>JSON.stringify(g.view.actors.map(a=>[s.socket(a.id,'head'),s.socket(a.id,'feet'),s.socket(a.id,'vfxOrigin')])),beforeSockets=sockets();
     g.sample(last,3+last/1000);const pixels=ctx.getImageData(0,0,fx.canvas.width,fx.canvas.height).data;let redrawChannels=0,redrawMax=0;for(let i=0;i<alpha.length;i++){const difference=Math.abs(alpha[i]-pixels[i]);if(difference){redrawChannels++;redrawMax=Math.max(redrawMax,difference);}}
     return{at,last,draws,peak,active:fx.stats.active,paintedPixels,opaque,protectedPoints,redraw:{channels:redrawChannels,max:redrawMax,socketsStable:beforeSockets===sockets()},impacts:fx.stats.impacts,zoom:s.camera.zoom,offsets:s.audit().stage.offsets,contact:fx.pool.filter(p=>p.active&&p.layer.phase==='contact'&&p.born<=3+last/1000).map(p=>({glyph:p.layer.glyph,source:p.source,target:p.target,socket:p.layer.socket}))};
    },first);
    if(!contact.active||!contact.paintedPixels||contact.opaque||reduced&&(contact.zoom!==1||contact.offsets.some(x=>x!==0)))throw Error('Contact paint '+JSON.stringify({id,width,speed,reduced,contact}));
    if(id==='panko-4'&&(!contact.contact.some(p=>p.glyph==='oven'&&p.source===p.target&&p.socket==='vfxOrigin')||contact.impacts))throw Error('Missing self-shield at contact');
    if(speed===1&&featured.includes(id)&&(!reduced||id==='panko-4'))await shot(id,width,height,'contact',reduced);
    const tail=await page.evaluate(({contact,first})=>{
     const g=window.vfxGallery,s=g.scene,fx=s.effects;let draws=contact.draws,peak=contact.peak;
     for(let at=contact.at;at<=g.fixture.plan.duration+2400;at+=first.step){g.sample(at,3+at/1000);draws=Math.max(draws,s.stats.calls+fx.stats.draws);peak=Math.max(peak,fx.stats.active);}
     return{draws,peak,dropped:fx.stats.dropped,labels:s.labelAudit.overlaps,late:fx.stats.active+fx.stats.draws,hits:s.eventAudit.filter(e=>e.name==='hit').length,unchanged:first.before===JSON.stringify(g.fixture.battle)};
    },{contact,first});
    const row={id,width,height,speed,reduced,earlyContact:first.earlyContact,contact,tail};report.cases.push(row);
    if(tail.draws>150||tail.peak>256||tail.dropped||tail.labels||tail.late||tail.hits!==1||!tail.unchanged)throw Error('Cue cleanup '+JSON.stringify(row));
   }
  }
  await page.locator('#motion').uncheck();
  for(const speed of(capturesOnly?[]:[1,2,3])){
   const playbackId=only?.[0]??'panko-4';
   await page.locator('#speed').selectOption(String(speed));await page.evaluate(id=>{const g=window.vfxGallery;g.select(id);g.manual(false);},playbackId);
   await page.waitForFunction(id=>{const g=window.vfxGallery;return g.scene.effects.pool.some(p=>p.active&&p.recipe.id===id&&p.layer.phase==='contact'&&p.born<g.view.fixedTime);},playbackId);
   await page.locator('#pause').click();
   await page.evaluate(()=>{const g=window.vfxGallery,c=g.scene.effects.canvas;window.cueFrozen={time:g.view.fixedTime,pixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data};});
   await page.waitForTimeout(180);
   const stable=await page.evaluate(()=>{const g=window.vfxGallery,c=g.scene.effects.canvas,pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return g.view.fixedTime===window.cueFrozen.time&&pixels.every((value,index)=>value===window.cueFrozen.pixels[index]);});
   if(!stable)throw Error('Pause control changed its time/pixels');await page.locator('#pause').click();await page.waitForFunction(()=>window.vfxGallery.view.fixedTime>window.cueFrozen.time);await page.evaluate(()=>window.vfxGallery.manual(true));
   report.pauseControls.push({width,height,speed,stable,resumed:true});
  }
 }
 if(report.errors.length||report.http.length)throw Error(JSON.stringify({errors:report.errors,http:report.http}));report.complete=true;
 console.log(JSON.stringify({cases:report.cases.length,pauseControls:report.pauseControls,forcedRedrawDifferences:report.cases.filter(c=>c.contact.redraw.channels).length,shots:report.shots.length,draws:Math.max(...report.cases.map(c=>c.tail.draws)),peak:Math.max(...report.cases.map(c=>c.tail.peak)),errors:report.errors,http:report.http}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(output,capturesOnly?'captures.json':'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
