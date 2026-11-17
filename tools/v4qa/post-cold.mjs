/** Complete QA fixture metadata, adjudicate closed-detail layout flags, then safe local checks. */
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {loadavg} from 'node:os';
import {requestAllowed} from './network-policy.mjs';
const qa='/Users/bao/taskbar-hero-qa',source='/Users/bao/taskbar-hero-qa-clone';
const reportRoot=resolve(qa,'reports/v4-qa'),dist=resolve(qa,'work/v4qa/production-1/dist');
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>['PATH','HOME','USER','LOGNAME','SHELL','TMPDIR','LANG','LC_ALL','PNPM_HOME'].includes(k)));
const save=(name,data)=>writeFileSync(resolve(reportRoot,name),JSON.stringify(data,null,2)+'\n');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(ok,message)=>{if(!ok)throw Error(message);};
async function guard(label){
  while(loadavg()[0]>9){console.log(`DEFER ${label} load1=${loadavg()[0].toFixed(2)}`);await sleep(300000);}
  assert(!existsSync(resolve(qa,'STOP-V4QA')),'STOP-V4QA');
  console.log(`START ${label} load1=${loadavg()[0].toFixed(2)}`);
}
const raw=JSON.parse(readFileSync(resolve(reportRoot,'Q1/q1-cold-1/results.json'),'utf8'));
assert(raw.ended&&raw.runs.length===3&&raw.runs.every(r=>r.ended),'Initial cold run must finish first');
assert(!existsSync(resolve(reportRoot,'Q2/metadata-postbuild-check.json')),'Never overwrite completed evidence');
const hashes=()=>{
 const result={};
 const walk=dir=>{for(const entry of readdirSync(dir,{withFileTypes:true})){
  const path=resolve(dir,entry.name);
  if(entry.isDirectory())walk(path);
  else if(/\.(?:js|css|html)$/.test(path))result[relative(dist,path)]=createHash('sha256').update(readFileSync(path)).digest('hex');
 }};walk(dist);return result;
};
async function command(cmd,args,cwd=source){
 return await new Promise((res,rej)=>{
  const child=spawn(cmd,args,{cwd,env,stdio:'inherit'});
  child.on('error',rej);child.on('exit',code=>code===0?res():rej(Error(`${cmd} exit ${code}`)));
 });
}
await guard('unchanged metadata postbuild');
const before=hashes();
await command('node',[resolve(source,'tools/chain/economy-v3-metadata.mjs'),`--out=${dist}/relics`]);
const after=hashes();
const unchanged=JSON.stringify(before)===JSON.stringify(after);assert(unchanged,'Runtime/index assets changed unexpectedly');
const padded=readdirSync(resolve(dist,'relics')).filter(n=>/^[0-9a-f]{64}\.json$/.test(n));
const quality=padded.find(n=>{const id=BigInt('0x'+n.slice(0,64));return id>4n&&id<30001n;});
assert(quality,'Quality metadata sample absent');
const qualityId=BigInt('0x'+quality.slice(0,64)).toString();
const names=[quality,qualityId+'.json',(30001n).toString(16).padStart(64,'0')+'.json','30001.json'];
const http=[];
for(const name of names){
 const response=await fetch(`http://127.0.0.1:6200/relics/${name}`);
 const text=await response.text();let metadata;try{metadata=JSON.parse(text);}catch{}
 http.push({path:'/relics/'+name,status:response.status,contentType:response.headers.get('content-type'),valid:response.ok&&!!metadata?.name&&!!metadata?.image});
}
save('Q2/metadata-postbuild-check.json',{at:new Date().toISOString(),sourceSha:raw.sourceSha,scope:'QA fixture omission corrected after initial run; initial cold run did not test these metadata files',runtimeIndexHashesUnchanged:unchanged,hashes:after,paddedMetadataFiles:padded.length,sampledHttp:http});
assert(http.every(r=>r.valid),'Metadata HTTP sample failed');
await guard('read-only closed-details adjudication');
const require=createRequire(resolve(qa,'apps/web/package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});
const layouts=[];
try{
 for(const viewport of [{width:1440,height:900},{width:1280,height:720},{width:390,height:844}]){
  const context=await browser.newContext({viewport,locale:'en-US'});
  await context.route('**/*',async route=>{
   const r=route.request();
   if(requestAllowed({url:r.url(),method:r.method(),body:r.postData(),local:true,allowGuestTx:false}))await route.continue();else await route.abort();
  });
  const page=await context.newPage();await page.goto('http://127.0.0.1:6200',{waitUntil:'networkidle',timeout:30000});
  const inspect=()=>page.evaluate(()=>{
   const outside=[],ignored=[];
   for(const e of document.querySelectorAll('button,a,input,h1,h2,p,dt,dd,figcaption')){
    const s=getComputedStyle(e),r=e.getBoundingClientRect();
    if(!r.width||!r.height||s.visibility==='hidden'||s.display==='none'||e.closest('[inert],[aria-hidden="true"]'))continue;
    if(r.left>=-2&&r.right<=innerWidth+2)continue;
    const d=e.closest('details:not([open])'),inSummary=d?.querySelector(':scope > summary')?.contains(e);
    const row={tag:e.tagName,label:e.getAttribute('aria-label'),text:(e.textContent??'').slice(0,100),left:r.left,right:r.right,closedDetails:!!d&&!inSummary};
    (row.closedDetails?ignored:outside).push(row);
   }
   return {pageWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,overflowX:document.documentElement.scrollWidth>innerWidth+2,outsideVisible:outside,closedDetailsIgnored:ignored};
  });
  const closed=await inspect();await page.getByLabel('Audio mixer',{exact:true}).click();const open=await inspect();
  layouts.push({viewport,closed,open});await context.close();
 }
}finally{await browser.close();}
save('Q1/layout-adjudication.json',{at:new Date().toISOString(),sourceSha:raw.sourceSha,scope:'Fresh read-only landing probes; independently opened/closed audio details; raw cold-run verdicts preserved',layouts});
console.log('COMPLETE metadata samples and layout adjudication');
await command('python3',[resolve(qa,'tools/v4qa/local-checks.py')],qa);
