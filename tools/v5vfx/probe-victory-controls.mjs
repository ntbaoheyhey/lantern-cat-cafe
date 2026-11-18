/** Natural judge result: measure control hit targets while unlock celebrations are visible. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from '/Users/bao/taskbar-hero-chain/tools/v5int/production-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-E-victory-controls');assert(!existsSync(out));await mkdir(out,{recursive:true});
const hash=v=>createHash('sha256').update(v).digest('hex'),board=await readFile('/Users/bao/taskbar-hero-mailbox/BOARD.md','utf8');
const report={utc:new Date().toISOString(),url:judgeUrl,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),servedSource:board.match(/Currently served candidate:([a-f0-9]{40})/)[1],...runtimeEvidence(),harnessSha256:hash(await readFile(import.meta.filename)),viewport:{width:1280,height:720},method:'Seeded boss; natural speed1 rule-selected battle to result. Sample all result button center/inset corners with elementFromPoint while native unlock celebration is visible. No control activation or account/chain claim. Captures are diagnostic, not performance measurements.',runs:[],pass:false};
const stop=()=>{for(const f of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+f),'STOP: '+f);};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{for(const reduced of [false,true]){
 stop();const mode=reduced?'reduced':'normal',{page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
 await page.evaluate(reduced=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.state.settings.speed=1;m.paused=false;m.notify(false);},reduced);
 const deadline=Date.now()+180000;while(Date.now()<deadline){stop();if(await page.evaluate(()=>window.__depthReview.screen==='result'))break;await page.waitForTimeout(200);}
 assert.equal(await page.evaluate(()=>window.__depthReview.screen),'result');const start=Date.now(),run={mode,utc:new Date().toISOString(),samples:[],captures:[],errors,blockedRequests};
 for(const offset of [0,1000,5500]){
  await page.waitForTimeout(Math.max(0,start+offset-Date.now()));stop();
  const sample=await page.evaluate(()=>{
   const rect=e=>e.getBoundingClientRect().toJSON(),toast=[...document.querySelectorAll('.a6-unlock-toast')].map(e=>({text:e.textContent,rect:rect(e),pointerEvents:getComputedStyle(e).pointerEvents}));
   const buttons=[...document.querySelectorAll('.c2-result button')].filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect(),positions=[[.5,.5],[.1,.1],[.9,.1],[.1,.9],[.9,.9]],points=positions.map(([x,y])=>{x=r.x+r.width*x;y=r.y+r.height*y;const hit=document.elementFromPoint(x,y);return{x,y,hitOwn:!!hit&&e.contains(hit),hit:hit?{tag:hit.tagName,className:hit.className,text:hit.textContent?.slice(0,80)}:null};});return{text:e.textContent,aria:e.getAttribute('aria-label'),rect:rect(e),points};});
   return{screen:window.__depthReview.screen,result:window.__depthReview.battle?.result,toast,buttons};
  });run.samples.push({offset,elapsedMs:Date.now()-start,utc:new Date().toISOString(),...sample});
  if(offset<5500){const path=resolve(out,mode+'-'+offset+'.png');await page.screenshot({path});run.captures.push({offset,path,sha256:hash(await readFile(path))});}
 }
 run.pass=run.samples.every(s=>s.buttons.length&&s.buttons.every(b=>b.points.every(p=>p.hitOwn)))&&!errors.length&&!blockedRequests.length;
 report.runs.push(run);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,pass:run.pass,toasts:run.samples.map(s=>s.toast.map(t=>t.text)),blocked:run.samples.flatMap(s=>s.buttons.filter(b=>b.points.some(p=>!p.hitOwn)).map(b=>b.text)),errors}));await page.close();
}report.pass=report.runs.every(r=>r.pass);report.ended=new Date().toISOString();assert.equal(runtimeEvidence().indexSha256,report.indexSha256);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}finally{await browser.close();}
