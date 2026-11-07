// Complete all inherited fresh-page/first/repeat cases, yielding the shared lock between configurations and integrated six-action batches.
// Artifacts and source receipts remain immutable; run after functional phase checks.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,link,readdir,access,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const configs=[[1280,720,1,1,'medium'],[1280,720,2,1,'medium'],[1440,900,1,1,'medium'],[1440,900,2,1,'medium'],[1280,720,1,4,'medium'],[1280,720,2,4,'medium'],[1440,900,1,4,'medium'],[1440,900,2,4,'medium'],[1280,720,1,1,'low'],[2560,1440,1,1,'medium']];
const outputs={b2a:'cats/batch1',b2b:'cats/batch2',b2c:'cats/batch3',b3:'stage',b5:'b5',b4:'b4',e1:'enemies/e1',e2:'enemies/e2',e3:'enemies/e3',e4:'enemies/e4',boss:'enemies/boss',delivery:'delivery',hitstop:'audio/hitstop',review:'review',integrated:'integration'};
const owners={b2a:['panko','mallow','sorrel'],b2b:['biscuit','inkcap','cinnamon'],b2c:['brioche','velvet','marigold'],e1:['button-guard','sock-skipper','spool-ram'],e2:['needle-moth','teacup-healer','kettle-knight'],e3:['binding-thread','practice-cushion','pollen-scout'],e4:['crumb-sentinel'],boss:['yarn-giant','rain-spool','pantry-crown']};
const phases=process.argv.slice(2);if(!phases.length||phases.some(p=>!outputs[p]))throw Error('Explicit known phases required');
async function run(args,env={}){
 const exit=await new Promise((done,reject)=>{const child=spawn(process.execPath,args,{env:{...process.env,...env},stdio:'inherit'});child.once('error',reject);child.once('close',done)});if(exit!==0)throw Error(`Matrix command exited ${exit}: ${args.join(' ')}`);
}
// Six actions per lock hold keep interruption recovery bounded and let Lane A
// acquire the machine between short batches. Every action still gets a new page.
async function integratedBatches(shard,artifact,sha,config){
 const combined={artifact,sha256:sha,started:new Date().toISOString(),rows:[]};
 let actions;
 for(let offset=0;!actions||offset<actions.length;offset+=6){
  const batch=`${shard}/batches/${offset}`;
  let prior=await readFile(`${batch}/summary.json`,'utf8').then(JSON.parse).catch(error=>{
   if(error.code!=='ENOENT')throw error;return null;
  });
  const ids=actions?.slice(offset,offset+6).map(action=>action.id);
  const valid=prior?.ended&&prior.sha256===sha&&prior.fullGalleryActions?.length===86&&
   prior.rows.length===Math.min(6,86-offset)&&prior.rows.every(row=>row.casts?.length===2&&!row.errors?.length)&&
   JSON.stringify(prior.actions?.map(action=>action.id))===JSON.stringify((ids??prior.fullGalleryActions?.slice(0,6).map(action=>action.id)));
  if(!valid){
   if(prior)await cp(batch,`${shard}/batch-attempts/${offset}-${new Date().toISOString().replaceAll(':','-')}`,{recursive:true});
   await run(['tools/cardrpg-big2/with-timing-lock.mjs',process.execPath,'tools/cardrpg-big2/skill-measure.mjs'],{
    BIG_ARTIFACT:artifact,BIG_SKILL_CONFIGS:JSON.stringify([config]),BIG_SKILL_OUT:batch,
    BIG_SKILL_OWNERS:'',BIG_SKILL_IDS:ids?.join(',')??'',BIG_SKILL_LIMIT:ids?'':'6',
   });
   prior=JSON.parse(await readFile(`${batch}/summary.json`,'utf8'));
  }
  actions??=prior.fullGalleryActions;
  const expected=actions.slice(offset,offset+6).map(action=>action.id);
  if(actions.length!==86||prior.sha256!==sha||!prior.ended||
   JSON.stringify(prior.fullGalleryActions)!==JSON.stringify(actions)||
   JSON.stringify(prior.rows.map(row=>row.action.id))!==JSON.stringify(expected)||
   prior.rows.some(row=>JSON.stringify([row.width,row.height,row.dpr,row.cpu,row.quality])!==JSON.stringify(config)||row.errors.length||row.casts.length!==2))
   throw Error('Integrated action batch is incomplete or has inconsistent artifact/configuration/coverage');
  for(const row of prior.rows){
   const target=`${shard}/${row.name}.json`,source=`${batch}/${row.name}.json`;
   if(await access(target).then(()=>true,()=>false)){
    if(!(await readFile(target)).equals(await readFile(source)))throw Error(`Preserved raw array differs: ${target}`);
   }else await link(source,target);
  }
  combined.actions=actions;combined.fullGalleryActions=actions;
  combined.selection={owners:null,ids:null,limit:null,fullGalleryCount:86,measuredActionCount:86,scope:'full roster'};
  combined.rows.push(...prior.rows);
  if(new Set(combined.rows.map(row=>row.name)).size!==combined.rows.length)throw Error('Duplicate integrated matrix cases');
  if(combined.rows.length===86)combined.ended=new Date().toISOString();
  await writeFile(`${shard}/summary.json`,JSON.stringify(combined,null,2));
  console.log(JSON.stringify({integratedBatch:offset,configuration:config,cases:combined.rows.length,resumed:valid}));
  await new Promise(resolve=>setTimeout(resolve,6500));
 }
}
for(const phase of phases){
 const artifact=`/tmp/cardrpg-big2-${phase}-index.html`,directory=`reports/cardrpg-big2/${outputs[phase]}/skills`;
 const sha=createHash('sha256').update(await readFile(artifact)).digest('hex');
 if(phase==='integrated'){
  const accepted=JSON.parse(await readFile('reports/cardrpg-big2/integration/accepted-source.json','utf8'));
  if(!accepted.sourceAccepted||accepted.sha256!==sha||accepted.artifact!==artifact)throw Error('Integrated matrix requires the accepted, pinned main demo');
 }
 const receipt={artifact,sha256:sha,started:new Date().toISOString(),actions:[],rows:[],method:'Identical inherited fresh-page/first-use/repeat-use harness. Ten configurations; integrated measurements release the shared lock every six actions, historical phases once per configuration. Each raw file is linked unchanged from its shard.'};
 await mkdir(`${directory}/shards`,{recursive:true});
 for(const [i,config]of configs.entries()){
  const shard=`${directory}/shards/${i}`;
  let prior=await readFile(`${shard}/summary.json`,'utf8').then(JSON.parse).catch(()=>null);
  const complete=prior?.ended&&prior.sha256===sha&&JSON.stringify(prior.selection?.owners??null)===JSON.stringify(owners[phase]??null)&&prior.rows.length===prior.actions?.length&&prior.rows.every(row=>row.casts?.length===2&&!row.errors?.length);
  if(!complete){
   if(prior)await cp(shard,`${directory}/attempts/${i}-${new Date().toISOString().replaceAll(':','-')}`,{recursive:true});
   if(phase==='integrated')await integratedBatches(shard,artifact,sha,config);
   else await run(['tools/cardrpg-big2/with-timing-lock.mjs',process.execPath,'tools/cardrpg-big2/skill-measure.mjs'],{BIG_ARTIFACT:artifact,BIG_SKILL_OWNERS:owners[phase]?.join(',')??'',BIG_SKILL_CONFIGS:JSON.stringify([config]),BIG_SKILL_OUT:shard});
  }
  prior=JSON.parse(await readFile(`${shard}/summary.json`,'utf8'));
  if(prior.sha256!==sha)throw Error('Artifact changed while measuring');
  receipt.actions=prior.actions;receipt.selection=prior.selection;receipt.fullGalleryActions=prior.fullGalleryActions;receipt.rows.push(...prior.rows);
  for(const row of prior.rows){
   const target=`${directory}/${row.name}.json`;
   if(!await access(target).then(()=>true,()=>false))await link(`${shard}/${row.name}.json`,target);
  }
  receipt.configurationsComplete=i+1;await writeFile(`${directory}/summary.json`,JSON.stringify(receipt,null,2));
  console.log(JSON.stringify({phase,configuration:i+1,cases:receipt.rows.length}));
  // Other lane waiters poll every five seconds; leave a genuine handoff window.
  await new Promise(resolve => setTimeout(resolve, 6500));
 }
 receipt.ended=new Date().toISOString();await writeFile(`${directory}/summary.json`,JSON.stringify(receipt,null,2));
 await run(['tools/cardrpg-big2/skill-report.mjs',directory]);
 await run(['tools/cardrpg-big2/with-timing-lock.mjs',process.execPath,'tools/cardrpg-big/profile-skills.mjs',directory],{BIG_ARTIFACT:artifact});
 console.log(JSON.stringify({phase,complete:true,cases:receipt.rows.length}));
}
