/** Class-only diagnostic. Builds isolated rule variants; production and economy policy stay unchanged. */
import assert from 'node:assert/strict';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {root,quantile} from '../../chain/economy-lab/runtime.mjs';
import {gearAccount} from '../../chain/economy-lab/cohort.mjs';
const checkStop=()=>{if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP requested');};
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
if(!isMainThread){
 const runtime=await import(pathToFileURL(workerData.runtimePath)),config=workerData.config;
 parentPort.on('message',job=>{
  try{
   const profile=config.profiles.find(p=>p.id===job.profile),r=gearAccount(runtime,config,job.seed,profile,{days:20});
   parentPort.postMessage({variant:workerData.variant,...job,firstLegendaryDay:r.firstLegendaryDay,firstLegendarySource:r.firstLegendarySource??null,
    dailyHash:digest(r.daily),day9:r.daily[8],wins:r.daily.reduce((n,d)=>n+d.wins,0),encounters:r.daily.reduce((n,d)=>n+d.encounters,0)});
  }catch(e){parentPort.postMessage({error:e.message});}
 });
}else{
 const folder=resolve(root,'work/v4ship-class-progression');mkdirSync(folder,{recursive:true});
 const manifest=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/S2b/econ/CLASS-FINAL-200.json'))),config=manifest.config;
 const bank=gunzipSync(readFileSync(resolve(root,manifest.cohort.path))).toString().trim().split('\n').map(JSON.parse);
 const require=createRequire(resolve(root,'apps/web/package.json')),{build}=await import(require.resolve('vite'));
 const variants=[{id:'control',party:1,enemy:1},{id:'offense-115',party:1.15,enemy:1},{id:'offense-130',party:1.3,enemy:1},{id:'offense-150',party:1.5,enemy:1},{id:'pressure-130',party:1.3,enemy:1.1},{id:'pressure-150',party:1.5,enemy:1.1}];
 const result={at:new Date().toISOString(),method:'12 paired seeds per casual/heavy profile,20calendar days,unchanged economy. Isolated class actor attack multipliers; no action-clock changes. Diagnostic only, not a200seedgate.',variants:[]};
 const output=resolve(root,'reports/v4-ship/S2b/progression-study.json'),save=()=>writeFileSync(output,JSON.stringify(result,null,2)+'\n');save();
 for(const variant of variants){
  checkStop();
  const out=resolve(folder,variant.id);mkdirSync(out,{recursive:true});const entry=resolve(out,'entry.ts');
  writeFileSync(entry,`export * as R from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/index.ts'))};\nexport {playRun} from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/run-bot.ts'))};\nexport {firstInvitation} from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/onboarding.ts'))};\nexport {gearQualityBp} from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/fusion-v3.ts'))};\n`);
  await build({root,configFile:false,envDir:false,publicDir:false,logLevel:'silent',plugins:[{name:'isolated-class-offense',enforce:'pre',transform(source,id){
   if(!id.endsWith('/depth/gameplay-a6.ts'))return;
   const party="if (actor.side !== 'enemy') continue;",enemy="actor.attack * (b.chapter === 1 ? .65 : .85)";
   assert.equal(source.split(party).length,2);assert.equal(source.split(enemy).length,2);
   if(variant.id==='control')return;
   return source.replace(party,`if(actor.side==='party'){if(actor.combatClass!=='healer')actor.attack=Math.round(actor.attack*${variant.party});continue;}`).replace(enemy,`${enemy} * ${variant.enemy}`);
  }}],build:{emptyOutDir:false,outDir:out,minify:false,lib:{entry,formats:['es'],fileName:()=> 'runtime.mjs'}}});
  const queue=['casual','heavy'].flatMap(profile=>Array.from({length:12},(_,i)=>({profile,seed:90001+i}))),rows=[],active=[];let next=0;
  try{await Promise.all(Array.from({length:2},()=>new Promise((accept,reject)=>{
   const worker=new Worker(new URL(import.meta.url),{workerData:{variant:variant.id,config,runtimePath:resolve(out,'runtime.mjs')}});active.push(worker);
   const dispatch=()=>{if(existsSync(resolve(root,'STOP-V4SHIP'))){reject(Error('STOP-V4SHIP requested'));return;}const job=queue[next++];if(job)worker.postMessage(job);else{void worker.terminate();accept();}};
   worker.on('error',reject);worker.on('message',row=>{
    if(row.error){reject(Error(row.error));return;}
    try{if(variant.id==='control'){
      const original=bank.find(r=>r.profile===row.profile&&r.seed===row.seed);assert(original);assert.equal(row.dailyHash,digest(original.daily.slice(0,20)),'Control must reproduce frozen cohort');
    }rows.push(row);dispatch();}catch(e){reject(e);}
   });dispatch();
  })));}finally{await Promise.all(active.map(w=>w.terminate()));}
  const profiles=['casual','heavy'].map(profile=>{const r=rows.filter(x=>x.profile===profile);return {profile,seeds:r.length,legendaryMedianDay:quantile(r.map(x=>x.firstLegendaryDay??21),.5),censored:r.filter(x=>x.firstLegendaryDay===null).length,day9MedianMaterials:quantile(r.map(x=>x.day9.materials),.5),winRate:r.reduce((n,x)=>n+x.wins,0)/r.reduce((n,x)=>n+x.encounters,0)};});
  result.variants.push({...variant,profiles,rows});save();console.log(JSON.stringify({variant:variant.id,profiles}));
 }
}
