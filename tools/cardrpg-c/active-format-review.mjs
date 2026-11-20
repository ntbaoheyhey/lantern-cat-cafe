/** Exercise accepted-format selection with isolated in-memory slots; never install a delivery. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),out='/tmp/cardrpg-c-active-format-'+(baseline?'before':'after');await mkdir(out,{recursive:true});
const report={method:'In-memory Panko slot with both accepted formats; PNG frame flattened from the existing placeholder in memory. Both sizes, active sequence/designer/legacy/failed sequence/runtime-off. No designer delivery, published art or account changed.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]])for(const mode of baseline?['sequence']:['sequence','designer','legacy','failed-sequence','runtime-off']){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');await page.waitForFunction(()=>window.vfxGallery?.scene.ready);
  await page.evaluate(()=>window.vfxGallery.manual(true));
  const fixture=await page.evaluate(async mode=>{
   const T=await import('/node_modules/.vite/deps/three.js'),A=await import('/src/game/cardrpg/spine/assets.ts'),C=await import('/src/game/cardrpg/spine/config.ts');
   const unit=C.SPINE_UNIT_BY_ID.get('panko'),stub=C.SPINE_UNIT_BY_ID.get('pollen-scout'),actor=await A.loadSpineActor('panko','placeholder');
   const size=actor.bounds.height,w=Math.ceil(Math.max(Math.abs(actor.bounds.x),Math.abs(actor.bounds.x+actor.bounds.width))*2),renderer=new T.WebGLRenderer({alpha:true,preserveDrawingBuffer:true,antialias:true});
   const camera=new T.OrthographicCamera(-w/2,w/2,size,0,.1,1000);camera.position.z=100;renderer.setSize(w,Math.ceil(size));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
   const scene=new T.Scene();scene.add(actor.root);actor.sample('idle','flat',0,0,camera,false);renderer.render(scene,camera);
   const png=renderer.domElement.toDataURL('image/png'),sockets=Object.fromEntries(Object.entries(C.SPINE_CONFIG.sockets).map(([key,bone])=>{const p=actor.socket(key,new T.Vector3());return[bone,[p.x,p.y]];}));
   renderer.dispose();renderer.forceContextLoss();actor.dispose();
   const manifest={id:unit.id,facing:'right',width:w,height:size,scale:1,sockets,animations:Object.fromEntries(unit.animations.map(name=>{const spec=C.SPINE_CONFIG.animations[name],duration=(spec.seconds[0]+spec.seconds[1])/2;return[name,{fps:20,frames:Array(Math.round(duration*20)).fill('pollen-scout.png'),events:Object.entries(spec.events).map(([name,f])=>({name,time:f*duration}))}];}))};
   unit.designer=unit.placeholder;unit.sequence={format:'sequence',manifest:stub.placeholder.skeleton,scale:1};if(mode!=='legacy')unit.activeSource=mode==='designer'||mode==='runtime-off'?'designer':'sequence';
   if(mode==='runtime-off')history.replaceState(null,'',location.pathname+'?spineRuntime=0');
   return{manifest,png,jsonUrl:new URL(A.spineAssetUrl(stub.placeholder.skeleton),location.href).href,imageUrl:new URL(A.spineAssetUrl(stub.placeholder.atlas.replace(/\.atlas$/,'.png')),location.href).href};
  },mode);
  let sequenceRequests=0;
  await page.route(fixture.jsonUrl,async route=>{sequenceRequests++;return route.fulfill({status:mode==='failed-sequence'?503:200,contentType:'application/json',body:mode==='failed-sequence'?'controlled failed replacement':JSON.stringify(fixture.manifest)});});
  await page.route(fixture.imageUrl,route=>route.fulfill({contentType:'image/png',body:Buffer.from(fixture.png.split(',')[1],'base64')}));
  await page.locator('#choose').selectOption('panko-4');await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
  const result=await page.evaluate(()=>{
   const g=window.vfxGallery,s=g.scene,entry=[...s.actors.values()].find(a=>a.asset==='panko');s.eventAudit.length=0;
   const before=JSON.stringify(g.fixture.battle),hit=g.fixture.plan.beats[2].start;
   for(let at=0;at<hit+160;at+=1000/60)g.sample(at,3+at/1000);
   return{source:entry.actor.source,height:entry.actor.bounds.height,firstHit:s.firstHit,hits:s.eventAudit.filter(e=>e.name==='hit').length,overlaps:s.labelAudit.overlaps,ready:s.ready,pending:s.pending.size,unchanged:before===JSON.stringify(g.fixture.battle),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  const expected=mode==='sequence'||mode==='runtime-off'?'sequence':'designer',expectedRequests=['sequence','runtime-off','failed-sequence'].includes(mode)?1:0;
  const pass=result.source===expected&&sequenceRequests===expectedRequests&&Math.abs(result.height-512)<.01&&result.firstHit&&result.hits===1&&result.ready&&!result.pending&&!result.overlaps&&result.unchanged&&!result.overflow;
  report.cases.push({width,height,mode,expected,sequenceRequests,...result,pass});
  if(!baseline&&mode==='sequence'){const file='active-sequence-'+width+'.webp';await sharp(await page.screenshot()).webp({quality:82}).toFile(resolve(out,file));report.shots.push({file,width,height});}
  if(!baseline&&!pass)throw Error('Active format '+JSON.stringify(report.cases.at(-1)));await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,failed:report.cases.filter(c=>!c.pass).length,shots:report.shots.length,errors:report.errors,out}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
