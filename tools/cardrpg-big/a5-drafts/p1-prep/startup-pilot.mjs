// REFERENCE: ../cardrpg-big2/flag-off-check.mjs. A-owned copy for reserved port5913; no B file edits.
// REFERENCE: apps/web/src/main.tsx; game/squad/gate.ts. Browser mode needs the shared lock.
import { build } from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/vite/dist/node/index.js';
import {pixelPackingPlugin} from '/tmp/cardrpg-a5-p1-prep/pixel-packing.mjs';
import { chromium } from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, relative, extname } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve(process.env.BIG_REPO_ROOT || '/Users/bao/taskbar-hero-cardrpg-a4');
const source=resolve(process.env.BIG_FLAG_OFF_SOURCE || root);
const directory=resolve(process.env.BIG_FLAG_OFF_DIST || '/tmp/cardrpg-a-look-l0-flagoff-dist');
const output=resolve(root,process.env.BIG_FLAG_OFF_OUT || 'reports/cardrpg-big/look-ui/flagoff');
await mkdir(output,{recursive:true});
if(process.argv.includes('--prepare')){
 const chunks={};
 const result=await build({root:resolve(source,'apps/web'),configFile:resolve(source,'apps/web/vite.config.ts'),envDir:false,logLevel:'error',
  plugins:process.env.A5_PACK_PIXELS==='1'?[pixelPackingPlugin()]:[],build:{outDir:directory,emptyOutDir:true}});
 // Vite can inject preload maps and rename chunks after generateBundle.
 // Inventory the final returned output, and prove it matches bytes on disk.
 for(const bundle of Array.isArray(result)?result:[result])for(const file of bundle.output){
  if(file.type!=='chunk')continue;
  const emitted=await readFile(resolve(directory,file.fileName));
  assert.ok(emitted.equals(Buffer.from(file.code)),`Final output differs on disk: ${file.fileName}`);
  chunks[file.fileName]={bytes:emitted.length,sha256:createHash('sha256').update(emitted).digest('hex'),
   imports:file.imports,dynamicImports:file.dynamicImports,modules:Object.keys(file.modules).map(id=>relative(source,id))};
 }
 assert.ok(Object.keys(chunks).length>0);
 await writeFile(`${directory}/build-receipt.json`,JSON.stringify({head:process.env.BIG_FLAG_OFF_HEAD || execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),source,method:'Final Vite build output, verified byte-for-byte against written chunks',harnessSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),chunks},null,2));
 console.log(JSON.stringify({prepared:true,chunks:Object.keys(chunks).length,directory}));
}else{
 const receiptBytes=await readFile(`${directory}/build-receipt.json`);
 const receipt=JSON.parse(receiptBytes);
 const harnessSha256=createHash('sha256').update(await readFile(import.meta.filename)).digest('hex');
 const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
 const server=createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://127.0.0.1:5913');
   const file=resolve(directory,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
   if(!file.startsWith(directory+'/')||!(await stat(file)).isFile())throw Error('Not a file');
   res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
 });
 await new Promise((done,reject)=>{server.once('error',reject);server.listen(5913,'127.0.0.1',done);});
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
 const requests=[],external=[],errors=[];let result,page;
 try{
  page=await browser.newPage({viewport:{width:Number(process.env.BIG_STARTUP_WIDTH||1280),height:Number(process.env.BIG_STARTUP_WIDTH||1280)===1440?900:720}});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.BIG_STARTUP_CPU||1)});
  await page.addInitScript(()=>{window.__a4Startup={frames:[],longTasks:[]};let last;
   requestAnimationFrame(function tick(t){if(last)window.__a4Startup.frames.push(t-last);last=t;requestAnimationFrame(tick);});
   new PerformanceObserver(list=>window.__a4Startup.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});});
  const beginMetrics=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.protocol.startsWith('http')&&url.origin!=='http://127.0.0.1:5913'){
    external.push(url.origin+url.pathname);return route.abort();
   }
   return route.continue();
  });
  page.on('request',r=>requests.push(new URL(r.url()).pathname));page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5913/');
  // A fresh profile opens onboarding, which makes the underlying app inert and
  // excludes its heading from the accessibility tree. Exercise the real entry.
  await page.getByRole('heading',{name:'How to play',exact:true}).waitFor();
  
  const requestsBeforeOnboardingDismissal=[...requests];
  await page.getByRole('button',{name:'Start playing',exact:true}).click();
  await page.getByRole('heading',{name:'Lantern Cat Café',exact:true}).waitFor();
  await page.waitForTimeout(5000);
  
  const loaded=[...new Set(requests.filter(path=>path.endsWith('.js')))];
  const chunks=loaded.map(path=>({path,...receipt.chunks[path.slice(1)]}));
  assert.ok(chunks.length>0);assert.ok(chunks.every(chunk=>chunk.modules),'Every loaded script must map to the measured production build');
  for(const chunk of chunks)assert.equal(createHash('sha256').update(await readFile(resolve(directory,'.'+chunk.path))).digest('hex'),chunk.sha256,'Loaded chunk must still match its build inventory');
  const prohibitedModules=[...new Set(chunks.flatMap(c=>c.modules).filter(id=>/node_modules[\\/]three[\\/]|game[\\/]squad[\\/]turn3d[\\/]|\.glb(?:\?|$)/.test(id)))];
  const modelRequests=requests.filter(path=>/\.glb$|\/art\/turn3d\//.test(path));
  const endMetrics=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  const observations=await page.evaluate(()=>window.__a4Startup);
  const cold={width:Number(process.env.BIG_STARTUP_WIDTH||1280),cpu:Number(process.env.BIG_STARTUP_CPU||1),taskSeconds:endMetrics.TaskDuration-beginMetrics.TaskDuration,scriptSeconds:endMetrics.ScriptDuration-beginMetrics.ScriptDuration,layoutSeconds:endMetrics.LayoutDuration-beginMetrics.LayoutDuration,...observations};
  result={cold,method:'Fresh production default URL with no demo/squad query; visible first-run How to play dialog, real Start playing click, visible app heading and five seconds of runtime. Every requested JS chunk hash-checked against its Vite module inventory. External network blocked. This proves three/model exclusion across this startup observation, not byte-identical application behavior.',harnessSha256,buildReceiptSha256:createHash('sha256').update(receiptBytes).digest('hex'),buildHead:receipt.head,requestsBeforeOnboardingDismissal,requests,externalBlocked:external,errors,chunks,prohibitedModules,modelRequests};
  assert.deepEqual(prohibitedModules,[]);assert.deepEqual(modelRequests,[]);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({scripts:chunks.length,prohibitedModules,modelRequests,errors}));
 }finally{
  if(page){
   await writeFile(`${output}/readiness-dom.json`,JSON.stringify(await page.evaluate(()=>({title:document.title,text:document.body.innerText,headings:[...document.querySelectorAll('h1,h2,h3')].map(el=>({tag:el.tagName,text:el.textContent})),buttons:[...document.querySelectorAll('button')].map(el=>el.textContent)})).catch(error=>({error:String(error)})),null,2));
   
  }
  await browser.close();await new Promise(done=>server.close(done));
  await writeFile(`${output}/checks.json`,JSON.stringify(result??{harnessSha256,requests,externalBlocked:external,errors,incomplete:true},null,2));
 }
}
