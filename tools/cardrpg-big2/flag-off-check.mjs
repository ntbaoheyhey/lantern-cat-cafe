// REFERENCE: apps/web/src/main.tsx; game/squad/gate.ts. Browser mode needs the shared lock.
import { build } from '../../apps/web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, relative, extname } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../..');
const directory='/tmp/cardrpg-big2-flag-off-dist';
const output=resolve(root,'reports/cardrpg-big2/delivery/flag-off');
await mkdir(output,{recursive:true});
if(process.argv.includes('--prepare')){
 const chunks={};
 await build({root:resolve(root,'apps/web'),configFile:resolve(root,'apps/web/vite.config.ts'),envDir:false,logLevel:'error',
  build:{outDir:directory,emptyOutDir:true},
  plugins:[{name:'lane-b-runtime-receipt',generateBundle(_options,bundle){
   for(const [name,file]of Object.entries(bundle))if(file.type==='chunk')chunks[name]={
    bytes:Buffer.byteLength(file.code),sha256:createHash('sha256').update(file.code).digest('hex'),
    imports:file.imports,dynamicImports:file.dynamicImports,modules:Object.keys(file.modules).map(id=>relative(root,id)),
   };
  }}]});
 await writeFile(`${directory}/build-receipt.json`,JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),chunks},null,2));
 console.log(JSON.stringify({prepared:true,chunks:Object.keys(chunks).length,directory}));
}else{
 const receipt=JSON.parse(await readFile(`${directory}/build-receipt.json`,'utf8'));
 const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
 const server=createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://127.0.0.1:5923');
   const file=resolve(directory,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
   if(!file.startsWith(directory+'/')||!(await stat(file)).isFile())throw Error('Not a file');
   res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
 });
 await new Promise((done,reject)=>{server.once('error',reject);server.listen(5923,'127.0.0.1',done);});
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
 const requests=[],external=[],errors=[];let result;
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.protocol.startsWith('http')&&url.origin!=='http://127.0.0.1:5923'){
    external.push(url.origin+url.pathname);return route.abort();
   }
   return route.continue();
  });
  page.on('request',r=>requests.push(new URL(r.url()).pathname));page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5923/');
  await page.getByRole('heading',{name:'Taskbar Hero',exact:true}).waitFor();
  await page.waitForTimeout(5000);
  await page.screenshot({path:`${output}/default-entry.png`});
  const loaded=[...new Set(requests.filter(path=>path.endsWith('.js')))];
  const chunks=loaded.map(path=>({path,...receipt.chunks[path.slice(1)]}));
  assert.ok(chunks.length>0);assert.ok(chunks.every(chunk=>chunk.modules),'Every loaded script must map to the measured production build');
  const prohibitedModules=[...new Set(chunks.flatMap(c=>c.modules).filter(id=>/node_modules[\\/]three[\\/]|game[\\/]squad[\\/]turn3d[\\/]|\.glb(?:\?|$)/.test(id)))];
  const modelRequests=requests.filter(path=>/\.glb$|\/art\/turn3d\//.test(path));
  result={method:'Fresh production default URL with no demo/squad query; real legacy heading plus five seconds of initial runtime. Every requested JS chunk mapped to Vite module inventory. External network blocked. This proves three/model exclusion in this startup observation, not byte-identical application behavior.',buildHead:receipt.head,requests,externalBlocked:external,errors,chunks,prohibitedModules,modelRequests};
  assert.deepEqual(prohibitedModules,[]);assert.deepEqual(modelRequests,[]);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({scripts:chunks.length,prohibitedModules,modelRequests,errors}));
 }finally{
  await browser.close();await new Promise(done=>server.close(done));
  await writeFile(`${output}/checks.json`,JSON.stringify(result??{requests,externalBlocked:external,errors,incomplete:true},null,2));
 }
}
