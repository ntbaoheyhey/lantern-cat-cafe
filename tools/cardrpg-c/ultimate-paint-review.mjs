/** Ultimate silhouette review; uses legal gallery actions and the shared renderer. */
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const offline=process.argv.includes('--offline'),pilot=process.argv.includes('--pilot'),scratch=process.argv.includes('--scratch');
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c11-ultimate-paint-'+(offline?'offline':'source');
if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid tag');
const out=scratch?'/tmp/cardrpg-c-'+tag:resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(out,{recursive:true});
const slots=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/spine/slots.json'),'utf8'));
const selected=['mochi-4','soot-4','panko-4','marigold-4'];
const ids=pilot?selected:slots.units.filter(u=>u.side==='party').map(u=>u.skills.find(s=>s.animation==='ult').id);
const report={method:'Legal gallery ultimates; 60Hz action samples at x1/x2/x3, both sizes and motion settings. Check recipient pixels, pool cleanup and protected face/HP regions. Not a gameplay cohort.',cases:[],controls:[],shots:[],sheets:[],errors:[],http:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('request',r=>{if(offline&&/^https?:/.test(r.url()))report.http.push(r.url());});
 await page.goto(offline?'file://'+root+'/docs/cardrpg-c/vfx.html':'http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');
 await page.waitForFunction(()=>window.vfxGallery?.scene.ready&&window.vfxGallery.scene.audit().stage.source==='painted');await page.evaluate(()=>window.vfxGallery.manual(true));
 for(const[width,height]of [[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});const sheet=[];
  for(const id of ids)for(const reduced of pilot?[false]:[false,true])for(const speed of pilot?[1]:[1,2,3]){
   await page.locator('#choose').selectOption(id);await page.locator('#motion').setChecked(reduced);await page.locator('#speed').selectOption(String(speed));
   await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
   const contact=await page.evaluate(({speed})=>{
    const g=window.vfxGallery,s=g.scene,fx=s.effects,plan=g.fixture.plan;s.eventAudit.length=0;
    const before=JSON.stringify(g.fixture.battle),step=1000/60*speed,hit=plan.beats[2].start;let draws=0,impacts=0,last=0;
    for(let at=0;at<=hit+220;at+=step){g.sample(at,3+at/1000);last=at;draws=Math.max(draws,s.stats.calls+fx.stats.draws);impacts=Math.max(impacts,fx.stats.impacts);}
    let opaque=0;const c=fx.canvas.getContext('2d'),check=(x,y,w,h)=>{const d=c.getImageData(x,y,w,h).data;for(let i=3;i<d.length;i+=4)if(d[i])opaque++;};
    for(const a of g.view.actors){const p=s.socket(a.id,'head');if(p&&a.hp>0)check(Math.round(p.x)-2,Math.round(p.y)-2,4,4);}
    for(const b of s.labelAudit.cards)check(Math.round(b.x+1),Math.round(b.y+1),Math.max(1,Math.floor(b.width-2)),Math.max(1,Math.floor(b.height-2)));
    const painted=fx.pool.filter(p=>p.active&&p.impact&&p.born<=g.view.fixedTime).map(p=>({target:p.target,glyph:p.layer.glyph,size:p.layer.size,group:p.layer.recipients??p.layer.anchor}));
    return{before,step,last,draws,impacts,opaque,active:fx.stats.active,overlaps:s.labelAudit.overlaps,damage:plan.events.some(e=>e.actorId===plan.actorId&&e.type==='damage'),painted,legal:g.fixture.battle.choices.length===1&&g.fixture.battle.choices[0].skillId===plan.skillId};
   },{speed});
   if(contact.opaque||contact.overlaps||contact.draws>150||!contact.active||!contact.legal||contact.damage!==!!contact.impacts)throw Error('Ultimate contract '+JSON.stringify({id,width,reduced,speed,contact}));
   if(!reduced&&speed===1&&(!offline||selected.includes(id))){
    const file=`${id}-${width}.webp`,frame=await page.screenshot();
    if(selected.includes(id)){await sharp(frame).webp({quality:86}).toFile(resolve(out,file));report.shots.push({file,width,height,id});}
    if(!offline)sheet.push({id,frame:await sharp(frame).resize(640,400,{fit:'contain',background:'#322730'}).png().toBuffer()});
   }
   const tail=await page.evaluate(contact=>{const g=window.vfxGallery,s=g.scene;for(let at=contact.last+contact.step;at<=g.fixture.plan.duration+2600;at+=contact.step)g.sample(at,3+at/1000);return{late:s.effects.stats.active,drops:s.effects.stats.dropped,hits:s.eventAudit.filter(e=>e.name==='hit').length,unchanged:contact.before===JSON.stringify(g.fixture.battle)};},contact);
   if(tail.late||tail.drops||tail.hits!==1||!tail.unchanged)throw Error('Ultimate cleanup '+JSON.stringify({id,tail}));
   report.cases.push({id,width,height,reduced,speed,contact:{...contact,before:undefined},tail});
  }
  if(offline){
   await page.locator('#motion').uncheck();await page.locator('#speed').selectOption('1');await page.locator('#choose').selectOption('panko-4');await page.evaluate(()=>window.vfxGallery.manual(false));
   await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.effects.pool.some(p=>p.active&&p.layer?.core&&p.born<g.view.fixedTime&&g.view.fixedTime-p.born<p.life*.7);});await page.locator('#pause').click();
   await page.evaluate(()=>{const g=window.vfxGallery,fx=g.scene.effects,c=fx.canvas;window.ultimateFrozen={time:g.view.fixedTime,plan:g.fixture.plan,cache:[...fx.stamps.sprites.values()],pool:[...fx.pool],pixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data};});await page.waitForTimeout(120);
   const frozen=await page.evaluate(()=>{const g=window.vfxGallery,c=g.scene.effects.canvas,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return g.view.fixedTime===window.ultimateFrozen.time&&d.every((v,i)=>v===window.ultimateFrozen.pixels[i]);});
   await page.locator('#pause').click();await page.waitForFunction(()=>window.vfxGallery.fixture.plan!==window.ultimateFrozen.plan);
   const reused=await page.evaluate(()=>{const fx=window.vfxGallery.scene.effects;return [...fx.stamps.sprites.values()].every((v,i)=>v===window.ultimateFrozen.cache[i])&&fx.pool.length===256&&fx.pool.every((p,i)=>p===window.ultimateFrozen.pool[i]);});await page.evaluate(()=>window.vfxGallery.manual(true));
   report.controls.push({width,height,frozen,reused});if(!frozen||!reused)throw Error('Pause/cache reuse');
  }
  for(let from=0;from<sheet.length;from+=6){
   const chunk=sheet.slice(from,from+6),cells=chunk.flatMap((s,i)=>{const left=i%2*640,top=Math.floor(i/2)*430;return[{input:s.frame,left,top},{input:Buffer.from(`<svg width="640" height="30"><rect width="640" height="30" fill="#322730"/><text x="12" y="21" font-family="sans-serif" font-size="17" fill="#f8e5c4">${width} · ${s.id} · contact +220ms</text></svg>`),left,top:top+400}];});
   const file=`sheet-${width}-${from}.webp`;await sharp({create:{width:1280,height:Math.ceil(chunk.length/2)*430,channels:4,background:'#322730'}}).composite(cells).webp({quality:84}).toFile(resolve(out,file));report.sheets.push(file);
  }
 }
 if(report.errors.length||report.http.length)throw Error(JSON.stringify({errors:report.errors,http:report.http}));report.complete=true;
 console.log(JSON.stringify({cases:report.cases.length,controls:report.controls.length,shots:report.shots.length,sheets:report.sheets.length,draws:Math.max(...report.cases.map(c=>c.contact.draws)),errors:report.errors,http:report.http}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
