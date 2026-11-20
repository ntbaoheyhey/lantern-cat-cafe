/**
 * Measures how often the three designer idle videos (Mochi, Clover, Soot) stop
 * moving during the judge path, and why: paused by code (hit-stop, ultimate
 * hold, tab hidden) or stalled while playing (decoder / loop seam).
 *
 *   node tools/v5int/run-chain-mode.mjs --fixture
 *   DEMO_ANGLE=swiftshader node tools/v5int/v10-idle-smoothness-probe.mjs
 *
 * Prints a JSON summary per cat. Sampling runs on a 10 ms timer in the page.
 */
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const origin=process.env.DEMO_ORIGIN??'http://127.0.0.1:6301';
const angle=process.env.DEMO_ANGLE??'metal';
const seconds=Number(process.env.PROBE_SECONDS??90);

const probe=()=>{
 const M=HTMLMediaElement.prototype,realPause=M.pause,realPlay=M.play;
 const cat=v=>/\/units\/(\w+)\/designer\//.exec(v.currentSrc||v.src||'')?.[1];
 const log=window.__idleProbe={calls:[],samples:{}};
 M.pause=function(){const c=cat(this);if(c&&!this.paused)log.calls.push({cat:c,op:'pause',t:performance.now(),stack:new Error().stack.split('\n').slice(2,5).join(' | ')});return realPause.call(this);};
 M.play=function(){const c=cat(this);if(c&&this.paused)log.calls.push({cat:c,op:'play',t:performance.now()});return realPlay.call(this);};
 const videos=new Map();let nextId=0;
 const origCreate=document.createElement.bind(document);
 document.createElement=function(tag,...a){const el=origCreate(tag,...a);if(String(tag).toLowerCase()==='video')videos.set(el,++nextId);return el;};
 setInterval(()=>{
  const t=performance.now();
  for(const [v,id] of videos){const c=cat(v);if(!c||v.readyState<2)continue;(log.samples[c+'#'+id]??=[]).push([t,v.currentTime,v.paused?1:0,v.seeking?1:0,v.readyState]);}
 },10);
};

const browser=await chromium.launch({headless:true,args:[`--use-angle=${angle}`,'--mute-audio','--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:{width:960,height:540}});
await context.addInitScript({content:`(${probe})();`});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const click=name=>page.getByRole('button',{name,exact:true}).click();
await page.goto(`${origin}/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`);
const play=page.getByRole('button',{name:'Play free',exact:true}),guard=page.getByRole('button',{name:'Guard the café',exact:true});
await play.or(guard).waitFor({timeout:60000});if(await play.isVisible())await play.click();
await guard.click();
await page.waitForFunction(()=>window.__depthReview?.sceneReady===true,{},{timeout:60000});
const start=Date.now();
while(Date.now()-start<seconds*1000){
 const boss=page.getByRole('button',{name:'Face the Yarn Giant',exact:true});
 if(await boss.isVisible().catch(()=>false)){await boss.click();await page.waitForFunction(()=>window.__depthReview?.sceneReady===true,{},{timeout:60000});}
 if(await page.getByRole('heading',{name:'The last lantern stays lit',exact:true}).isVisible().catch(()=>false))break;
 await page.waitForTimeout(500);
}
const raw=await page.evaluate(()=>window.__idleProbe);
await browser.close();

const summary={};
for(const [c,rows] of Object.entries(raw.samples)){
 // A frozen run: currentTime unchanged across consecutive samples.
 const runs=[];let from=0;
 for(let i=1;i<=rows.length;i++){
  const same=i<rows.length&&rows[i][1]===rows[from][1];
  if(!same){const dur=rows[i-1][0]-rows[from][0];if(dur>=100)runs.push({at:+(rows[from][0]/1000).toFixed(2),ms:Math.round(dur),paused:rows.slice(from,i).some(r=>r[2]),seeking:rows.slice(from,i).some(r=>r[3]),ct:+rows[from][1].toFixed(2),ready:rows[from][4]});from=i;}
 }
 const loops=rows.filter((r,i)=>i&&r[1]<rows[i-1][1]-1).length;
 const span=(rows.at(-1)[0]-rows[0][0])/1000;
 const pauses=raw.calls.filter(x=>x.cat===c.split('#')[0]&&x.op==='pause');
 summary[c]={seconds:+span.toFixed(1),loops,frozenRuns:runs.length,frozenWhilePaused:runs.filter(r=>r.paused).length,frozenWhilePlaying:runs.filter(r=>!r.paused).length,
  frozenMsTotal:runs.reduce((s,r)=>s+r.ms,0),pauseCalls:pauses.length,longest:runs.sort((a,b)=>b.ms-a.ms).slice(0,4),playingStalls:runs.filter(r=>!r.paused).map(r=>[r.at,r.ms,r.ct]),
  pauseCallers:Object.entries(pauses.reduce((m,p)=>(m[p.stack]=(m[p.stack]??0)+1,m),{})).sort((a,b)=>b[1]-a[1]).slice(0,3)};
}
console.log(JSON.stringify({summary,errors},null,1));
