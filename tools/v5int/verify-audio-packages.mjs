/** Exact source hashes + native decoding and engine fallback; no synthesized audio. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,readFile,writeFile,rm,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,judgeUrl,runtimeEvidence} from './production-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve(root,'work/v5/CXI/audio-delivery',label);
try{await access(out);throw Error('Use a new evidence label');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});
const temp=await mkdtemp('/tmp/tbh-audio-audit-'),require=createRequire(resolve(root,'apps/web/package.json'));
const groups=JSON.parse(await readFile(resolve(root,'apps/web/src/audio/packed-audio-index.json'),'utf8'));
const sourceHashes=Object.assign({},...JSON.parse(await readFile(resolve(root,'work/v5/CXI/audio-delivery/source-hashes.json'),'utf8')).map(group=>group.sourceHashes));
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),judgeUrl,...runtimeEvidence(),viewport:{width:1280,height:720},decoded:[],fallback:[],complete:false};
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const entry=resolve(temp,'entry.ts');
 await writeFile(entry,`export {PackedAudioLoader} from '${root}/apps/web/src/audio/packed-audio-loader.ts';\nexport {AudioEngine} from '${root}/apps/web/src/audio/engine.ts';`);
 const {build}=await import(require.resolve('vite'));
 await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',build:{outDir:temp,emptyOutDir:false,minify:false,lib:{entry,formats:['es'],fileName:()=> 'audit.mjs'}}});
 const harness=await readFile(resolve(temp,'audit.mjs'));report.moduleSha256=createHash('sha256').update(harness).digest('hex');
 const page=await browser.newPage({viewport:report.viewport,serviceWorkers:'block'});
 await page.route('**/__cxi_audio_audit.mjs',route=>route.fulfill({contentType:'text/javascript',body:harness}));
 await page.goto(judgeUrl);
 report.decoded=await page.evaluate(async({groups,sourceHashes})=>{
  const {PackedAudioLoader}=await import('/__cxi_audio_audit.mjs');
  const loader=new PackedAudioLoader(),ctx=new AudioContext(),rows=[];
  const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  try{
   for(const group of groups){
    loader.allow(group.paths);
    for(const path of group.paths){
     const started=performance.now();let encodedHash;
     const packed=await loader.decode(path,async bytes=>{encodedHash=await hash(bytes);return ctx.decodeAudioData(bytes);});
     if(!packed||encodedHash!==sourceHashes[path])throw Error('Package hash/decode mismatch: '+path);
     const response=await fetch(path);if(!response.ok)throw Error('Missing original: '+path);
     const original=await ctx.decodeAudioData(await response.arrayBuffer());
     if(packed.numberOfChannels!==original.numberOfChannels||packed.length!==original.length||packed.sampleRate!==original.sampleRate)throw Error('PCM shape mismatch: '+path);
     const pcm=[];
     for(let channel=0;channel<packed.numberOfChannels;channel++){
      const a=await hash(packed.getChannelData(channel).buffer),b=await hash(original.getChannelData(channel).buffer);
      if(a!==b)throw Error('PCM sample mismatch: '+path);pcm.push(a);
     }
     rows.push({path,encodedHash,pcm,channels:packed.numberOfChannels,samples:packed.length,sampleRate:packed.sampleRate,duration:packed.duration,elapsedMs:Math.round((performance.now()-started)*100)/100});
    }
   }
   const repeated=await loader.decode(groups[0].paths[0],bytes=>ctx.decodeAudioData(bytes));if(!repeated)throw Error('Consumed buffer retry failed');
   return rows;
  }finally{await ctx.close();}
 },{groups,sourceHashes});
 await page.close();
 const group=groups.find(group=>group.url.includes('/b2-hits.')),path=group.paths[0];
 for(const mode of ['http','integrity','decode','stall']){
  const page=await browser.newPage({viewport:report.viewport,serviceWorkers:'block'}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__cxi_audio_audit.mjs',route=>route.fulfill({contentType:'text/javascript',body:harness}));
  let candidate={...group};
  if(mode==='decode'){
   const body=JSON.parse(await readFile(resolve(root,'apps/web/public',group.url.slice(1))));body.files[path]='AAAA';
   const bytes=Buffer.from(JSON.stringify(body));candidate.integrity='sha256-'+createHash('sha256').update(bytes).digest('base64');
   await page.route('**'+group.url,route=>route.fulfill({contentType:'application/json',body:bytes}));
  }else await page.route('**'+group.url,async route=>{
   if(mode==='http')return route.fulfill({status:503,contentType:'application/json',body:await readFile(resolve(root,'apps/web/public',group.url.slice(1)))});
   if(mode==='integrity')return route.fulfill({contentType:'application/json',body:'{}'});
   await new Promise(resolve=>setTimeout(resolve,2500));try{await route.abort();}catch{/* Timeout already aborted. */}
  });
  await page.goto(judgeUrl);
  const row=await page.evaluate(async({group,path,mode})=>{
   const {AudioEngine,PackedAudioLoader}=await import('/__cxi_audio_audit.mjs');
   const requested=[],native=window.fetch.bind(window);window.fetch=(input,options)=>{requested.push(String(input));return native(input,options);};
   const loader=new PackedAudioLoader([group]);loader.allow(group.paths);
   const manifest={version:1,packs:{test:{opus:path,m4a:path.replace(/\.opus$/,'.m4a'),preferredFormat:'opus'}},cues:{'hit.blunt':[{pack:'test',start:0,duration:.1,bus:'sfx'}]}};
   const engine=new AudioEngine(()=>0,'/audio/',async()=>manifest,loader);await engine.unlock();
   const start=performance.now();engine.play('hit.blunt');
   while(!engine.hits.length&&performance.now()-start<5000)await new Promise(resolve=>setTimeout(resolve,20));
   const result={mode,result:engine.hits.at(-1)?.result,elapsedMs:Math.round(performance.now()-start),requested};engine.pause(true);return result;
  },{group:candidate,path,mode});
  assert.equal(row.result,'played',mode+' original fallback');assert(row.requested.includes(group.url));assert(row.requested.includes(path));
  assert(!row.requested.includes(path.replace(/\.opus$/,'.m4a')),'Native Opus should recover before the alternate codec');
  report.fallback.push({...row,injectedErrors:errors});await page.close();
 }
 report.complete=true;
}finally{
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await rm(temp,{recursive:true,force:true});
}
console.log(JSON.stringify({report:resolve(out,'report.json'),decoded:report.decoded.length,fallback:report.fallback.map(({mode,result,elapsedMs})=>({mode,result,elapsedMs})),complete:report.complete}));
