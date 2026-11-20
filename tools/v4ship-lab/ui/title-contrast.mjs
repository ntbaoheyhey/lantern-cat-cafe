/** Compare title treatments on the shipping build, then verify actual CSS. LEARN/S11-title-contrast.md. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {observeDocument} from './observe.mjs';

const root=resolve(import.meta.dirname,'../../..'),[mode,attempt,buildNumber]=process.argv.slice(2);
assert(['compare','verify'].includes(mode)&&/^\d+$/.test(attempt)&&/^\d+$/.test(buildNumber));
const output=resolve(root,`reports/v4-ship/S11/title-contrast-${mode}-${attempt}.json`);
assert(!existsSync(output));
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')),'STOP-V4SHIP');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git(['branch','--show-current']),'codex/v4-ship-2026-11-16');stop();
const buildPath=`reports/v4-ship/S8/production-build-${buildNumber}.json`,build=JSON.parse(readFileSync(resolve(root,buildPath)));
assert(build.ready&&build.buildComplete);
assert.equal(git(['diff','--name-only',build.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions']),'');
const entry=await fetch('http://127.0.0.1:5998');
assert(entry.ok&&hash(Buffer.from(await entry.arrayBuffer()))===build.indexSha256);
const selector='.b-landing .b-hero>h1.t-title';
const solid='background:none;background-clip:border-box;-webkit-background-clip:border-box;color:#ffedab;filter:none;text-shadow:none;';
const backing='background:#171529;border:1px solid #68516c;border-radius:14px;box-sizing:border-box;width:max-content;max-width:100%;padding:36px 20px 24px;';
const methods=mode==='compare'?[['original',''],['solid-on-art',`${selector}{${solid}}`],['solid-on-backplate',`${selector}{${solid}${backing}}`]]:[['actual-production-css','']];
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={at:new Date().toISOString(),mode,sourceCommit:git(['rev-parse','HEAD']),build:buildPath,indexSha256:build.indexSha256,harnessSha256:hash(readFileSync(import.meta.filename)),observerSha256:hash(readFileSync(resolve(root,'tools/v4ship-lab/ui/observe.mjs'))),methods:methods.map(([name,css])=>({name,css})),rows:[],profiles:[],screenshots:[],pass:false,scope:'Only the landing title and landing geometry/names; no battle, whole-journey or global UI gate claim.'};
const save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
const safe=value=>String(value).replace(/0x[\da-f]{64,}/gi,'[hash]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,240);
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  stop();const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),cdp=await context.newCDPSession(page);
  const profile={width,height,errors:[],blocked:[],failedRequests:[]};report.profiles.push(profile);
  page.on('pageerror',e=>profile.errors.push(safe(e.message)));
  page.on('console',e=>{if(e.type()==='error')profile.errors.push(safe(e.text()));});
  page.on('requestfailed',r=>profile.failedRequests.push({path:new URL(r.url()).pathname,error:safe(r.failure()?.errorText)}));
  await context.route('**/*',async route=>{
   const r=route.request(),u=new URL(r.url()),local=['blob:','data:'].includes(u.protocol)||u.hostname==='127.0.0.1'&&['5998','5997','8546'].includes(u.port),font=u.protocol==='https:'&&r.method()==='GET'&&(u.hostname==='fonts.googleapis.com'&&r.resourceType()==='stylesheet'||u.hostname==='fonts.gstatic.com'&&r.resourceType()==='font');
   if(local||font)await route.continue();else{profile.blocked.push(u.origin+u.pathname);await route.abort();}
  });
  try{
   await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');
   await page.getByRole('button',{name:'Play free',exact:true}).waitFor();
   await page.evaluate(()=>document.fonts.ready);
   for(const [method,css] of methods){
    stop();const style=css?await page.addStyleTag({content:css}):null;
    try{
     await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     const observation=await page.evaluate(observeDocument),titles=observation.texts.filter(t=>['Lantern','Cat Café'].includes(t.text));
     const geometry=await page.locator(selector).evaluate(title=>{
      const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};},bounds=box(title),s=getComputedStyle(title),rects=[],walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);let node;
      while(node=walker.nextNode()){if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width&&r.height)rects.push({left:r.left,top:r.top,right:r.right,bottom:r.bottom});}
      const buttons=[...document.querySelectorAll('.b-actions button,.b-trailer-link')].map(e=>({name:e.textContent.trim(),...box(e)})),footer=box(document.querySelector('.b-landing-bottom'));
      return {bounds,rects,background:s.backgroundColor,foreground:s.color,backgroundClip:s.backgroundClip,backgroundImage:s.backgroundImage,filter:s.filter,padding:s.padding,titleTextInsideBackplate:rects.every(r=>r.left>=bounds.left&&r.right<=bounds.right&&r.top>=bounds.top&&r.bottom<=bounds.bottom),buttons,footer,controlsClearOfFooter:buttons.every(b=>b.top>=bounds.bottom&&b.bottom<footer.top&&b.left>=0&&b.right<=innerWidth),titleInsideViewport:bounds.left>=0&&bounds.right<=innerWidth&&bounds.top>=0&&bounds.bottom<=innerHeight};
     });
     const ax=await cdp.send('Accessibility.getFullAXTree'),roles=['button','link','checkbox','slider','textbox','combobox','img','image'],controls=ax.nodes.filter(n=>!n.ignored&&roles.includes(n.role?.value)).map(n=>({role:n.role.value,name:n.name?.value??''}));
     report.rows.push({width,height,method,titles,geometry,proseWords:observation.proseWords,contrastUnknown:observation.texts.filter(t=>t.contrast==='unknown').length,contrastFailures:observation.texts.filter(t=>t.contrast==='fail'),clipping:observation.texts.filter(t=>t.clipping.length),horizontalOverflow:observation.horizontalOverflow,brokenImages:observation.brokenImages,unnamedControls:controls.filter(c=>!c.name.trim()),titlePass:titles.length===2&&titles.every(t=>t.contrast==='pass')&&geometry.titleTextInsideBackplate&&geometry.controlsClearOfFooter&&geometry.titleInsideViewport});
     save();
     if(mode==='verify'){
      const path=resolve(root,`reports/v4-ship/S11/title-contrast-${attempt}-${width}.png`);assert(!existsSync(path));
      const capture=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width,height,scale:1024/width}});
      writeFileSync(path,Buffer.from(capture.data,'base64'));report.screenshots.push({width:1024,viewport:[width,height],path:relative(root,path),sha256:hash(readFileSync(path))});save();
     }
    }finally{if(style)await style.evaluate(e=>e.remove());}
   }
  }finally{await context.close();}
 }
 const chosen=report.rows.filter(r=>r.method===(mode==='compare'?'solid-on-backplate':'actual-production-css'));
 report.pass=chosen.length===2&&chosen.every(r=>r.titlePass&&!r.contrastFailures.length&&!r.clipping.length&&!r.horizontalOverflow&&!r.brokenImages.length&&!r.unnamedControls.length&&r.proseWords<=25)&&report.profiles.every(p=>!p.errors.length&&!p.blocked.length&&!p.failedRequests.length);
}catch(error){report.failure=safe(error.message);}
finally{await browser.close();save();}
console.log(JSON.stringify({pass:report.pass,rows:report.rows.map(r=>({width:r.width,method:r.method,titlePass:r.titlePass,ratios:r.titles.map(t=>t.ratio),unknown:r.contrastUnknown,containment:r.geometry.titleTextInsideBackplate,controlsClear:r.geometry.controlsClearOfFooter})),output:relative(root,output),failure:report.failure}));
if(!report.pass)process.exitCode=1;
