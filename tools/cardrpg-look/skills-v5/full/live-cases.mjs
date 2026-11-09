import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {web,requireWeb} from '../../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});
try{
 const load=p=>vite.ssrLoadModule('/@fs/'+process.cwd()+'/'+p);
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),P=await load('apps/web/src/game/cardrpg/depth/battle-presentation.ts'),C=await load('apps/web/src/game/cardrpg/depth/card-action-plan.ts'),V=await load('apps/web/src/game/squad/turn3d/card-v5-events.ts'),S=await load('apps/web/src/game/squad/turn3d/card-status-beats.ts');
 const registrations=JSON.parse(await readFile(process.env.V5_REGISTRATION)),chosen=new Map();
 const pins=process.env.V5_PINNED_CASES?JSON.parse(await readFile(process.env.V5_PINNED_CASES)):null;
 for(const row of registrations){const b=R.createBattle(row.setup);let count=0;
  while(!b.result&&count++<900){const before=P.snapshotBattle(b),actor=R.currentActor(b),choice=actor.side==='party'?R.chooseAction(b,'auto'):null,skillId=choice?.skillId??R.ENEMY_BY_ID[actor.catalogId].role+'Attack';
   if(!(choice?R.act(b,choice):R.enemyAct(b)))throw Error('Rejected live choice');
   const p=P.splitPresentation(before,b,skillId),targets=[...new Set(p.events.flatMap(e=>e.targetIds))];
   const events=[{version:3,seq:0,turn:actor.turns,round:before.round,actionId:b.log.length,beat:0,type:'action_start',actorId:actor.id,skillId,targetIds:targets,amount:0},...p.events];
   const plan=C.createCardActionPlan(events,actor.side==='enemy'?'enemy:'+actor.catalogId:skillId);
   for(const [stage,current,visual,after]of [['action',plan,before,p.impact],['round-end',p.roundPlan,p.impact,b]]){if(!current)continue;
    const source=V.v5SourceForPlan(current,b,visual),view=V.applyV5Presentation(current,S.statusPresentation(current,b.log),source);current.v5=source;
    const at=Math.min(current.duration-1,Math.max(current.beats[2].start,...(view.reactions??[]).map(r=>r.at),...(view.landings??[]).map(r=>r.at))+100);
    const has=(id,side,min=1)=>after.actors.some(a=>a.hp>0&&(!side||a.side===side)&&a.statuses.some(s=>s.id===id&&s.stacks>=min));
    const reaction=(id,count=1)=>(view.reactions??[]).filter(r=>r.id===id).length>=count;
    const shape=(id,count=1)=>(view.landings??[]).filter(r=>r.shape===id).length>=count;
    const phase=b.v4.events.slice(before.v4.events.length).find(e=>e.kind==='boss-phase');
    const hit={P1:has('scald','enemy',5)&&has('scald','party'),P2:has('scent')&&has('drowsy'),P3:has('steep')&&has('cozy'),P4:after.actors.some(a=>a.hp>0&&a.statuses.length>4),P5:(view.landings??[]).filter(l=>l.shape==='row'&&after.actors.find(a=>a.id===l.targetId)?.side==='enemy').length>=3,P6:reaction('crumb-burst',3),P7:view.beats.some(b=>b.statusId==='snag'&&b.kind==='tick'),P8:current.events.some(e=>e.type==='heal'&&e.amount>0&&e.targetIds.some(id=>view.bitterTargets?.has(id))),P9:reaction('wildfire'),P10:reaction('rupture'),P11:reaction('spread'),P12:shape('splash',2),P13:shape('multi-hit',3),P14:shape('bounce',2),P15:!!phase,P16:skillId==='mochi-4'&&stage==='action',P17:skillId==='clover-4'&&stage==='action'};
    for(const [id,found]of Object.entries(hit))if((pins?pins.some(pin=>pin.id===id&&pin.case===row.id&&pin.action===count&&pin.stage===stage):found)&&!chosen.has(id)){
     const frame={battle:structuredClone(after),plan:structuredClone(current),at:pins?.find(pin=>pin.id===id)?.frame.at??(id==='P17'?current.beats[3].start+current.beats[3].duration*.5:at)};
     chosen.set(id,{id,name:'live-'+id,mode:'LIVE RULES REPLAY FRAME',case:row.id,seed:row.seed,round:before.round,action:count,skillId,stage,frame,...(id==='P15'?{bossTransition:phase}:{})});
    }
   }
  }
 }
 const fixtures=JSON.parse(await readFile('/tmp/cardrpg-v5full-m1/cases.json'));
 const rows=fixtures.map(f=>chosen.get(f.id)??{...f,mode:'FIXTURE ONLY — not observed in registered live seeds'});
 await writeFile(out+'/cases.json',JSON.stringify(rows));
 const index=rows.map(({frame,...r})=>({...r,frameSha256:frame?createHash('sha256').update(JSON.stringify(frame)).digest('hex'):null}));
 await writeFile(out+'/index.json',JSON.stringify(index,null,2));console.log(JSON.stringify(index));
}finally{await vite.close()}
