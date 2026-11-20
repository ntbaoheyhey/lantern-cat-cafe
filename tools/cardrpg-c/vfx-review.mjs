import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const output=resolve(root,'reports/cardrpg-c/shots/c6');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const report={method:'Deterministic gallery coverage and local Chromium Metal rAF timing; not gameplay progression.',errors:[],coverage:[],performance:[],overrides:{}};
const heavy=execFileSync('ps',['-axo','pid,pcpu,comm'],{encoding:'utf8'}).split('\n').filter(line=>/iopaint|lama|realesrgan|segment.anything/i.test(line));report.heavyProcesses=heavy;
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/@fs/'+root+'/tools/cardrpg-c/vfx-gallery.html');
 await page.waitForFunction(()=>window.vfxGallery?.scene.ready,null,{timeout:90000});
 await page.evaluate(()=>window.vfxGallery.manual(true));const ids=await page.locator('#choose option').evaluateAll(options=>options.map(o=>o.value));
 const tiles=[];let worst={id:'',draws:0};
 for(const [width,height] of [[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const id of ids){
   await page.evaluate(id=>window.vfxGallery.select(id),id);await page.waitForFunction(()=>window.vfxGallery.scene.ready,null,{timeout:60000});
   for(const speed of [1,2,3]){
    const audit=await page.evaluate(({id,speed})=>{const g=window.vfxGallery;g.select(id);g.setSpeed(speed);const duration=g.fixture.plan.duration;let peak=0,draws=0,active=0,masked=0,hits=0;g.scene.eventAudit.length=0;const before=g.scene.effects.stats.dropped;for(let elapsed=0;elapsed<=duration+600;elapsed+=1000/60*speed){g.sample(elapsed,3+elapsed/1000);const stats=g.scene.effects.stats;peak=Math.max(peak,stats.active);draws=Math.max(draws,g.scene.stats.calls+stats.draws+g.scene.effects.overrides.stats.draws);active+=stats.draws;masked=stats.maskedFaces;}hits=g.scene.eventAudit.filter(e=>e.name==='hit').length;return{id,speed,peak,draws,active,masked,hits,dropped:g.scene.effects.stats.dropped-before,labels:g.scene.labelAudit.overlaps};},{id,speed});
    report.coverage.push({width,...audit});if(audit.labels)throw Error('Label overlap '+id);if(!audit.active)throw Error('Invisible effect '+id);if(!id.startsWith('status:')&&!audit.hits)throw Error('No hit event '+id);if(audit.draws>worst.draws)worst={id,draws:audit.draws};
   }
   await page.evaluate(id=>{const g=window.vfxGallery;g.select(id);g.setSpeed(1);const hit=g.fixture.plan.beats[2].start;g.sample(Math.max(0,hit-1),3);g.sample(hit+1,3.02);g.sample(hit+160,3.18);},id);
   if(width===1280){const label=Buffer.from(`<svg width="300" height="28"><rect width="300" height="28" fill="#f4e7ce"/><text x="8" y="19" font-size="12" font-family="sans-serif" fill="#49333a">${id}</text></svg>`),body=await sharp(await page.locator('#stage').screenshot()).resize(300,168,{fit:'contain',background:'#bd9470'}).toBuffer();tiles.push(await sharp({create:{width:300,height:196,channels:4,background:'#f4e7ce'}}).composite([{input:body,left:0,top:0},{input:label,left:0,top:168}]).webp({quality:85}).toBuffer());}
   if(['mochi-4','soot-4','clover-4','panko-4','enemy:yarn-giant','enemy:pantry-crown','status:scald','status:bitter'].includes(id))await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(output,`${id.replaceAll(':','-')}-${width}.webp`));
  }
  if(!heavy.length){
   await page.evaluate(id=>{const g=window.vfxGallery;g.select(id);g.manual(false);g.setSpeed(1);},worst.id);await page.waitForTimeout(1000);
   const perf=await page.evaluate(async()=>{const g=window.vfxGallery;const times=[];let previous=0,draws=0;await new Promise(resolve=>{function frame(now){if(previous)times.push(now-previous);previous=now;draws=Math.max(draws,g.scene.stats.calls+g.scene.effects.stats.draws+g.scene.effects.overrides.stats.draws);if(times.length<360)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});times.sort((a,b)=>a-b);g.manual(true);return{p50:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],max:times.at(-1),draws,samples:times.length};});report.performance.push({width,height,id:worst.id,...perf});
  }
 }
 for(let first=0;first<tiles.length;first+=24){const batch=tiles.slice(first,first+24),columns=4;await sharp({create:{width:columns*300,height:Math.ceil(batch.length/columns)*196,channels:4,background:'#f4e7ce'}}).composite(batch.map((input,i)=>({input,left:i%columns*300,top:Math.floor(i/columns)*196}))).webp({quality:90}).toFile(resolve(output,`contact-${first/24+1}.webp`));}
 report.worst=worst;
 report.overrides=await page.evaluate(async()=>{const g=window.vfxGallery;g.select('mochi-1');const {SPINE_UNIT_BY_ID}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/src/game/cardrpg/spine/config.ts'),unit=SPINE_UNIT_BY_ID.get('mochi'),base=unit.placeholder.skeleton.slice(0,unit.placeholder.skeleton.lastIndexOf('/')+1),fx=g.scene.effects.overrides;await fx.prepare({'mochi-1':{format:'sequence',frames:[base+'mochi.png'],fps:2,width:1024,height:1024,scale:.2,socket:'vfxOrigin',cue:'hit'}});const ok=fx.emit('mochi-1','hit',g.fixture.plan.targetIds,5);let draws=0;fx.render(5.2,()=>draws++);await fx.prepare({'mochi-2':{format:'sequence',frames:['missing.png'],fps:24,width:100,height:100,scale:1,socket:'vfxOrigin',cue:'hit'}});fx.clear();return{ok,draws,warnings:fx.warnings.length,fallback:!fx.effects.has('mochi-2')};});
 if(!report.overrides.ok||!report.overrides.draws||!report.overrides.fallback)throw Error('Override playback/fallback gate');
 if(report.errors.length)throw Error(JSON.stringify(report.errors));
 console.log(JSON.stringify({coverage:report.coverage.length,worst,performance:report.performance,overrides:report.overrides,errors:report.errors}));
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
