/** Exercise optional VFX cast/hit timing against actual actor clips; no installed export edits. */
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),out='/tmp/cardrpg-c-vfx-override-cue-'+(baseline?'before':'after');await mkdir(out,{recursive:true});
const fixture=JSON.parse(await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.json')));fixture.bones[0].y=-256;fixture.animations.effect=fixture.animations.attack;
const atlas=(await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.atlas'),'utf8')).replaceAll('mochi.png','pollen-scout.png'),png=await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.png'));
const report={method:'C2 parser fixture served at unused published URLs, selected as a temporary sequence/Spine override. Real scene clip events and presentation clocks, both sizes/x1-x3/motion modes; no registry, source or combat writes.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto('http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');await page.waitForFunction(()=>window.vfxGallery?.scene.ready);
  const urls=await page.evaluate(async()=>{
   window.vfxGallery.manual(true);const A=await import('/src/game/cardrpg/spine/assets.ts'),C=await import('/src/game/cardrpg/spine/config.ts'),base=C.SPINE_UNIT_BY_ID.get('pollen-scout').placeholder;
   window.cueSpec={...base,width:256,height:512,scale:.5,socket:'feet',animation:'effect',fps:1,frames:[base.atlas.replace(/\.atlas$/,'.png')]};window.cueSkills=C.SPINE_SKILLS;
   return Object.fromEntries(['atlas','skeleton'].map(key=>[key,new URL(A.spineAssetUrl(base[key]),location.href).href]).concat([['image',new URL(A.spineAssetUrl(base.atlas.replace(/\.atlas$/,'.png')),location.href).href]]));
  });
  await page.route(urls.atlas,route=>route.fulfill({contentType:'text/plain',body:atlas}));await page.route(urls.image,route=>route.fulfill({contentType:'image/png',body:png}));await page.route(urls.skeleton,route=>route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)}));
  for(const id of baseline?['mochi-1','enemy:needle-moth:basic']:['mochi-1','enemy:needle-moth:basic','soot-2','mochi-4']){
   await page.locator('#choose').selectOption(id);await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
   for(const format of baseline?['sequence']:['sequence','spine'])for(const requested of baseline?['cast']:['cast','hit'])for(const reduced of baseline?[false]:[false,true])for(const speed of baseline?[1]:[1,2,3]){
    const result=await page.evaluate(async({format,requested,reduced,speed})=>{
     const g=window.vfxGallery,s=g.scene,fx=s.effects.overrides,plan=g.fixture.plan,id=plan.presentationId??plan.skillId,a=s.actors.get(plan.actorId).actor,name=window.cueSkills.get(id).animation,cues=a.cues(name),cue=cues.find(c=>c.name===requested)??cues.find(c=>c.name==='hit');
     await fx.prepare({[id]:{...window.cueSpec,format,cue:requested}});const effect=fx.effects.get(id);if(!effect)throw Error(fx.warnings.join('\n'));
     g.setSpeed(speed);g.view.reducedMotion=reduced;document.querySelector('#motion').checked=reduced;document.querySelector('#motion').dispatchEvent(new Event('change'));g.select(id);g.sample(0,3);s.eventAudit.length=0;
     const before=JSON.stringify(g.fixture.battle),players=effect.players.slice(),step=1000/60*speed;let seen=[],last=0,peak=0,firstAt,shotAt;
     for(let at=0;at<=plan.duration+1200;at+=step){
      g.sample(at,3+at/1000);last=at;peak=Math.max(peak,fx.stats.active);
      if(fx.stats.active&&firstAt===undefined){firstAt=at;shotAt=at;seen=players.filter(p=>p.active).map(p=>p.target);}
     }
     const events=s.eventAudit.map(e=>({name:e.name,at:e.elapsed})),expectedEvent=events.find(e=>e.name===cue?.name),expectedTargets=requested==='cast'?[g.fixture.plan.actorId]:s.effects.targets.slice(),expired=fx.stats.active===0;
     const pass=firstAt!==undefined&&firstAt===expectedEvent?.at&&JSON.stringify(seen)===JSON.stringify(expectedTargets)&&expired&&!s.labelAudit.overlaps&&before===JSON.stringify(g.fixture.battle)&&players.every((p,i)=>p===effect.players[i]);
     if(shotAt!==undefined){g.select(id);for(let at=0;at<=shotAt+step;at+=step)g.sample(at,6+at/1000);}
     document.querySelector('#detail').textContent='QA fixture · '+requested+' on '+name+' · no designer export installed';
     return {id,format,requested,reduced,speed,name,cues,events,firstAt,expectedEvent,seen,expectedTargets,expired,peak,overlaps:s.labelAudit.overlaps,unchanged:before===JSON.stringify(g.fixture.battle),warnings:fx.warnings.slice(),pass};
    },{format,requested,reduced,speed});report.cases.push({width,height,...result});
    if(!baseline&&!result.pass)throw Error('Override cue '+JSON.stringify(report.cases.at(-1)));
    if(id==='mochi-1'&&format==='sequence'&&requested==='cast'&&!reduced&&speed===1){const file='cue-'+width+'.webp';await sharp(await page.screenshot()).webp({quality:82}).toFile(resolve(out,file));report.shots.push({file,width,height});}
   }
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,failed:report.cases.filter(c=>!c.pass).length,shots:report.shots.length,errors:report.errors,out}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
