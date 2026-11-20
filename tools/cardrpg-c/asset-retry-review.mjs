/** One controlled asset failure followed by public gallery return; no account or balance seeds. */
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),out='/tmp/cardrpg-c-asset-retry-'+(baseline?'before':'after');
await mkdir(out,{recursive:true});
const report={method:'Cold gallery pages, one controlled Panko atlas HTTP503 or PNG decode failure; select away and back through public controls. Source recovery only, no gameplay or frame-time claim.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]])for(const mode of ['atlas','image']){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',error=>report.errors.push(error.message));let requests=0;
  const suffix=mode==='atlas'?'panko.atlas':'panko.png';
  await page.route('**/spine/panko/placeholder/'+suffix+'*',async route=>{
   if(route.request().resourceType()!==(mode==='atlas'?'fetch':'image'))return route.continue();
   requests++;if(requests===1)return route.fulfill({status:mode==='atlas'?503:200,contentType:mode==='atlas'?'text/plain':'image/png',body:'controlled one-time failure'});
   return route.continue();
  });
  await page.goto('http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/vfx-gallery.html');
  await page.waitForFunction(()=>window.vfxGallery?.scene.ready);
  await page.evaluate(()=>window.vfxGallery.manual(true));
  async function select(id){
   await page.locator('#choose').selectOption(id);
   await page.waitForFunction(()=>{const g=window.vfxGallery;return g.scene.ready&&g.scene.actors.size===g.view.actors.length&&g.view.actors.every(a=>g.scene.actors.get(a.id)?.asset===g.view.models[a.id]);});
   return page.evaluate(()=>{const g=window.vfxGallery;g.sample(g.fixture.plan.beats[2].start+180,4);return {source:[...g.scene.actors.values()].find(a=>a.asset==='panko')?.actor.source,ready:g.scene.ready,pending:g.scene.pending.size,overlaps:g.scene.labelAudit.overlaps,actors:g.scene.actors.size};});
  }
  const first=await select('panko-4');await select('mochi-4');const second=await select('panko-4');
  const requestsAfterRecovery=requests;await select('mochi-4');const third=await select('panko-4');
  const pass=requestsAfterRecovery===2&&requests===2&&first.source==='puppet'&&second.source==='placeholder'&&third.source==='placeholder'&&[first,second,third].every(v=>v.ready&&!v.pending&&!v.overlaps&&v.actors===4);
  report.cases.push({width,height,mode,requests,first,second,third,pass});
  if(!baseline&&mode==='atlas'){
   const file='recovered-'+width+'.webp';await sharp(await page.screenshot()).webp({quality:82}).toFile(resolve(out,file));report.shots.push({file,width,height});
  }
  if(!baseline&&!pass)throw Error('Asset recovery '+JSON.stringify(report.cases.at(-1)));
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
 console.log(JSON.stringify({cases:report.cases.length,failed:report.cases.filter(c=>!c.pass).length,shots:report.shots.length,errors:report.errors,out}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
