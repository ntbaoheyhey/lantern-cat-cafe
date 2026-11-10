// Original puppet sockets, visible canvas totals, target safety and x1 playback.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {apply,audit} from '../../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),artifact=resolve(process.env.ART_ARTIFACT);
await mkdir(out,{recursive:true});
const cats=['mochi','soot','clover','panko','mallow','cinnamon','velvet','biscuit','brioche','marigold','sorrel','inkcap'];
const enemies=['button-guard','sock-skipper','spool-ram','needle-moth','teacup-healer','binding-thread','practice-cushion','pollen-scout','kettle-knight','rain-spool','crumb-sentinel','yarn-giant','pantry-crown'];
const ids=process.env.ART_CASTS?.split(',')??[...cats.flatMap(id=>[id+'-2',id+'-3',id+'-4']),...enemies.map(id=>'enemy:'+id)];
const result={method:'Actual A6 canvas: four beats per cast, socket projection and x1 first playback frame timings. No rule/model mutation.',errors:[],rows:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:Number(process.env.ART_WIDTH??1440),height:Number(process.env.ART_HEIGHT??900)},deviceScaleFactor:1});
 page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
 await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
 await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
 await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 for(const id of ids){
  await apply(page,{gallery:id,progress:0});const tiles=[],samples=[];
  for(const [i,[label,kind,fraction]] of [['charge','anticipation',.85],['travel','travel',.5],['impact','impact',.65],['afterglow','reaction',.35]].entries()){
   const state=await page.evaluate(async({kind,fraction})=>{
    const m=window.__depthReview,s=window.__depthScene,b=m.plan.beats.find(b=>b.kind===kind);m.animationAt=b.start+b.duration*fraction;m.notify(false);await new Promise(requestAnimationFrame);
    s.render({...s.view(),fixedTime:3.2,paused:true},0);s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;
    const source=s.puppets.get(m.plan.actorId),socket=source.model.getObjectByName(`${source.role}_socket_mainHand`),v=s.effectProp.clone();socket.getWorldPosition(v);
    const actual=s.cardEffects.propOrigin,canvas=s.puppetNumbers.canvas,drawn=s.puppetNumbers.drawn,host=canvas.getBoundingClientRect();
    const boxes=drawn.map(r=>({...r,left:r.x+host.x,right:r.x+r.width+host.x,top:r.y+host.y,bottom:r.y+r.height+host.y}));
    const fixed=[...document.querySelectorAll('.dp-world-plate,.dp-party,.dp-battle-top,.dp-ultimate-moment,.dp-v4-boss-cue,.dp-combo-callout')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none'&&Number(getComputedStyle(e).opacity)>0).map(e=>e.getBoundingClientRect());
    const hit=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
    const overlap=boxes.flatMap((a,i)=>[...boxes.slice(i+1),...fixed].filter(b=>hit(a,b)).map(()=>a.text));
    const dom=[...document.querySelectorAll('.dp-float-number')];
    const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let ink=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])ink++;
    return {source:source.asset,puppet:source.model.userData.lookPuppet,socket:v.toArray(),emission:actual?.toArray(),error:actual?actual.distanceTo(v):null,stats:s.stats,faceHp:s.labelAudit.overlaps,canvasNumbers:canvas.dataset.puppetNumbers==='true',numbers:s.puppetNumbers.rows,drawn,ink,overlap,duplicate:dom.filter(e=>Number(getComputedStyle(e).opacity)>0).length,accessible:dom.every(e=>!!e.getAttribute('aria-label')&&!e.hidden),frame:{elapsed:m.animationAt,beat:b.kind,ultimate:m.plan.ultimate}};
   },{kind,fraction});
   samples.push({label,...state,ui:await page.evaluate(audit)});
   tiles.push({input:await sharp(await page.screenshot()).resize(720,450).toBuffer(),left:i%2*720,top:Math.floor(i/2)*480+30});
   tiles.push({input:Buffer.from(`<svg width="720" height="30"><text x="12" y="22" fill="#fff0d2" font-size="17">${id} · ${label}</text></svg>`),left:i%2*720,top:Math.floor(i/2)*480});
  }
  await sharp({create:{width:1440,height:960,channels:3,background:'#173039'}}).composite(tiles).webp({quality:86}).toFile(out+'/'+id.replaceAll(':','-')+'.webp');
  await page.evaluate(id=>{const m=window.__depthReview;m.gallerySpeed=1;m.state.settings.speed=1;m.inspect(id,0,true);window.__castFrames=[];let previous=performance.now();function sample(now){window.__castFrames.push(now-previous);previous=now;if(window.__depthReview.plan)requestAnimationFrame(sample)}requestAnimationFrame(sample);},id);
  await page.waitForFunction(()=>!window.__depthReview.plan,null,{timeout:20000});
  const timing=await page.evaluate(()=>{const a=window.__castFrames.slice(1).sort((a,b)=>a-b);return{samples:a.length,median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}});
  const reduced=await page.evaluate(async id=>{const m=window.__depthReview,s=window.__depthScene;m.inspect(id,.7);m.state.settings.reducedMotion=true;m.notify(false);await new Promise(requestAnimationFrame);s.render({...s.view(),fixedTime:20,paused:true},0);const a=JSON.stringify(s.puppetNumbers.drawn);s.render({...s.view(),fixedTime:30,paused:true},0);const same=a===JSON.stringify(s.puppetNumbers.drawn);m.state.settings.reducedMotion=false;return same;},id);
  result.rows.push({id,samples,timing,reduced});await writeFile(out+'/vfx-review.json',JSON.stringify(result,null,2)+'\n');
 }
}finally{await browser.close();await writeFile(out+'/vfx-review.json',JSON.stringify(result,null,2)+'\n')}
console.log(JSON.stringify({casts:result.rows.length,errors:result.errors,maxP95:Math.max(...result.rows.map(r=>r.timing.p95)),maxFrame:Math.max(...result.rows.map(r=>r.timing.max))}));
const failures=result.rows.filter(r=>!r.reduced||r.samples.some(s=>!s.puppet||!s.canvasNumbers||s.error===null||s.error>.001||s.faceHp||s.ui.overlaps.length||s.overlap.length||s.duplicate||!s.accessible||s.drawn.length&&!s.ink));
if(failures.length)console.log(JSON.stringify({failures:failures.map(r=>r.id)}));
if(result.errors.length||failures.length)process.exitCode=1;
