/** Repeated multi-recipient contacts with a legal long effect, through the actual clip cursor. */
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),out='/tmp/cardrpg-c-vfx-pool-'+(baseline?'before':'after');await mkdir(out,{recursive:true});
const fixture=JSON.parse(await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.json')));fixture.bones[0].y=-256;fixture.animations.effect={bones:{root:{translate:[{time:0},{time:10}]}}};
const atlas=(await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.atlas'),'utf8')).replaceAll('mochi.png','pollen-scout.png'),png=await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.png'));
const report={method:'Temporary C2 rectangle, legal ten-second sequence/Spine override on Mochi ultimate with four in-memory authored hit cues. Three friendly recipients per contact exceed eight pooled players. Check each recipient receives every new contact, then expire/reuse before a render. No source/registry/combat writes.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto('http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');await page.waitForFunction(()=>window.vfxGallery?.scene.ready);
  await page.locator('#choose').selectOption('mochi-4');await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
  const urls=await page.evaluate(async()=>{
   const g=window.vfxGallery;g.manual(true);const A=await import('/src/game/cardrpg/spine/assets.ts'),C=await import('/src/game/cardrpg/spine/config.ts'),E=await import('/src/game/cardrpg/spine/events.ts'),base=C.SPINE_UNIT_BY_ID.get('pollen-scout').placeholder;
   window.poolSpec={...base,width:256,height:512,scale:.5,socket:'feet',cue:'hit',animation:'effect',fps:1,frames:Array(10).fill(base.atlas.replace(/\.atlas$/,'.png'))};window.poolCues=E.animationCues;
   return Object.fromEntries(['atlas','skeleton'].map(key=>[key,new URL(A.spineAssetUrl(base[key]),location.href).href]).concat([['image',new URL(A.spineAssetUrl(base.atlas.replace(/\.atlas$/,'.png')),location.href).href]]));
  });
  await page.route(urls.atlas,route=>route.fulfill({contentType:'text/plain',body:atlas}));await page.route(urls.image,route=>route.fulfill({contentType:'image/png',body:png}));await page.route(urls.skeleton,route=>route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)}));
  for(const format of ['sequence','spine'])for(const reduced of baseline?[false]:[false,true])for(const speed of baseline?[1]:[1,2,3]){
   const result=await page.evaluate(async({format,reduced,speed})=>{
    const g=window.vfxGallery,s=g.scene,fx=s.effects.overrides,id='mochi-4';await fx.prepare({[id]:{...window.poolSpec,format}});const effect=fx.effects.get(id);if(!effect)throw Error(fx.warnings.join('\n'));
    const a=s.actors.get(g.fixture.plan.actorId).actor,original=a.clips.get('ult'),authored=original.cues.filter(c=>c.name!=='hit').concat([.4,.55,.7,.85].map(fraction=>({name:'hit',time:original.duration*fraction})));
    a.clips.set('ult',{...original,cues:window.poolCues('ult',original.duration,authored)});
    try{
     document.querySelector('#motion').checked=reduced;document.querySelector('#motion').dispatchEvent(new Event('change'));g.setSpeed(speed);g.select(id);g.sample(0,3);s.eventAudit.length=0;
     const before=JSON.stringify(g.fixture.battle),players=effect.players.slice(),step=1000/60*speed,contacts=[];let hits=0,peak=0;
     for(let at=step;at<=g.fixture.plan.duration+step;at+=step){
      const time=3+at/1000;g.sample(at,time);peak=Math.max(peak,fx.stats.active);const count=s.eventAudit.filter(e=>e.name==='hit').length;
      if(count!==hits){const targets=s.effects.targets.slice(),fresh=players.filter(p=>p.active&&p.born===time).map(p=>p.target);contacts.push({at,targets,fresh,pass:targets.every(id=>fresh.includes(id))});hits=count;}
     }
     const unchanged=before===JSON.stringify(g.fixture.battle),samePool=players.every((p,i)=>p===effect.players[i]),overlaps=s.labelAudit.overlaps;
     const targets=s.effects.targets.slice();fx.emit(id,'hit',targets,30);const freshAfterGap=players.filter(p=>p.active&&p.born===30).map(p=>p.target);s.effects.render(g.view,30.1,s.width,s.height,s.labelAudit.cards);
     const times=players.map(p=>p.at);s.effects.render(g.view,30.1,s.width,s.height,s.labelAudit.cards);const frozen=players.every((p,i)=>p.at===times[i]);
     fx.render(41,()=>{});const expired=fx.stats.active===0;
     fx.emit(id,'hit',targets,42);s.effects.render(g.view,42.1,s.width,s.height,s.labelAudit.cards);document.querySelector('#detail').textContent='QA fixture · repeated contact pool · '+format+' · no designer export installed';
     const pass=contacts.length===4&&contacts.every(c=>c.pass)&&targets.every(id=>freshAfterGap.includes(id))&&samePool&&players.length===8&&peak<=8&&unchanged&&!overlaps&&frozen&&expired;
     return {format,reduced,speed,contacts,freshAfterGap,targets,peak,samePool,allocated:players.length,overlaps,unchanged,frozen,expired,pass};
    }finally{a.clips.set('ult',original);}
   },{format,reduced,speed});report.cases.push({width,height,...result});
   if(!baseline&&!result.pass)throw Error('Effect pool '+JSON.stringify(report.cases.at(-1)));
   if(format==='spine'&&!reduced&&speed===1){const file='pool-'+width+'.webp';await sharp(await page.screenshot()).webp({quality:82}).toFile(resolve(out,file));report.shots.push({file,width,height});}
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,failed:report.cases.filter(c=>!c.pass).length,contacts:report.cases.reduce((n,c)=>n+c.contacts.length,0),shots:report.shots.length,errors:report.errors,out}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
