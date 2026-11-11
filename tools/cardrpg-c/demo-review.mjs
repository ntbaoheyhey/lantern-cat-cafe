/** Offline C10 artifact checks, distinct from the live account/progression measurement. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)??'c10';if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid evidence tag');
const output=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(output,{recursive:true});
const report={mode:'Offline gallery and review hub; no progression or frame-timing claim',errors:[],requests:[],shots:[],units:[],clips:0,checks:[]};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const unitsOnly=process.argv.includes('--gallery-only');
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))report.requests.push(r.url());});
 async function shot(name,width,height){await page.waitForTimeout(150);const file=`${width}-${name}.webp`;await sharp(await page.screenshot()).webp({quality:85}).toFile(resolve(output,file));const audit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.getClientRects().length&&(!i.complete||!i.naturalWidth)).map(i=>i.src)}));report.shots.push({name,width,height,file,...audit});if(audit.overflow||audit.broken.length)throw Error('Layout '+JSON.stringify(audit));}
 for(const[width,height]of[[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  if(!unitsOnly){
   await page.goto('file://'+root+'/docs/cardrpg-c/index.html');await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete));await shot('home',width,height);
   await page.locator('#fights').scrollIntoViewIfNeeded();
   for(const video of await page.locator('video').all()){
    await video.evaluate(async el=>{await new Promise((yes,no)=>{if(el.readyState>=1)return yes();el.addEventListener('loadedmetadata',yes,{once:true});el.addEventListener('error',()=>no(Error('Video decode failed')),{once:true});el.load();});el.currentTime=4;await el.play();});
    await page.waitForTimeout(350);const check=await video.evaluate(el=>({width:el.videoWidth,height:el.videoHeight,duration:el.duration,at:el.currentTime,rate:el.playbackRate}));await video.evaluate(el=>el.pause());if(!check.width||check.at<=4||check.rate!==1)throw Error('Video did not play');report.checks.push({width,video:check});
   }
   await shot('recordings',width,height);
   await page.locator('#lineup').scrollIntoViewIfNeeded();await shot('lineup',width,height);
  }
  await page.goto('file://'+root+'/docs/cardrpg-c/vfx.html?mode=units');await page.waitForFunction(()=>window.unitPlayer?.ready,null,{timeout:90000});
  await page.evaluate(()=>{window.unitPlayer.playing=false;window.unitPlayer.sample('skill',.5);});await shot('unit-mochi',width,height);
  await page.locator('#unit-choose').selectOption('yarn-giant');await page.waitForFunction(()=>window.unitPlayer?.ready&&window.unitPlayer.actor.unit.id==='yarn-giant');await page.locator('#clip-choose').selectOption('enrage');await page.evaluate(()=>window.unitPlayer.sample('enrage',.5));await shot('unit-boss',width,height);
  await page.getByRole('button',{name:'Skill effects',exact:true}).click();await page.waitForFunction(()=>window.vfxGallery?.scene.ready);await page.locator('#choose').selectOption('mochi-4');await page.waitForFunction(()=>window.vfxGallery.scene.ready);await page.waitForTimeout(500);await shot('effects',width,height);
 }
 await page.getByRole('button',{name:'Character animations',exact:true}).click();
 const ids=await page.locator('#unit-choose option').evaluateAll(options=>options.map(o=>o.value));
 await page.evaluate(()=>{window.unitPlayer.playing=false;Object.assign(document.querySelector('#unit-stage').style,{width:'320px',height:'400px',minHeight:'400px',maxHeight:'400px'});});
 const tiles=[];
 for(const id of ids){
  await page.locator('#unit-choose').selectOption(id);await page.waitForFunction(id=>window.unitPlayer.ready&&window.unitPlayer.actor.unit.id===id,id);
  const unit=await page.evaluate(()=>{const p=window.unitPlayer,a=p.actor;let clips=0;for(const name of a.clips.keys()){p.selectClip(name);for(const progress of[0,.5,1])p.sample(name,progress);if(!(a.duration(name)>0))throw Error('Clip duration '+name);clips++;}p.selectClip('idle');p.sample('idle',.2);return{id:a.unit.id,name:a.unit.name,height:a.bounds.height,source:a.source,clips,draws:p.renderer.info.render.calls};});
  report.units.push(unit);report.clips+=unit.clips;
  const label=Buffer.from(`<svg width="320" height="30"><rect width="320" height="30" fill="#322730"/><text x="160" y="21" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#f8e5c4">${unit.name} · ${Math.round(unit.height)}u</text></svg>`);
  const tile=await sharp(await page.locator('#unit-stage').screenshot()).extend({bottom:30,background:'#322730'}).composite([{input:label,left:0,top:400}]).png().toBuffer();
  tiles.push({input:tile,left:(tiles.length%5)*320,top:Math.floor(tiles.length/5)*430});
 }
 await sharp({create:{width:1600,height:2150,channels:4,background:'#322730'}}).composite(tiles).webp({quality:87}).toFile(resolve(root,'docs/cardrpg-c/lineup.webp'));
 if(report.units.length!==25||report.clips!==206)throw Error('Missing units or clips');
 if(report.errors.length||report.requests.length)throw Error(JSON.stringify({errors:report.errors,requests:report.requests}));
 report.complete=true;console.log(JSON.stringify({shots:report.shots.length,units:report.units.length,clips:report.clips,errors:report.errors.length,http:report.requests.length}));
}finally{await writeFile(resolve(output,unitsOnly?'gallery-review.json':'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
