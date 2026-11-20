import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
import {open,apply,audit} from './harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const rows=JSON.parse(await readFile(process.env.V5_CASES)),result={method:'Real registered rules replay frames; exact trigger layer or authored action layer submitted with nonzero alpha at the recorded target. Saved full-page frames require visual review; this is not a new natural battle or pixel-level semantic classifier.',rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{for(const [width,height]of [[1024,600],[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>result.errors.push(String(e)));await open(page,process.env.V5_ARTIFACT);
 await page.evaluate(()=>{const e=window.__depthScene.cardEffects;e.__submitted=[];e.__lane='body';const render=e.render;e.render=function(...args){this.__submitted.length=0;this.__lane='body';return render.apply(this,args)};
  for(const method of ['renderStatusBeats','renderAction']){const old=e[method];e[method]=function(...args){const lane=this.__lane;this.__lane=method;const value=old.apply(this,args);this.__lane=lane;return value};}
  const place=e.place;e.place=function(layer,...args){const before=this.stats.instances;place.call(this,layer,...args);if(this.stats.instances>before)this.__submitted.push({lane:this.__lane,layer,x:this.focus.x,z:this.focus.z,alpha:this.pools.get(layer.primitive).alpha.getX(this.pools.get(layer.primitive).mesh.count-1),count:this.stats.instances-before});};
 });
 for(const row of rows){await apply(page,row);const peak=await page.evaluate(row=>{const s=window.__depthScene,e=s.cardEffects,p=s.view().cardPresentation;const status=row.key.startsWith('status:')?row.key.split(':')[1]:null,layer=status?window.__v5LiveLooks.statuses[status].tick:null,target=s.positions.get(row.target);
 const submitted=e.__submitted.filter(x=>x.alpha>.002&&(status?x.lane==='renderStatusBeats'&&x.layer===layer&&Math.abs(x.x-target.x)<.001&&Math.abs(x.z-target.z)<.001:x.lane==='renderAction')).reduce((n,x)=>n+x.count,0);
 return{received:status?p.beats.some(b=>b.kind==='trigger'&&b.statusId===status&&b.targetId===row.target):!!window.__depthReview.plan,submitted,bitterLabels:[...document.querySelectorAll('.dp-number-bitter')].map(x=>({text:x.textContent,decoration:getComputedStyle(x).textDecorationLine})),stats:{...s.stats}};
 },row);
 const file=width+'-'+row.name+'.webp';await sharp(await page.screenshot()).webp({quality:80}).toFile(out+'/'+file);
 const frames=[];for(let at=row.frame.plan.beats[2].start;at<Math.min(row.frame.plan.duration,row.frame.plan.beats[2].start+350);at+=1000/60){await page.evaluate(async at=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=at;m.notify(false);await new Promise(requestAnimationFrame);s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await new Promise(requestAnimationFrame)},at);frames.push(await page.evaluate(audit));}
 await page.evaluate(async()=>{const m=window.__depthReview,s=window.__depthScene;m.plan=null;m.notify(false);await new Promise(requestAnimationFrame);s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await new Promise(requestAnimationFrame)});
 const cleared=await page.evaluate(()=>{const e=window.__depthScene.cardEffects;return e.__submitted.every(x=>x.lane!=='renderStatusBeats'&&x.lane!=='renderAction')&&[...document.querySelectorAll('.dp-float-number,.dp-combo-callout')].every(x=>getComputedStyle(x).visibility==='hidden'||getComputedStyle(x).display==='none'||x.hidden)});
 result.rows.push({key:row.key,case:row.case,round:row.round,action:row.action,width,file,peak,cleared,frames});
 }await page.close();
}}finally{await browser.close();await writeFile(out+'/triggers.json.gz',gzipSync(JSON.stringify(result)))}
console.log(JSON.stringify({samples:result.rows.length,errors:result.errors,missing:result.rows.filter(r=>!r.peak.received||!r.peak.submitted),uncleared:result.rows.filter(r=>!r.cleared).map(r=>[r.width,r.key]),overlap:result.rows.flatMap(r=>r.frames).reduce((n,r)=>n+r.overlaps.length,0),unplaced:result.rows.flatMap(r=>r.frames).reduce((n,r)=>n+r.unplaced.length,0)}));
