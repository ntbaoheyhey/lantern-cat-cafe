/** Small fixed-workload experiment before current-game CPU attribution. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,toolchain} from './qa-toolchain.mjs';
import {summarizeCpuProfile} from './cpu-profile-summary.mjs';
const root=resolve(import.meta.dirname,'../..'),base=resolve(root,'work/v5/CXI/batch-m/cpu-profile-study-r1'),out=resolve(base,'pilot');
const research=JSON.parse(await readFile(resolve(base,'research.json')));
assert.ok(Date.now()>=Date.parse(research.implementationNotBeforeUTC));assert.ok(Date.now()<Date.parse('2026-11-18T17:48:34Z'));
for(const n of ['STOP-ALL','STOP-CXI'])assert.ok(!existsSync('/Users/bao/taskbar-hero-mailbox/'+n));
assert.ok(!existsSync(out));await mkdir(out);
const hash=b=>createHash('sha256').update(b).digest('hex');
const iterations=120_000_000;
function expectedWork(n){let x=71;for(let i=0;i<n;i++)x=(Math.imul(x^i,1664525)+1013904223)|0;return x;}
const expected=expectedWork(iterations),report={utc:new Date().toISOString(),url:'about:blank',viewport:[1280,720],researchStartedUTC:research.studyStartedUTC,researchNotBeforeUTC:research.implementationNotBeforeUTC,iterations,expected,samplingIntervalUs:1000,toolchain,harnessSha256:hash(await readFile(import.meta.filename)),trials:[],pass:false,productionAcceptance:false};
await writeFile(resolve(out,'host-before.txt'),execFileSync('ps',['-axo','pid,pcpu,etime,comm']));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});report.browser=browser.version();
try{
 for(const [i,sampled] of [false,true,true,false].entries()){
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('about:blank');
  await page.evaluate(()=>{globalThis.cpuKnownWork=function cpuKnownWork(n){let x=71;for(let i=0;i<n;i++)x=(Math.imul(x^i,1664525)+1013904223)|0;return x;};globalThis.cpuKnownWork(100_000);});
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Performance.enable',{timeDomain:'timeTicks'});await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});
  if(sampled)await cdp.send('Profiler.start');
  const before=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  const result=await page.evaluate(n=>{const start=performance.now(),value=globalThis.cpuKnownWork(n);return {value,workMs:performance.now()-start};},iterations);
  await page.waitForTimeout(250);
  const after=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  const row={i,sampled,utc:new Date().toISOString(),result,errors,before,after,delta:Object.fromEntries(Object.keys(before).map(k=>[k,after[k]-before[k]]))};
  if(sampled){
   const {profile}=await cdp.send('Profiler.stop'),path=resolve(out,`trial-${i}.cpuprofile`),bytes=JSON.stringify(profile);
   await writeFile(path,bytes);row.profile={path,sha256:hash(bytes)};row.summary=summarizeCpuProfile(profile);
   assert.ok(row.summary.allSelf.some(n=>n.functionName==='cpuKnownWork'&&n.samples>0),'Known workload missing from samples');
  }
  assert.equal(result.value,expected);assert.deepEqual(errors,[]);report.trials.push(row);
  await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await page.close();
 }
 report.pass=true;report.finishedUTC=new Date().toISOString();
 report.limits=['Protocol/data-path proof only; four small trials do not estimate overhead reliably.','No game source, media, native layout, frame-rate or release acceptance.'];
 await writeFile(resolve(out,'host-after.txt'),execFileSync('ps',['-axo','pid,pcpu,etime,comm']));
}finally{await browser.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({pass:report.pass,browser:report.browser,expected,trials:report.trials.map(r=>({sampled:r.sampled,workMs:r.result.workMs,samples:r.summary?.samples,knownSamples:r.summary?.allSelf.find(n=>n.functionName==='cpuKnownWork')?.samples,tailMs:r.summary?.unassignedTailMs}))}));
