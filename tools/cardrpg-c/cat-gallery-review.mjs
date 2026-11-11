/** Source/offline cat previews share current rules and preserve split recipient paint. */
import {createRequire} from 'node:module';import {mkdir,readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const offline=process.argv.includes('--offline'),tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c11-cat-'+(offline?'offline':'source');
if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid output tag');
const out=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(out,{recursive:true});
const slots=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/spine/slots.json'),'utf8')),ids=slots.units.filter(u=>u.side==='party').flatMap(u=>u.skills.map(s=>s.id));
const report={method:'48 legal cat gallery actions, both sizes/motion modes/x1-x3, actual Pause/Play/loop. Source and rebuilt offline use the same battle renderer. No frame-time claim.',cases:[],controls:[],shots:[],errors:[],http:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('request',r=>{if(offline&&/^https?:/.test(r.url()))report.http.push(r.url());});
 await page.goto(offline?'file://'+root+'/docs/cardrpg-c/vfx.html':'http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');
 await page.waitForFunction(()=>window.vfxGallery?.scene.ready&&window.vfxGallery.scene.audit().stage.source==='painted');await page.evaluate(()=>window.vfxGallery.manual(true));
 for(const [width,height]of [[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const id of ids)for(const reduced of [false,true])for(const speed of [1,2,3]){
   await page.locator('#choose').selectOption(id);await page.locator('#motion').setChecked(reduced);await page.locator('#speed').selectOption(String(speed));
   await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
   const contact=await page.evaluate(({speed})=>{
    const g=window.vfxGallery,s=g.scene,fx=s.effects,plan=g.fixture.plan;s.eventAudit.length=0;
    const before=JSON.stringify(g.fixture.battle),step=1000/60*speed,hit=plan.beats[2].start;let shake=0,impacts=0,draws=0,last=0;
    for(let at=0;at<=hit+220;at+=step){g.sample(at,3+at/1000);last=at;shake=Math.max(shake,Math.abs(s.camera.position.x));impacts=Math.max(impacts,fx.stats.impacts);draws=Math.max(draws,s.stats.calls+fx.stats.draws);}
    const own=fx.pool.filter(p=>p.active&&p.born<=g.view.fixedTime&&p.impact),damage=plan.events.some(e=>e.type==='damage');
    const recipients=type=>[...new Set(plan.events.filter(e=>e.actorId===plan.actorId&&e.type===type).flatMap(e=>e.targetIds))];
    const healing=[...new Set(own.filter(p=>p.layer.recipients==='heal').map(p=>p.target))],shields=[...new Set(own.filter(p=>p.layer.recipients==='shield').map(p=>p.target))];
    const c=fx.canvas.getContext('2d');let opaque=0;const check=(x,y,w,h)=>{const d=c.getImageData(x,y,w,h).data;for(let i=3;i<d.length;i+=4)if(d[i])opaque++;};
    for(const a of g.view.actors){const h=s.socket(a.id,'head');if(h&&a.hp>0)check(Math.round(h.x)-2,Math.round(h.y)-2,4,4);}
    for(const b of s.labelAudit.cards)check(Math.round(b.x+1),Math.round(b.y+1),Math.max(1,Math.floor(b.width-2)),Math.max(1,Math.floor(b.height-2)));
    const stage=document.querySelector('#stage').getBoundingClientRect();
    return{before,step,last,shake,impacts,draws,active:fx.stats.active,opaque,overlaps:s.labelAudit.overlaps,damage,healing,shields,heal:recipients('heal'),shield:recipients('shield'),own:own.map(p=>({target:p.target,glyph:p.layer.glyph,group:p.layer.recipients??p.layer.anchor})),numbers:s.numbers.drawn.map(n=>({id:n.id,text:n.text})),hurt:[...s.actors].filter(([,a])=>a.hurtAt>=3).map(([id])=>id),overflow:document.documentElement.scrollWidth>innerWidth,stageVisible:stage.top>=0&&stage.bottom<=innerHeight,legal:g.fixture.battle.choices.length===1&&g.fixture.battle.choices[0].skillId===plan.skillId};
   },{speed});
   const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
   if(!contact.active||contact.opaque||contact.overlaps||contact.draws>150||contact.overflow||!contact.stageVisible||!contact.legal)throw Error('Gallery contract '+JSON.stringify({id,width,speed,reduced,contact}));
   if(contact.damage&&(!contact.impacts||!reduced&&!contact.shake)||(!contact.damage||reduced)&&contact.shake||!contact.damage&&contact.impacts)throw Error('Damage semantics '+JSON.stringify({id,contact}));
   if(contact.damage&&(!same(contact.heal,contact.healing)||!same(contact.shield,contact.shields)))throw Error('Mixed support '+JSON.stringify({id,contact}));
   if(id==='marigold-3'&&(contact.hurt.length||!contact.own.some(p=>p.group==='target')||contact.numbers.some(n=>n.text.startsWith('−'))))throw Error('Debuff contact '+JSON.stringify(contact));
   if(speed===1&&['mochi-1','clover-1','cinnamon-1','marigold-3','cinnamon-4'].includes(id)&&(!reduced||id==='clover-1')){const file=`${id}-${reduced?'calm':'motion'}-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({file,width,height});}
   const tail=await page.evaluate(contact=>{const g=window.vfxGallery,s=g.scene;for(let at=contact.last+contact.step;at<=g.fixture.plan.duration+2400;at+=contact.step)g.sample(at,3+at/1000);return{late:s.effects.stats.active,drops:s.effects.stats.dropped,hits:s.eventAudit.filter(e=>e.name==='hit').length,unchanged:contact.before===JSON.stringify(g.fixture.battle)};},contact);
   report.cases.push({id,width,height,reduced,speed,contact:{...contact,before:undefined},tail});if(tail.late||tail.drops||tail.hits!==1||!tail.unchanged)throw Error('Gallery cleanup '+JSON.stringify(tail));
  }
  await page.locator('#motion').uncheck();
  for(const speed of [1,2,3]){
   await page.locator('#choose').selectOption('clover-1');await page.locator('#speed').selectOption(String(speed));await page.evaluate(()=>window.vfxGallery.manual(false));
   await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.effects.pool.some(p=>p.active&&p.impact&&p.layer?.recipients==='heal'&&p.born<g.view.fixedTime);});await page.locator('#pause').click();
   await page.evaluate(()=>{const g=window.vfxGallery,c=g.scene.effects.canvas;window.catFrozen={time:g.view.fixedTime,plan:g.fixture.plan,pixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data};});await page.waitForTimeout(120);
   const frozen=await page.evaluate(()=>{const g=window.vfxGallery,c=g.scene.effects.canvas,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return g.view.fixedTime===window.catFrozen.time&&d.every((n,i)=>n===window.catFrozen.pixels[i]);});
   await page.locator('#pause').click();await page.waitForFunction(()=>{const g=window.vfxGallery;return g.fixture.plan!==window.catFrozen.plan&&g.view.fixedTime>window.catFrozen.time;});
   const loop=await page.evaluate(()=>{const g=window.vfxGallery;return g.fixture.battle.choices.length===1&&g.fixture.plan.events.some(e=>e.type==='heal'&&e.targetIds.some(id=>id!==g.fixture.plan.actorId));});
   await page.evaluate(()=>window.vfxGallery.manual(true));report.controls.push({width,height,speed,frozen,loop});if(!frozen||!loop)throw Error('Pause/loop');
  }
 }
 if(report.errors.length||report.http.length)throw Error(JSON.stringify({errors:report.errors,http:report.http}));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,controls:report.controls.length,draws:Math.max(...report.cases.map(c=>c.contact.draws)),errors:report.errors,http:report.http}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
