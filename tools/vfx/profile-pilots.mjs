import {createRequire} from 'node:module';import {resolve} from 'node:path';import {writeFile,readFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const hardware=process.env.VFX_GPU==='1',browser=await chromium.launch(hardware?{headless:false,args:['--use-angle=metal']}:{headless:true}),page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1}),rows=[];
try{
 await page.goto((process.env.C2_URL??'http://127.0.0.1:5970')+'/@fs'+resolve(root,'tools/vfx/preview.html'));await page.waitForFunction(()=>window.vfxPreview?.scene.ready);
 const ids=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',')??['mochi-1','mochi-4','enemy:yarn-giant'];
 for(const id of ids){
  await page.evaluate(async({id,before})=>{const g=window.vfxPreview;g.setManual(true);g.choose(id);g.setBefore(before);await g.scene.effects.ready;},{id,before:process.env.VFX_BEFORE==='1'});await page.waitForFunction(()=>window.vfxPreview.scene.ready);
  rows.push(await page.evaluate(async id=>{
   const g=window.vfxPreview,intervals=[],renders=[];let begin=0,last=0;
   await new Promise(resolve=>{function frame(now){if(!begin)begin=now;if(last)intervals.push(now-last);last=now;const start=performance.now();g.sample((now-begin)%(g.fixture.plan.duration+400));renders.push(performance.now()-start);if(now-begin<6000)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
   const sorted=intervals.slice(30).sort((a,b)=>a-b),r=renders.slice(30).sort((a,b)=>a-b);return {id,frames:sorted.length,fps:1000/(sorted.reduce((a,b)=>a+b,0)/sorted.length),medianMs:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.floor(sorted.length*.95)],renderP95Ms:r[Math.floor(r.length*.95)],viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,failed:g.scene.effects.layered.stats.failed};
  },id));console.log(rows.at(-1));
 }
 const renderer=await page.evaluate(()=>{const gl=document.querySelector('canvas[data-look-spine]').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 const file='/Users/bao/art/vfx-2026-11-12/review/'+(process.env.VFX_BEFORE==='1'?'profile-before':'profile')+(hardware?'-gpu':'')+'.json';
 const previous=await readFile(file,'utf8').then(JSON.parse,()=>({rows:[]}));
 await writeFile(file,JSON.stringify({renderer,hardware,recording:false,rows:[...previous.rows.filter(r=>!rows.some(n=>n.id===r.id)),...rows]},null,2));
}finally{await browser.close();}
