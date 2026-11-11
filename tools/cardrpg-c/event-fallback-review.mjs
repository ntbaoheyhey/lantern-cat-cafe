/** Exercise accepted WARN timing through the real scene; edit only isolated in-memory clip metadata. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),out='/tmp/cardrpg-c-event-fallback-'+(baseline?'before':'after');
await mkdir(out,{recursive:true});
const report={method:'Isolated legal Mochi/Soot ultimate previews with authored hit metadata replaced in memory: late/negative/NaN/Infinity and valid repeated hits. Both sizes, motion settings and x1-x3. No delivered file or gameplay account changed.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');
 await page.waitForFunction(()=>window.vfxGallery?.scene.ready);
 await page.evaluate(async()=>{window.reviewCues=(await import('/src/game/cardrpg/spine/events.ts')).animationCues;window.vfxGallery.manual(true);});
 for(const [width,height] of [[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const id of ['mochi-4','soot-4'])for(const variant of baseline?['late']:['late','negative','nan','infinity','multiple'])for(const reduced of baseline?[false]:[false,true])for(const speed of baseline?[1]:[1,2,3]){
   await page.locator('#choose').selectOption(id);await page.locator('#motion').setChecked(reduced);await page.locator('#speed').selectOption(String(speed));
   await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
   const contact=await page.evaluate(({variant,speed})=>{
    const g=window.vfxGallery,s=g.scene,a=s.actors.get(g.fixture.plan.actorId).actor,old=a.clips.get('ult'),duration=old.duration;
    const time=variant==='late'?duration+1:variant==='negative'?-.2:variant==='nan'?NaN:Infinity;
    const authored=old.cues.filter(c=>c.name!=='hit').map(c=>({name:c.name,time:c.time}));
    authored.push(...(variant==='multiple'?[{name:'hit',time:duration*.4},{name:'hit',time:duration*.7}]:[{name:'hit',time}]));
    a.clips.set('ult',{duration,cues:window.reviewCues('ult',duration,authored)});s.eventAudit.length=0;
    const before=JSON.stringify(g.fixture.battle),step=1000/60*speed,hit=g.fixture.plan.beats[2].start;let last=0,draws=0;
    for(let at=0;at<=hit+220;at+=step){g.sample(at,3+at/1000);last=at;draws=Math.max(draws,s.stats.calls+s.effects.stats.draws);}
    window.eventRestore={a,old,before,step,last};return{hit,step,last,draws,firstHit:s.firstHit,overlaps:s.labelAudit.overlaps};
   },{variant,speed});
   if(!baseline&&variant==='late'&&speed===1&&!reduced&&id==='mochi-4'){
    const file=`fallback-${width}.webp`;await sharp(await page.screenshot()).webp({quality:82}).toFile(resolve(out,file));report.shots.push({file,width,height});
   }
   const tail=await page.evaluate(()=>{
    const g=window.vfxGallery,s=g.scene,r=window.eventRestore;
    try{for(let at=r.last+r.step;at<=g.fixture.plan.duration+2600;at+=r.step)g.sample(at,3+at/1000);
     return{hits:s.eventAudit.filter(e=>e.name==='hit').map(e=>({elapsed:e.elapsed,fallback:e.fallback})),events:s.eventAudit.map(e=>e.name),ultimate:s.ultimate,active:s.effects.stats.active,drops:s.effects.stats.dropped,unchanged:r.before===JSON.stringify(g.fixture.battle)};
    }finally{r.a.clips.set('ult',r.old);}
   });
   const pass=contact.firstHit&&!contact.overlaps&&contact.draws<=150&&tail.hits.length===(variant==='multiple'?2:1)&&tail.hits.every(h=>h.fallback===(variant!=='multiple'))&&tail.hits[0]?.elapsed>=contact.hit-.001&&tail.hits[0]?.elapsed<=contact.hit+contact.step+.001&&!tail.ultimate&&!tail.active&&!tail.drops&&tail.unchanged;
   report.cases.push({width,height,id,variant,reduced,speed,contact,tail,pass});
   if(!baseline&&!pass)throw Error('Event fallback '+JSON.stringify(report.cases.at(-1)));
  }
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
 console.log(JSON.stringify({cases:report.cases.length,failed:report.cases.filter(c=>!c.pass).length,shots:report.shots.length,errors:report.errors,out}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report)+'\n');await browser.close();}
