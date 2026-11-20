// Immutable base capture, original file:// artifact plus the unchanged development entry.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pinExistingFonts} from '../visual-support.mjs';
const out='reports/cardrpg/baseline', records=[],errors=[];
await fs.mkdir(out+'/shots',{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try {
 for(const source of ['offline','dev']) for(const [width,height] of [[1024,600],[1280,720],[1440,900]]) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push({source,width,error:String(e)}));
  if(source==='dev')await pinExistingFonts(page);
  await page.goto(source==='offline'?pathToFileURL(resolve('docs/turn3d-polish/index.html')).href:'http://127.0.0.1:5521/?demo&squad=1&squad3d=1&squadDebug=1');
  await page.getByRole('button',{name:/Begin patrol/}).waitFor();
  const shot=async(name,stageOnly=false)=>{
   await page.waitForFunction(()=>{const r=window.__turn3dReview;return r?.scene&&r.scene.stats.loaded===r.view().actors.length});
   await page.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});
   await page.waitForTimeout(50);
   const file=`${out}/shots/${source}-${width}-${name}.png`;
   const data=await (stageOnly?page.locator('.sq-arena-frame'):page).screenshot({path:file});
   records.push({source,width,height,name,file,sha256:createHash('sha256').update(data).digest('hex'),...await page.evaluate(()=>{const r=window.__turn3dReview,b=document.querySelector('.t3-stage').getBoundingClientRect();return {stage:{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom},documentHeight:document.documentElement.scrollHeight,scrollY,stats:r.scene.stats,labels:r.scene.labelAudit}})});
  };
  await page.getByRole('button',{name:/Begin patrol/}).click();
  await page.waitForFunction(()=>window.__turn3dReview?.controller.canChoose);
  await page.evaluate(()=>{const c=window.__turn3dReview.controller;c.fixedTime=1;c.notify()});
  if(source==='offline')await page.locator('#play').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));
  await shot('hero-turn');
  await page.getByRole('button',{name:'Effects',exact:true}).click();
  const ids=await page.getByLabel('Effect action').locator('option').evaluateAll(es=>es.map(e=>e.value));
  for(const id of ids)for(let beat=0;beat<5;beat++){
   await page.evaluate(({id,beat})=>window.__turn3dReview.controller.inspect(id,beat),{id,beat});
   await shot(`${id}-${beat}`,true);
  }
  console.log(`${source} ${width}: ${ids.length*5+1} captures`);
  await fs.writeFile(out+'/captures.json',JSON.stringify({base:'3bf2cfa3bd32d8355c5c967e979240330a595682',date:new Date().toISOString(),errors,records},null,2));
  await page.close();
 }
}finally{await browser.close();await fs.writeFile(out+'/captures.json',JSON.stringify({base:'3bf2cfa3bd32d8355c5c967e979240330a595682',date:new Date().toISOString(),errors,records},null,2))}
if(errors.length)throw Error(JSON.stringify(errors));
