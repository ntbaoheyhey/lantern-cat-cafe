// Staged for tools/cardrpg-look. Actual public controls on the isolated LOOK panel.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';
const artifact=resolve(process.env.LOOK_ARTIFACT||'docs/cardrpg-look/index.html');
const out=process.env.LOOK_ATELIER_OUT||'reports/cardrpg-look/validation/l7/atelier';
await mkdir(out,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytes=await readFile(artifact),sha=hash(bytes);
const selected=JSON.parse(await readFile('reports/cardrpg-look/validation/l5/selection.json'));
const owners=['mochi','soot','clover',...selected.rows.map(row=>row.owner)];
const receipt={artifact,sha256:sha,method:'Real panel, selects, range input, A/B buttons and return navigation;4angles on25models,9chapter/camera views and6desktop configurations. No timing claims from captures.',units:[],stages:[],configs:[],windows:[],failures:[]};
const ready=page=>page.waitForFunction(()=>window.__lookAtelierScene?.ready,null,{timeout:120000});
const paint=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const range=async(page,label,value)=>{
 await page.getByLabel(label,{exact:true}).evaluate((input,value)=>{
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));
  input.dispatchEvent(new Event('input',{bubbles:true}));
 },value);await paint(page);
};
async function windowCheck(label,config,fn){
 await withTimingLock(label,async()=>{
  assert.equal(hash(await readFile(artifact)),sha);
  const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),errors=[],remote=[];
  try{
   const [width,height,dpr]=config;
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});
   page.on('pageerror',error=>errors.push(String(error)));
   page.on('request',request=>{if(/^https?:/.test(request.url()))remote.push(request.url());});
   await page.goto('file://'+artifact);await page.waitForFunction(()=>!!window.__depthReview,null,{timeout:90000});
   const original=await page.evaluate(()=>({account:JSON.stringify(window.__depthReview.state),screen:window.__depthReview.screen}));
   await page.getByRole('button',{name:'Look atelier',exact:true}).click();await ready(page);
   await page.evaluate(()=>{window.__lookInitialAtelier=window.__lookAtelierScene;});
   const observedOwners=await page.getByLabel('Atelier unit',{exact:true}).locator('option').evaluateAll(options=>options.map(option=>option.value));
   assert.deepEqual([...observedOwners].sort(),[...owners].sort());
   await fn(page,{width,height,dpr});
   await page.evaluate(()=>{window.__lookLastAtelier=window.__lookAtelierScene??window.__lookInitialAtelier;});
   await page.getByRole('button',{name:'Return to cafe',exact:true}).click();
   await page.waitForFunction(()=>!document.querySelector('.look-atelier'));
   const returned=await page.evaluate(()=>({account:JSON.stringify(window.__depthReview.state),screen:window.__depthReview.screen,disposed:window.__lookLastAtelier.disposed,overflow:document.documentElement.scrollWidth>innerWidth+1}));
   assert.equal(returned.account,original.account);assert.equal(returned.screen,original.screen);assert.equal(returned.disposed,true);assert.equal(returned.overflow,false);
   assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
   receipt.windows.push({label,width,height,dpr,errors,remote,accountSha256:hash(Buffer.from(original.account)),restoredAccount:true,restoredScreen:true,disposed:returned.disposed,overflow:returned.overflow});
  }catch(error){receipt.failures.push({label,error:String(error),errors,remote});throw error;
  }finally{await browser.close();await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n');}
 });
}
function sceneDetail(){
 const s=window.__lookAtelierScene,view=s.view(),models=[];
 for(const puppet of s.puppets.values()){
  const bounds=[Infinity,Infinity,-Infinity,-Infinity],v=puppet.model.position.clone();let vertices=0;
  puppet.model.updateWorldMatrix(true,true);
  puppet.model.traverse(node=>{
   const p=node.geometry?.attributes?.position;if(!p)return;
   for(let parent=node;parent;parent=parent.parent)if(!parent.visible)return;
   for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(node.matrixWorld).project(s.camera);const x=(v.x+1)/2,y=(1-v.y)/2;bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);vertices++;}
  });models.push({owner:puppet.asset,look:puppet.model.userData.lookV2===true,bounds,vertices});
 }
 return {models,stats:{...s.stats},angle:view.model?.angle,chapter:view.chapter,camera:view.camera,stage:s.stage.name,overflow:document.documentElement.scrollWidth>innerWidth+1};
}
for(const owner of owners)await windowCheck(`LOOK atelier4angles ${owner}`,[1280,720,2],async page=>{
 await page.getByLabel('Atelier unit',{exact:true}).selectOption(owner);await ready(page);
 await page.waitForFunction(owner=>[...window.__lookAtelierScene.puppets.values()].some(p=>p.asset===owner),owner);
 const angles=[];
 for(const angle of [0,90,180,270]){
  await range(page,'Atelier angle',angle);
  await page.waitForFunction(angle=>Math.abs(window.__lookAtelierScene.view().model.angle-angle*Math.PI/180)<.001,angle);
  await paint(page);const detail=await page.evaluate(sceneDetail);
  assert.equal(detail.models.length,1);assert.equal(detail.models[0].owner,owner);assert.equal(detail.models[0].look,true);assert.equal(detail.overflow,false);
  const bounds=detail.models[0].bounds;assert(bounds.every(Number.isFinite));assert(bounds[0]>=.01&&bounds[1]>=.01&&bounds[2]<=.99&&bounds[3]<=.99,`${owner}/${angle} framing ${bounds}`);
  const file=`unit-${owner}-${angle}.png`;await page.locator('.look-viewport').screenshot({path:`${out}/${file}`});angles.push({angle,file,sha256:hash(await readFile(`${out}/${file}`)),...detail});
 }
 receipt.units.push({owner,angles});console.log(JSON.stringify({atelierUnit:owner,angles:4}));
});
for(const chapter of [1,2,3])await windowCheck(`LOOK atelier chapter${chapter}3cameras`,[1280,720,2],async page=>{
 await page.getByRole('button',{name:'Dioramas',exact:true}).click();await page.waitForFunction(()=>window.__lookAtelierScene?.ready&&!window.__lookAtelierScene.view().model,null,{timeout:120000});await page.getByLabel('Atelier chapter',{exact:true}).selectOption(String(chapter));
 for(const camera of ['close','wide','far']){
  await page.getByLabel('Atelier camera',{exact:true}).selectOption(camera);await paint(page);const detail=await page.evaluate(sceneDetail);
  assert.equal(detail.chapter,chapter);assert.equal(detail.camera,camera);assert.equal(detail.overflow,false);assert(detail.stats.calls<=250);assert(detail.stats.triangles<=150000);
  const file=`chapter-${chapter}-${camera}.png`;await page.screenshot({path:`${out}/${file}`});receipt.stages.push({chapter,camera,file,sha256:hash(await readFile(`${out}/${file}`)),...detail});
 }
});
for(const [width,height]of [[1024,600],[1280,720],[1440,900]])for(const dpr of [1,2])await windowCheck(`LOOK atelier UI ${width}/DPR${dpr}`,[width,height,dpr],async page=>{
 const toggles=[];
 for(const enabled of [false,true]){
  await page.evaluate(()=>{window.__lookOldAtelier=window.__lookAtelierScene;});
  await page.getByRole('button',{name:'Look A/B',exact:true}).click();
  await page.waitForFunction(enabled=>window.__LOOK_V2__===enabled&&window.__lookAtelierScene!==window.__lookOldAtelier&&window.__lookAtelierScene?.ready,enabled,{timeout:120000});
  const detail=await page.evaluate(()=>({oldDisposed:window.__lookOldAtelier.disposed,models:[...window.__lookAtelierScene.puppets.values()].map(p=>p.model.userData.lookV2===true)}));
  assert.equal(detail.oldDisposed,true);assert(detail.models.every(value=>value===enabled));toggles.push({enabled,...detail});
 }
 await page.screenshot({path:`${out}/ui-${width}-dpr${dpr}-models.png`});
 await page.getByRole('button',{name:'Before / after',exact:true}).click();
 const pairCount=await page.getByLabel('Atelier comparison',{exact:true}).locator('option').count();assert.equal(pairCount,3);
 const images=await page.locator('.look-reading img').evaluateAll(async images=>{await Promise.all(images.map(image=>image.decode()));return images.map(image=>({width:image.naturalWidth,height:image.naturalHeight}));});assert.equal(images.length,5);assert(images.every(row=>row.width>0&&row.height>0));
 await range(page,'Atelier comparison wipe',25);assert.equal(await page.locator('.look-wipe').evaluate(node=>node.style.getPropertyValue('--wipe')),'25%');
 await page.screenshot({path:`${out}/ui-${width}-dpr${dpr}-comparison.png`});
 await page.getByRole('button',{name:'Notes & measurements',exact:true}).click();assert.equal(await page.locator('.look-reading tbody tr').count(),6);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
 await page.screenshot({path:`${out}/ui-${width}-dpr${dpr}-notes.png`});
 await page.getByRole('button',{name:'Open skill gallery',exact:true}).click();
 await page.getByLabel('Gallery unit',{exact:true}).waitFor();
 await page.getByLabel('Preview speed',{exact:true}).selectOption('0.25');
 await page.getByLabel('Effect only',{exact:true}).check();
 await page.waitForFunction(()=>window.__depthScene?.ready&&window.__b2Gallery.sceneReady&&window.__depthScene.view().effectOnly,null,{timeout:120000});
 await page.getByRole('button',{name:'Play preview',exact:true}).click();
 await page.waitForFunction(()=>!!window.__b2Gallery.plan);
 await paint(page);
 const skillGallery=await page.evaluate(()=>({actions:window.__b2Gallery.galleryActions.length,owners:new Set(window.__b2Gallery.galleryActions.map(action=>action.owner)).size,speed:window.__b2Gallery.gallerySpeed,effectOnly:window.__b2Gallery.galleryEffectOnly,atelierDisposed:window.__lookInitialAtelier.disposed}));
 assert.deepEqual(skillGallery,{actions:86,owners:25,speed:.25,effectOnly:true,atelierDisposed:true});
 receipt.configs.push({width,height,dpr,toggles,pairCount,images,overflow,skillGallery});
});
assert.equal(receipt.units.length,25);assert.equal(receipt.stages.length,9);assert.equal(receipt.configs.length,6);assert.equal(receipt.windows.length,34);assert.deepEqual(receipt.failures,[]);
receipt.passed=true;await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({passed:true,units:25,angles:100,stages:9,configs:6}));
