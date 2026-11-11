/** Measure accepted effect dimensions against the battle camera, not character head proportions. */
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),zoom=process.argv.includes('--zoom'),out='/tmp/cardrpg-c-vfx-scale-'+(baseline?'before':zoom?'zoom':'after');await mkdir(out,{recursive:true});
const fixture=JSON.parse(await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.json')));fixture.bones[0].y=-256;fixture.animations.effect=fixture.animations.attack;
const atlas=(await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.atlas'),'utf8')).replaceAll('mochi.png','pollen-scout.png'),png=await readFile(resolve(root,'tools/cardrpg-look/spine/fixtures/pass/mochi.png'));
const report={method:'Same centered256×512 C2 effect at scale0.5 through PNG and Spine; small/boss encounters, every target, ordinary/lowered head sockets, x1–x3, both sizes. Compare real composite bounds to independently projected world units; no registry or designer-source writes.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto('http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');await page.waitForFunction(()=>window.vfxGallery?.scene.ready);
  await page.evaluate(()=>window.vfxGallery.manual(true));
  const urls=await page.evaluate(async()=>{
   const A=await import('/src/game/cardrpg/spine/assets.ts'),C=await import('/src/game/cardrpg/spine/config.ts'),base=C.SPINE_UNIT_BY_ID.get('pollen-scout').placeholder;
   window.fixtureSpec={...base,width:256,height:512,scale:.5,socket:'feet',cue:'hit',animation:'effect',fps:1,frames:[base.atlas.replace(/\.atlas$/,'.png')]};
   return Object.fromEntries(['atlas','skeleton'].map(key=>[key,new URL(A.spineAssetUrl(base[key]),location.href).href]).concat([['image',new URL(A.spineAssetUrl(base.atlas.replace(/\.atlas$/,'.png')),location.href).href]]));
  });
  await page.route(urls.atlas,route=>route.fulfill({contentType:'text/plain',body:atlas}));await page.route(urls.image,route=>route.fulfill({contentType:'image/png',body:png}));await page.route(urls.skeleton,route=>route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)}));
  for(const encounter of ['enemy:needle-moth','enemy:yarn-giant']){
   await page.locator('#choose').selectOption(encounter);await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
   for(const format of ['sequence','spine']){
    const cases=await page.evaluate(async({format,encounter,zoom})=>{
     const T=await import('/node_modules/.vite/deps/three.js'),g=window.vfxGallery,s=g.scene,effects=s.effects,fx=effects.overrides;
     await fx.prepare({'mochi-1':{...window.fixtureSpec,format}});const effect=fx.effects.get('mochi-1');if(!effect)throw Error(fx.warnings.join('\n'));
     const original=effects.ctx.drawImage,cases=[];let draw;
     effects.ctx.drawImage=function(image,...args){if(image===(format==='spine'?fx.renderer.domElement:effect.images[0]))draw=args;return original.call(this,image,...args);};
     try{
      for(const speed of (zoom?[1]:[1,2,3]))for(const headPose of ['normal','lowered'])for(const target of g.view.actors){
       g.setSpeed(speed);g.sample(0,5);if(zoom){s.camera.zoom=1.1;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();}const entry=s.actors.get(target.id),head=entry.actor.sockets.get('head'),saved=head.position.clone();
       if(headPose==='lowered')head.position.y*=.65;
       fx.clear();fx.emit('mochi-1','hit',target.id,5);draw=undefined;effects.render(g.view,5.2,s.width,s.height,s.labelAudit.cards);
       const point=s.socket(target.id,'feet'),low=entry.actor.root.localToWorld(new T.Vector3(0,0,0)).project(s.camera),high=entry.actor.root.localToWorld(new T.Vector3(0,512,0)).project(s.camera),px=Math.abs(high.y-low.y)*s.height/2/512;
       const extent=512*.5*px,expected={width:(format==='spine'?512:256)*.5*px,height:extent};
       const error=draw?Math.max(Math.abs(draw[2]-expected.width),Math.abs(draw[3]-expected.height),Math.abs(draw[0]+draw[2]/2-point.x),Math.abs(draw[1]+draw[3]/2-point.y)):Infinity;
       cases.push({encounter,format,speed,zoom:s.camera.zoom,headPose,target:entry.asset,tier:entry.actor.unit.tier,actual:draw,expected,error,pass:error<1e-5});head.position.copy(saved);
      }
     }finally{effects.ctx.drawImage=original;}
     g.sample(0,6);if(zoom){s.camera.zoom=1.1;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();s.renderer.render(s.scene,s.camera);}fx.clear();for(const actor of g.view.actors)fx.emit('mochi-1','hit',actor.id,6);effects.render(g.view,6.2,s.width,s.height,s.labelAudit.cards);
     document.querySelector('#detail').textContent='QA fixture · equal world dimensions at every foot · '+format+' · no designer export installed';return cases;
    },{format,encounter,zoom});
    report.cases.push(...cases.map(c=>({width,height,...c})));
    if(!baseline&&cases.some(c=>!c.pass))throw Error('Effect dimensions '+JSON.stringify(cases.find(c=>!c.pass)));
    if(format==='spine'&&encounter==='enemy:yarn-giant'){
     const file='scale-'+width+'.webp';await sharp(await page.screenshot()).webp({quality:82}).toFile(resolve(out,file));report.shots.push({file,width,height});
    }
   }
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,failed:report.cases.filter(c=>!c.pass).length,maxError:Math.max(...report.cases.map(c=>c.error)),shots:report.shots.length,errors:report.errors,out}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
