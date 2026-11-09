import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {web,requireWeb} from '../../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});const result={rows:[],failures:[],actions:0,plans:0};
try{
 const load=p=>vite.ssrLoadModule('/@fs/'+process.cwd()+'/'+p);
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),P=await load('apps/web/src/game/cardrpg/depth/battle-presentation.ts'),C=await load('apps/web/src/game/cardrpg/depth/card-action-plan.ts'),V=await load('apps/web/src/game/squad/turn3d/card-v5-events.ts'),S=await load('apps/web/src/game/squad/turn3d/card-status-beats.ts');
 const registrations=JSON.parse(await readFile(process.env.V5_REGISTRATION));
 for(const row of registrations){const b=R.createBattle(row.setup);let count=0;
  while(!b.result&&count++<900){const before=P.snapshotBattle(b),actor=R.currentActor(b),choice=actor.side==='party'?R.chooseAction(b,'auto'):null,skillId=choice?.skillId??R.ENEMY_BY_ID[actor.catalogId].role+'Attack';
   if(!(choice?R.act(b,choice):R.enemyAct(b)))throw Error('Rejected live choice');
   result.actions++;
   const p=P.splitPresentation(before,b,skillId),targets=[...new Set(p.events.flatMap(e=>e.targetIds))];
   const events=[{version:3,seq:0,turn:actor.turns,round:before.round,actionId:b.log.length,beat:0,type:'action_start',actorId:actor.id,skillId,targetIds:targets,amount:0},...p.events];
   const plan=C.createCardActionPlan(events,actor.side==='enemy'?'enemy:'+actor.catalogId:skillId);
   for(const [stage,current,visual]of [['action',plan,before],['round-end',p.roundPlan,p.impact]]){if(!current)continue;result.plans++;
    const expected=V.readV5Events(b.v4.events.slice(before.v4.events.length)).filter(e=>e.stage===stage),source=V.v5SourceForPlan(current,b,visual),received=V.readV5Events(source?.events),view=V.applyV5Presentation(current,S.statusPresentation(current,b.log),source);
    const missing=expected.filter(e=>!received.some(r=>r.sequence===e.sequence));const extra=received.filter(e=>!expected.some(r=>r.sequence===e.sequence));
    const outside=[...view.beats,...view.landings??[],...view.reactions??[]].filter(e=>e.at<0||e.at+e.duration>current.duration);
    if(missing.length||extra.length||outside.length)result.failures.push({case:row.id,round:before.round,skillId,stage,action:count,missing,extra,outside});
   }
  }
  const json=JSON.stringify(b),hash=createHash('sha256').update(json).digest('hex');
  globalThis.window={__LOOK_V2__:false};const off=JSON.stringify(R.playBattle(R.createBattle(row.setup),'auto'));globalThis.window={__LOOK_V2__:true};const on=JSON.stringify(R.playBattle(R.createBattle(row.setup),'auto'));
  result.rows.push({id:row.id,actions:count,sha256:hash,registrationExact:hash===row.sha256,onOffExact:on===off,stepExact:json===on});
 }
}finally{delete globalThis.window;await vite.close();await writeFile(out+'/adapter.json.gz',gzipSync(JSON.stringify(result)));console.log(JSON.stringify({...result,failures:result.failures.slice(0,6)}));}

if(result.failures.length||result.rows.some(r=>!r.registrationExact||!r.onOffExact||!r.stepExact))process.exitCode=1;
