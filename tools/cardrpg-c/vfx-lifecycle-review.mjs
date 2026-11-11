/** Delayed designer-effect loads, disposal and real pooled playback; no registry/source edits. */
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),out='/tmp/cardrpg-c-vfx-lifecycle-'+(baseline?'before':'after');await mkdir(out,{recursive:true});
const fixture=JSON.parse(await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.json')));
fixture.bones[0].y=-256;fixture.animations.effect=fixture.animations.attack;
const atlas=(await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.atlas'),'utf8')).replaceAll('mochi.png','pollen-scout.png');
const png=await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.png'));
const report={method:'Read-only C2 parser fixture served in memory through a published unused placeholder URL. Dispose while skeleton response is held, count late WebGL contexts, then verify a fresh pool can render/reuse/expire at both sizes. Brown rectangle is a functional fixture, not designer art.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto('http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');await page.waitForFunction(()=>window.vfxGallery?.scene.ready);
  await page.evaluate(()=>{const g=window.vfxGallery;g.manual(true);g.sample(0,3);});
  const urls=await page.evaluate(async()=>{
   const A=await import('/src/game/cardrpg/spine/assets.ts'),C=await import('/src/game/cardrpg/spine/config.ts'),V=await import('/src/game/cardrpg/spine/vfx-overrides.ts');
   const base=C.SPINE_UNIT_BY_ID.get('pollen-scout').placeholder;
   window.VfxFixture=V.DesignerVfx;window.effectSpec={...base,format:'spine',width:256,height:512,scale:.5,socket:'feet',cue:'hit',animation:'effect'};
   return Object.fromEntries(['atlas','skeleton'].map(key=>[key,new URL(A.spineAssetUrl(base[key]),location.href).href]).concat([['image',new URL(A.spineAssetUrl(base.atlas.replace(/\.atlas$/,'.png')),location.href).href]]));
  });
  let release;const held=new Promise(yes=>{release=yes;});let requested=false;
  await page.route(urls.atlas,route=>route.fulfill({contentType:'text/plain',body:atlas}));
  await page.route(urls.image,route=>route.fulfill({contentType:'image/png',body:png}));
  await page.route(urls.skeleton,async route=>{requested=true;await held;return route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)});});
  await page.evaluate(()=>{
   window.oldContext=HTMLCanvasElement.prototype.getContext;window.contextsAfterClose=0;window.closedFx=false;
   HTMLCanvasElement.prototype.getContext=function(type,...rest){if(window.closedFx&&/^webgl/.test(type))window.contextsAfterClose++;return window.oldContext.call(this,type,...rest);};
   const fx=window.delayedFx=new window.VfxFixture();window.delayedReady=fx.prepare({fixture:window.effectSpec});
  });
  for(let i=0;i<100&&!requested;i++)await page.waitForTimeout(20);if(!requested)throw Error('Controlled skeleton was not requested');
  await page.evaluate(()=>{window.delayedFx.dispose();window.closedFx=true;});release();
  const disposed=await page.evaluate(async()=>{
   await window.delayedReady;const fx=window.delayedFx,renderer=fx.renderer;
   const result={lateContexts:window.contextsAfterClose,rendererPresent:!!renderer,contextLost:renderer?.getContext().isContextLost()??true,ready:fx.stats.ready,effects:fx.effects.size};
   HTMLCanvasElement.prototype.getContext=window.oldContext;renderer?.dispose();renderer?.forceContextLoss();return result;
  });
  const pass=disposed.lateContexts===0&&!disposed.rendererPresent&&disposed.ready===0&&disposed.effects===0;report.cases.push({width,height,kind:'disposed',...disposed,pass});
  if(!baseline&&!pass)throw Error('Delayed VFX '+JSON.stringify(disposed));
  if(!baseline){
   const playback=await page.evaluate(async()=>{
    const g=window.vfxGallery,fx=g.scene.effects.overrides;await fx.prepare({'mochi-1':window.effectSpec});const effect=fx.effects.get('mochi-1'),players=effect?.players.slice();
    if(!effect)throw Error(fx.warnings.join('\n'));const id=g.view.actors[0].id;
    fx.clear();const wrongCue=fx.emit('mochi-1','cast',id,5),started=fx.emit('mochi-1','hit',id,5);let draws=0,visiblePixels=0;
    fx.render(5.2,image=>{draws++;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const bytes=ctx.getImageData(0,0,512,512).data;for(let i=3;i<bytes.length;i+=4)if(bytes[i]>0)visiblePixels++;});
    const time=players[0].at;fx.render(5.2,()=>{});const frozen=players[0].at===time;fx.render(5.75,()=>{});const expired=fx.stats.active===0;
    const restarted=fx.emit('mochi-1','hit',id,6),reused=players.every((p,i)=>p===effect.players[i]);
    g.sample(0,6.2);const point=g.scene.socket(id,'feet'),overlaps=g.scene.labelAudit.overlaps;
    document.querySelector('#detail').textContent='QA fixture at feet · temporary brown rectangle · no designer export installed';
    return{wrongCue,started,draws,visiblePixels,frozen,expired,restarted,reused,overlaps,point,ready:fx.stats.ready,active:fx.stats.active,warnings:fx.warnings};
   });
   const valid=!playback.wrongCue&&playback.started&&playback.draws===1&&playback.visiblePixels>0&&playback.frozen&&playback.expired&&playback.restarted&&playback.reused&&!playback.overlaps&&playback.ready===1&&playback.active===1&&!playback.warnings.length;
   report.cases.push({width,height,kind:'playback',...playback,pass:valid});if(!valid)throw Error('VFX playback '+JSON.stringify(playback));
   const file='fixture-'+width+'.webp';await sharp(await page.screenshot()).webp({quality:82}).toFile(resolve(out,file));report.shots.push({file,width,height});
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,failed:report.cases.filter(c=>!c.pass).length,shots:report.shots.length,errors:report.errors,out}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
