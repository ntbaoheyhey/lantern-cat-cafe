/** Focused review of the refreshed offline hero and painted effects stage. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const output=resolve(root,'reports/cardrpg-c/shots/c11-stage-demo');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const report={method:'Changed offline demo surfaces only; prior recordings and unit intake remain unchanged.',shots:[],errors:[],http:[],complete:false};
try {
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))report.http.push(r.url());});
 for(const [width,height] of [[1280,720],[1440,900]]) {
  await page.setViewportSize({width,height});
  async function shot(name){
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const audit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.getClientRects().length&&!i.naturalWidth).length}));
   if(audit.overflow||audit.broken)throw Error('Layout '+JSON.stringify(audit));
   const file=`${width}-${name}.webp`;await sharp(await page.screenshot()).webp({quality:86}).toFile(resolve(output,file));report.shots.push({name,file,width,height,...audit});
  }
  await page.goto('file://'+root+'/docs/cardrpg-c/index.html');await shot('home');
  await expect(page.locator('#fights .section-head p')).toContainText('before the cafe backdrop update');
  await page.getByRole('link',{name:'Skill effects',exact:true}).click();
  await page.waitForFunction(()=>window.vfxGallery?.scene.ready&&window.vfxGallery.scene.audit().stage.source==='painted');
  await page.evaluate(()=>{window.vfxGallery.manual(true);window.vfxGallery.select('marigold-4');});
  await page.waitForFunction(()=>window.vfxGallery.scene.ready&&window.vfxGallery.view.actors.every(a=>window.vfxGallery.scene.actors.has(a.id)));
  const audit=await page.evaluate(()=>{const g=window.vfxGallery;g.sample(0,3);g.sample(g.fixture.plan.beats[2].start+1,3.3);g.sample(g.fixture.plan.beats[2].start+100,3.4);return g.scene.audit();});
  if(audit.labels.overlaps||audit.vfx.dropped)throw Error('Effects readability');
  await shot('effects');await page.locator('#motion').check();
  const calm=await page.evaluate(()=>{const s=window.vfxGallery.scene;return{zoom:s.camera.zoom,stage:s.audit().stage};});
  if(calm.zoom!==1||calm.stage.offsets.some(x=>x!==0))throw Error('Reduced motion');
  await shot('effects-calm');report.shots.at(-1).stage=calm.stage;
 }
 if(report.errors.length||report.http.length)throw Error(JSON.stringify(report));report.complete=true;
 console.log(JSON.stringify({shots:report.shots.length,errors:report.errors,http:report.http}));
} finally {await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
