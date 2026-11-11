/** Rebuilt offline camera, socket masks and real Pause/Play at x1/x2/x3. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c11-framing-offline';if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid tag');
const out=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(out,{recursive:true});
const slots=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/spine/slots.json'),'utf8'));
const ids=slots.units.filter(u=>u.side==='party').map(u=>u.skills.find(s=>s.id.endsWith('-4')).id);
const report={method:'Twelve ultimate previews in rebuilt offline renderer, both sizes/motion modes/x1-x3; real Pause/Play/loop. No progression or frame-time claim.',cases:[],controls:[],shots:[],errors:[],http:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))report.http.push(r.url());});
 await page.goto('file://'+root+'/docs/cardrpg-c/vfx.html');await page.waitForFunction(()=>window.vfxGallery?.scene.ready&&window.vfxGallery.scene.audit().stage.source==='painted');await page.evaluate(()=>window.vfxGallery.manual(true));
 for(const [width,height]of [[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const id of ids)for(const reduced of [false,true])for(const speed of [1,2,3]){
   await page.locator('#choose').selectOption(id);await page.locator('#motion').setChecked(reduced);await page.locator('#speed').selectOption(String(speed));
   await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
   const result=await page.evaluate(({speed})=>{
    const g=window.vfxGallery,s=g.scene,fx=s.effects,plan=g.fixture.plan,vec=s.scratch.clone(),before=JSON.stringify(g.fixture.battle);
    s.eventAudit.length=0;let min=Infinity,zoom=1,shift=0,draws=0,overlaps=0,opaque=0,collision=0,maskSamples=0;
    const step=1000/60*speed,hit=plan.beats[2].start,intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
    for(let at=0;at<=plan.duration+400;at+=step){
     g.sample(at,3+at/1000);zoom=Math.max(zoom,s.camera.zoom);shift=Math.max(shift,Math.abs(s.camera.position.x));draws=Math.max(draws,s.stats.calls+fx.stats.draws);overlaps=Math.max(overlaps,s.labelAudit.overlaps);
     const size=s.sizeAudit();for(const {actor} of s.actors.values()){
      const b=actor.mesh?.skeleton.getBoundsRect()??actor.bounds;
      const a=actor.root.localToWorld(vec.set(b.x,b.y,0)).project(s.camera),x=(a.x*.5+.5)*size.width,y=(.5-a.y*.5)*size.height;
      const c=actor.root.localToWorld(vec.set(b.x+b.width,b.y+b.height,0)).project(s.camera),xx=(c.x*.5+.5)*size.width,yy=(.5-c.y*.5)*size.height;
      min=Math.min(min,x,xx,y,yy,size.width-x,size.width-xx,size.height-y,size.height-yy);
     }
     if(at>hit+150&&at<hit+150+step*1.01){
      maskSamples++;const ctx=fx.canvas.getContext('2d'),check=(x,y,w,h)=>{const d=ctx.getImageData(x,y,w,h).data;for(let i=3;i<d.length;i+=4)if(d[i])opaque++;};
      for(const a of g.view.actors){const h=s.socket(a.id,'head');if(h&&a.hp>0)check(Math.round(h.x)-2,Math.round(h.y)-2,4,4);}
      for(const b of s.labelAudit.cards)check(Math.round(b.x+1),Math.round(b.y+1),Math.max(1,Math.floor(b.width-2)),Math.max(1,Math.floor(b.height-2)));
      const hp=s.anchors.filter(a=>a.visible).map(a=>({x:a.labelX-69,y:a.labelY,width:138,height:52}));
      collision=s.numbers.drawn.flatMap(n=>[...s.labelAudit.heads,...hp].filter(b=>intersects(n,b))).length;
     }
    }
    return{min,zoom,shift,draws,overlaps,opaque,collision,maskSamples,unchanged:before===JSON.stringify(g.fixture.battle),hits:s.eventAudit.filter(e=>e.name==='hit').length,dropped:fx.stats.dropped};
   },{speed});
   report.cases.push({id,width,height,reduced,speed,...result});
   if(result.min<3||result.zoom>1.15||result.draws>150||result.overlaps||result.opaque||result.collision||!result.maskSamples||!result.unchanged||result.hits!==1||result.dropped||reduced&&(result.zoom!==1||result.shift))throw Error('Offline camera '+JSON.stringify(report.cases.at(-1)));
   if(['inkcap-4','marigold-4'].includes(id)&&speed===1){
    await page.evaluate(()=>{const g=window.vfxGallery,plan=g.fixture.plan;g.select(plan.skillId);for(let at=0;at<=g.fixture.plan.beats[2].start+160;at+=1000/60)g.sample(at,8+at/1000);});
    const file=`${id}-${reduced?'calm':'motion'}-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({file,width,height});
   }
  }
  await page.locator('#motion').uncheck();
  for(const speed of [1,2,3]){
   await page.locator('#choose').selectOption('inkcap-4');await page.locator('#speed').selectOption(String(speed));await page.evaluate(()=>window.vfxGallery.manual(false));
   await page.waitForFunction(()=>window.vfxGallery.scene.camera.zoom>1.02);await page.locator('#pause').click();
   await page.evaluate(()=>{const g=window.vfxGallery,s=g.scene,c=s.effects.canvas;window.frozenCamera={time:g.view.fixedTime,plan:g.fixture.plan,zoom:s.camera.zoom,x:s.camera.position.x,pixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data};});await page.waitForTimeout(140);
   const frozen=await page.evaluate(()=>{const g=window.vfxGallery,s=g.scene,c=s.effects.canvas,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,f=window.frozenCamera;return g.view.fixedTime===f.time&&s.camera.zoom===f.zoom&&s.camera.position.x===f.x&&d.every((n,i)=>n===f.pixels[i]);});
   await page.locator('#pause').click();await page.waitForFunction(()=>{const g=window.vfxGallery;return g.fixture.plan!==window.frozenCamera.plan&&g.view.fixedTime>window.frozenCamera.time;});await page.evaluate(()=>window.vfxGallery.manual(true));
   report.controls.push({width,height,speed,frozen,loop:true});if(!frozen)throw Error('Camera pause moved');
  }
 }
 if(report.errors.length||report.http.length)throw Error(JSON.stringify({errors:report.errors,http:report.http}));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,controls:report.controls.length,min:Math.min(...report.cases.map(c=>c.min)),draws:Math.max(...report.cases.map(c=>c.draws)),errors:report.errors,http:report.http}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
