// Sequential local inference only. No browser, remote generation, or rig acceptance.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,rename,access,unlink,rmdir} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

const {values:args}=parseArgs({options:{submit:{type:'boolean'},plan:{type:'boolean'},
  'smoke-review':{type:'string'},limit:{type:'string'}}});
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const external=resolve(homedir(),'art/look-v3/local-generation');
const queuePath=resolve(root,'reports/cardrpg-look/art-rebuild/r2/local-queue.json');
const queue=JSON.parse(await readFile(queuePath,'utf8'));
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const exists=p=>access(p).then(()=>true,()=>false);
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const save=async(p,v)=>{await writeFile(p+'.tmp',JSON.stringify(v,null,2)+'\n');await rename(p+'.tmp',p);};
// A recovered export is still review-required, but must never trigger another
// inference merely because its original generation receipt records a timeout.
for(const row of queue.rows.filter(r=>r.status==='RECOVERED_NOT_REVIEWED')){
  const recovered=await read(row.recovery?.receipt);
  if(recovered.status!=='EXPORTED_REVIEW_REQUIRED'||recovered.unit!==row.id
      ||recovered.modelRequests!==0||recovered.modelSha256!==row.recovery.modelSha256
      ||await hash(recovered.model)!==recovered.modelSha256)
    throw Error('Recovered export changed; inspect before continuing '+row.id);
}
const pending=queue.rows.filter(r=>!['GENERATED_NOT_REVIEWED','RECOVERED_NOT_REVIEWED','FAILED_MAX_ATTEMPTS'].includes(r.status));
if(args.plan){console.log(JSON.stringify({pending:pending.map(r=>r.id),preserved:queue.preserved,oneAtATime:true}));process.exit(0);}
if(!args.submit||!args['smoke-review'])throw Error('Explicit --submit --smoke-review REVIEW.json required; --plan is read-only');
const limit=Number(args.limit??pending.length);
if(!Number.isInteger(limit)||limit<1||limit>25)throw Error('limit must be 1..25');
const review=await read(resolve(args['smoke-review']));
const smoke=await read(review.receipt);
if(review.approvedForRoster!==true||!review.comparison||!smoke.smoke||smoke.status!=='GENERATED_NOT_REVIEWED'
   ||review.modelSha256!==smoke.modelSha256||await hash(smoke.model)!==smoke.modelSha256)
  throw Error('A recorded, inspected smoke comparison is required before roster inference');
const weights=await read(resolve(homedir(),'art/look-v3/local-setup/weights.json'));
if(weights.status!=='CACHED')throw Error('Wait for the existing weight download; never start a duplicate');
await mkdir(external,{recursive:true});
const lock=external+'/.roster-running';
await mkdir(lock); // Do not delete another runner's lock.
let stopped=false,child;
async function stopOwnedChild(){
  if(!child)return;
  const lease=await read('/tmp/cardrpg-big-locks/timing.lock/owner.json').catch(()=>null);
  if(lease?.pid===child.pid){
    const owner=await read(external+'/.running/owner.json').catch(()=>null);
    // The Python owner terminates its own detached inference group and writes
    // its receipt. Let run-lock release the lease normally afterwards.
    if(owner?.pid)try{process.kill(owner.pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}
  }else child.kill('SIGTERM'); // This runner is still waiting, with no model child.
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopped=true;void stopOwnedChild();});
const shouldStop=async()=>stopped||await exists(root+'/STOP-B')||Date.now()>=Date.parse('2026-11-20T12:00:00Z');
async function cooldown(seconds){
  for(let i=0;i<seconds;i+=2){if(await shouldStop())return;await delay(2000);}
}
try{
  await save(lock+'/owner.json',{pid:process.pid,startedAt:new Date().toISOString(),smokeReview:resolve(args['smoke-review'])});
  let count=0;
  for(const row of pending){
    if(count>=limit||await shouldStop())break;
    if(queue.preserved.includes(row.id))throw Error('Never regenerate completed source '+row.id);
    const ledger=external+'/roster/'+row.id;
    row.attempts=[];
    for(let n=1;n<=queue.maxAttempts;n++){
      const path=ledger+`/attempt-${n}.json`;
      if(await exists(path))row.attempts.push(await read(path));
    }
    let success=row.attempts.find(r=>r.status==='GENERATED_NOT_REVIEWED');
    while(!success&&row.attempts.length<queue.maxAttempts&&!await shouldStop()){
      const n=row.attempts.length+1,seed=row.seed+(n-1)*1000;
      const out=external+`/outputs/${row.id}/attempt-${n}`;
      await mkdir(dirname(out),{recursive:true});
      const command=['tools/cardrpg-look/skills-v5/full/run-lock.mjs','LOCAL-MPS-'+row.id,
        'nice','-n','10',resolve(homedir(),'tools/cardrpg-look/venv/bin/python'),
        'tools/cardrpg-look/art-rebuild/image-to-3d.py','--backend','local-mps','--submit',
        '--id',row.id,'--seed',String(seed),'--pipeline-type',row.pipelineType,
        '--texture-size',String(row.textureSize),'--source-faces',String(row.sourceFaces??100000),
        '--uv-backend',row.uvBackend??'xatlas','--out',out];
      row.status='WAITING_LEASE_OR_GENERATING';await save(queuePath,queue);
      console.log(JSON.stringify({unit:row.id,attempt:n,seed,status:row.status}));
      const code=await new Promise((done,reject)=>{
        child=spawn(process.execPath,command,{cwd:root,stdio:'inherit',env:{...process.env,LOOK_LOCK_POLL_MS:'250'}});
        const timer=setInterval(()=>{void shouldStop().then(stop=>{if(stop)void stopOwnedChild();});},2000);
        child.once('error',e=>{clearInterval(timer);reject(e);});
        child.once('close',code=>{clearInterval(timer);done(code);});
      });child=null;
      const path=ledger+`/attempt-${n}.json`;
      if(!await exists(path))throw Error(`Runner stopped before receipt (${row.id}, exit ${code}); inspect shared setup before retrying`);
      const receipt=await read(path);row.attempts.push(receipt);
      success=receipt.status==='GENERATED_NOT_REVIEWED'?receipt:null;
      row.status=success?'GENERATED_NOT_REVIEWED':'RETRY_PENDING';await save(queuePath,queue);
      if(receipt.elapsedSeconds>900)await cooldown(120);
    }
    row.status=success?'GENERATED_NOT_REVIEWED':row.attempts.length>=queue.maxAttempts?'FAILED_MAX_ATTEMPTS':'INTERRUPTED';
    row.runtimeAccepted=false;await save(queuePath,queue);count++;
    console.log(JSON.stringify({unit:row.id,status:row.status,attempts:row.attempts.length,runtimeAccepted:false}));
  }
}finally{
  await unlink(lock+'/owner.json').catch(e=>{if(e.code!=='ENOENT')throw e;});await rmdir(lock);
}
