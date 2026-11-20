/** Real charge fixture, strike control, user toggle and pause/loop behavior. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const offline=process.argv.includes('--offline'),tag='c11-utility-'+(offline?'offline':'source'),out=resolve(root,'reports/cardrpg-c/shots',tag);
await mkdir(out,{recursive:true});
const report={method:'Deterministic source/offline preview of real preparation versus synthetic strike, with user toggle and actual Pause/Play/loop checks. No balance seeds or frame-time claim.',cases:[],controls:[],shots:[],errors:[],http:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('request',r=>{if(offline&&/^https?:/.test(r.url()))report.http.push(r.url());});
 await page.goto(offline?'file://'+root+'/docs/cardrpg-c/vfx.html':'http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');
 await page.waitForFunction(()=>window.vfxGallery?.scene.ready&&window.vfxGallery.scene.audit().stage.source==='painted');await page.evaluate(()=>window.vfxGallery.manual(true));
 for(const[width,height]of[[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const id of['enemy:spool-ram:basic','enemy:spool-ram'])for(const prepare of[false,true])for(const reduced of[false,true])for(const speed of[1,2,3]){
   await page.locator('#choose').selectOption(id);if(prepare)await page.locator('#charge-preview').click();
   await page.locator('#motion').setChecked(reduced);await page.locator('#speed').selectOption(String(speed));
   await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
   const contact=await page.evaluate(({prepare,speed})=>{
    const g=window.vfxGallery,s=g.scene,fx=s.effects;s.eventAudit.length=0;
    const before=JSON.stringify(g.fixture.battle),step=1000/60*speed,hit=g.fixture.plan.beats[2].start;let shake=0,impacts=0,draws=0,last=0;
    for(let at=0;at<=hit+150;at+=step){g.sample(at,3+at/1000);last=at;shake=Math.max(shake,Math.abs(s.camera.position.x));impacts=Math.max(impacts,fx.stats.impacts);draws=Math.max(draws,s.stats.calls+fx.stats.draws);}
    const own=fx.pool.filter(p=>p.active&&p.born<=g.view.fixedTime&&p.impact),caster=g.fixture.plan.actorId;
    const c=fx.canvas.getContext('2d');let opaque=0;const check=(x,y,w,h)=>{const d=c.getImageData(x,y,w,h).data;for(let i=3;i<d.length;i+=4)if(d[i])opaque++;};
    for(const a of g.view.actors){const h=s.socket(a.id,'head');if(h)check(Math.round(h.x)-2,Math.round(h.y)-2,4,4);}
    for(const b of s.labelAudit.cards)check(Math.round(b.x+1),Math.round(b.y+1),Math.max(1,Math.floor(b.width-2)),Math.max(1,Math.floor(b.height-2)));
    const stage=document.querySelector('#stage').getBoundingClientRect();
    return{before,step,hit,last,shake,impacts,draws,active:fx.stats.active,opaque,overlaps:s.labelAudit.overlaps,charge:g.fixture.plan.events.some(e=>e.type==='charge'),own:own.map(p=>({target:p.target,glyph:p.layer.glyph})),caster,numbers:s.numbers.drawn.length,name:g.fixture.plan.name,clip:s.sampled.get(caster)?.name,pressed:document.querySelector('#charge-preview').getAttribute('aria-pressed'),overflow:document.documentElement.scrollWidth>innerWidth,stageVisible:stage.top>=0&&stage.bottom<=innerHeight};
   },{prepare,speed});
   if(!contact.active||contact.opaque||contact.overlaps||contact.draws>150||contact.overflow||!contact.stageVisible||contact.pressed!==String(prepare)||prepare!==contact.charge)throw Error('Gallery layout/cues '+JSON.stringify({id,width,speed,reduced,prepare,contact}));
   if(prepare&&(contact.shake||contact.impacts||contact.numbers||contact.clip!=='skill'||!contact.own.some(p=>p.glyph==='bobbin')||contact.own.some(p=>p.target!==contact.caster)))throw Error('Preparation '+JSON.stringify(contact));
   if(!prepare&&(!contact.impacts||!contact.numbers||!reduced&&!contact.shake)||reduced&&contact.shake)throw Error('Strike control '+JSON.stringify(contact));
   if(speed===1&&(!reduced||prepare&&id.endsWith(':basic'))){const name=(id.endsWith(':basic')?'basic':'signature')+' '+(prepare?'charge':'strike')+' '+(reduced?'calm':'motion'),file=name.replaceAll(' ','-')+'-'+width+'.webp';await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({name,file,width,height});}
   const tail=await page.evaluate(contact=>{const g=window.vfxGallery,s=g.scene;for(let at=contact.last+contact.step;at<=g.fixture.plan.duration+2400;at+=contact.step)g.sample(at,3+at/1000);return{late:s.effects.stats.active,drops:s.effects.stats.dropped,hits:s.eventAudit.filter(e=>e.name==='hit').length,unchanged:contact.before===JSON.stringify(g.fixture.battle)};},contact);
   report.cases.push({id,width,height,prepare,reduced,speed,contact:{...contact,before:undefined},tail});
   if(tail.late||tail.drops||tail.hits!==1||!tail.unchanged)throw Error('Gallery tail '+JSON.stringify(tail));
  }
  await page.locator('#motion').uncheck();
  for(const speed of[1,2,3]){
   await page.locator('#choose').selectOption('enemy:spool-ram');await page.locator('#charge-preview').click();await page.locator('#speed').selectOption(String(speed));await page.evaluate(()=>window.vfxGallery.manual(false));
   await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.effects.pool.some(p=>p.active&&p.layer?.glyph==='bobbin'&&p.impact&&p.born<g.view.fixedTime);});await page.locator('#pause').click();
   await page.evaluate(()=>{const g=window.vfxGallery,c=g.scene.effects.canvas;window.utilityFrozen={time:g.view.fixedTime,plan:g.fixture.plan,pixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data};});await page.waitForTimeout(120);
   const frozen=await page.evaluate(()=>{const g=window.vfxGallery,c=g.scene.effects.canvas,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return g.view.fixedTime===window.utilityFrozen.time&&d.every((n,i)=>n===window.utilityFrozen.pixels[i]);});
   await page.locator('#pause').click();await page.waitForFunction(()=>{const g=window.vfxGallery;return g.fixture.plan!==window.utilityFrozen.plan&&g.view.fixedTime>window.utilityFrozen.time;});
   const loop=await page.evaluate(()=>window.vfxGallery.fixture.plan.events.some(e=>e.type==='charge'));
   await page.evaluate(()=>window.vfxGallery.manual(true));report.controls.push({width,height,speed,frozen,loop});if(!frozen||!loop)throw Error('Pause/loop control failed');
  }
  await page.locator('#choose').selectOption('mochi-4');if(await page.locator('#charge-preview').isVisible())throw Error('Charge toggle leaked to another unit');
 }
 if(report.errors.length||report.http.length)throw Error(JSON.stringify({errors:report.errors,http:report.http}));report.complete=true;
 console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,controls:report.controls.length,maxDraws:Math.max(...report.cases.map(c=>c.contact.draws)),errors:report.errors,http:report.http}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
