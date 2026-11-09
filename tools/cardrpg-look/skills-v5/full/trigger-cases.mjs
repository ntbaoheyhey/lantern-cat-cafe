// Focused follow-up of the seven unverified natural-coverage cells. Real rules only.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {web,requireWeb} from '../../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});
try{
 const load=p=>vite.ssrLoadModule('/@fs/'+process.cwd()+'/'+p);
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),P=await load('apps/web/src/game/cardrpg/depth/battle-presentation.ts'),C=await load('apps/web/src/game/cardrpg/depth/card-action-plan.ts'),V=await load('apps/web/src/game/squad/turn3d/card-v5-events.ts'),S=await load('apps/web/src/game/squad/turn3d/card-status-beats.ts');
 const K=await load('packages/game-rules/src/cardrpg/depth/skills-v5/kits.ts'),H=await load('packages/game-rules/src/cardrpg/depth/skills-v5/shapes.ts');
 const registrations=JSON.parse(await readFile(process.env.V5_REGISTRATION)),chosen=new Map();
 for(const row of registrations){const b=R.createBattle(row.setup);let count=0;
  while(!b.result&&count++<900){const before=P.snapshotBattle(b),actor=R.currentActor(b),choice=actor.side==='party'?R.chooseAction(b,'auto'):null,skillId=choice?.skillId??R.ENEMY_BY_ID[actor.catalogId].role+'Attack';
   if(!(choice?R.act(b,choice):R.enemyAct(b)))throw Error('Rejected live choice');
   const p=P.splitPresentation(before,b,skillId),targets=[...new Set(p.events.flatMap(e=>e.targetIds))];
   const events=[{version:3,seq:0,turn:actor.turns,round:before.round,actionId:b.log.length,beat:0,type:'action_start',actorId:actor.id,skillId,targetIds:targets,amount:0},...p.events];
   const plan=C.createCardActionPlan(events,actor.side==='enemy'?'enemy:'+actor.catalogId:skillId);
   const source=V.v5SourceForPlan(plan,b,before),view=V.applyV5Presentation(plan,S.statusPresentation(plan,b.log),source);plan.v5=source;
   const candidates=view.beats.filter(x=>x.kind==='trigger').map(x=>({key:'status:'+x.statusId+':trigger',target:x.targetId,at:x.at+80}));
   if(choice){const original=R.skillById(skillId),shape=H.shapeV5(K.kitSkillV5(original));
    if(['single','pierce'].includes(shape))candidates.push({key:'shape:'+shape,target:plan.targetIds[0],at:plan.beats[2].start+plan.beats[2].duration*.55});
   }
   if(view.bitterTargets?.size&&!source?.events.length&&plan.events.some(e=>e.type==='heal'&&e.amount>0&&e.targetIds.some(id=>view.bitterTargets.has(id))))candidates.push({key:'plain-bitter-heal',at:plan.beats[2].start+80});
   for(const c of candidates)if(!chosen.has(c.key))chosen.set(c.key,{id:'T'+(chosen.size+1),name:c.key.replaceAll(':','-'),key:c.key,target:c.target,case:row.id,seed:row.seed,round:before.round,action:count,skillId,mode:'LIVE RULES REPLAY FRAME',frame:{battle:structuredClone(p.impact),plan:structuredClone(plan),at:c.at}});
  }
 }
 const rows=[...chosen.values()];await writeFile(out+'/cases.json',JSON.stringify(rows));await writeFile(out+'/index.json',JSON.stringify(rows.map(({frame,...row})=>row),null,2));console.log(JSON.stringify(rows.map(({frame,...row})=>row)));
 if(rows.length!==8)throw Error('Expected five triggers, two shapes and one plain Bitter heal; measured '+rows.length);
}finally{await vite.close()}
