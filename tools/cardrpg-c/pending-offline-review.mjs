/** Rapid public dropdown changes against the rebuilt, file-only gallery. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c11-pending-offline',smoke=process.argv.includes('--smoke');if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid tag');
const out=process.argv.includes('--scratch')?'/tmp/cardrpg-c-'+tag:resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(out,{recursive:true});
const report={method:'Rapid synchronous change events on the public effect dropdown; embedded offline assets, both sizes, real Pause/Play. No progression or frame-time claim.',cases:[],controls:[],shots:[],errors:[],http:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.http.push(r.url());});
  await page.goto('file://'+root+'/docs/cardrpg-c/vfx.html');await page.waitForFunction(()=>window.vfxGallery?.scene.ready);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  for(const kind of (smoke?['cats']:['cats','enemies','all'])){
   const changes=await page.evaluate(({kind,smoke})=>{
    const choose=document.querySelector('#choose');let ids=[...choose.options].map(o=>o.value).filter(id=>kind==='cats'?/-4$/.test(id):kind==='enemies'?id.startsWith('enemy:'):true);if(smoke)ids=ids.slice(0,2);
    for(const id of [...ids,...ids.slice().reverse(),'inkcap-4']){choose.value=id;choose.dispatchEvent(new Event('change',{bubbles:true}));}return ids.length*2+1;
   },{kind,smoke});
   await page.waitForFunction(()=>{const g=window.vfxGallery,s=g.scene;return s.ready&&g.view.actors.every(a=>s.actors.has(a.id));});
   await page.waitForTimeout(150);
   const result=await page.evaluate(()=>{
    const g=window.vfxGallery,s=g.scene;g.manual(true);g.sample(g.fixture.plan.beats[2].start+180,5);
    const ids=g.view.actors.map(a=>a.id),actual=[...s.actors.keys()],lanes=[...s.lanes.keys()],expected=g.view.actors.filter(a=>a.side==='party').map(a=>a.id),party=s.sizeAudit().units.filter(a=>a.side==='party').sort((a,b)=>a.box.x-b.box.x).map(a=>a.id);
    return{ids,actual,lanes,expected,party,loading:{...s.loading},ready:s.ready,pending:s.pending.size,children:s.scene.children.length,overlaps:s.labelAudit.overlaps,match:JSON.stringify(expected)===JSON.stringify(party),ghost:lanes.some(id=>!ids.includes(id))||actual.some(id=>!ids.includes(id)),overflow:document.documentElement.scrollWidth>innerWidth};
   });
   if(!result.ready||result.pending||result.ghost||!result.match||result.overlaps||result.overflow||result.loading.completed!==result.ids.length||result.loading.total!==result.ids.length||result.children!==1+result.ids.length*4)throw Error('Offline roster '+JSON.stringify(result));
   report.cases.push({width,height,kind,changes,...result});
  }
  const file=`rapid-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({file,width,height});
  await page.evaluate(()=>window.vfxGallery.manual(false));
  const before=await page.evaluate(()=>window.vfxGallery.view.fixedTime);await page.waitForTimeout(180);const paused=await page.evaluate(()=>window.vfxGallery.view.fixedTime);
  await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(t=>window.vfxGallery.view.fixedTime>t,paused);await page.getByRole('button',{name:'Pause',exact:true}).click();
  const after=await page.evaluate(()=>window.vfxGallery.view.fixedTime);if(paused!==before||after<=paused)throw Error('Playback did not pause/resume');report.controls.push({width,before,paused,after});
  await page.close();
 }
 if(report.errors.length||report.http.length)throw Error(JSON.stringify({errors:report.errors,http:report.http}));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,changes:report.cases.reduce((n,c)=>n+c.changes,0),controls:report.controls.length,errors:report.errors,http:report.http}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
