// Golden presentation examples selected on TRAIN only, never balance estimates.
import {createRequire} from 'node:module';
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json')),{build}=await import(require.resolve('vite'));
const tmp=await mkdtemp('/tmp/cardrpg-v5a-fixture-'),entry=resolve(tmp,'entry.ts');
await writeFile(entry,`export * as R from '${root}/packages/game-rules/src/cardrpg/depth/index.ts';export * as L from '${root}/packages/game-rules/src/cardrpg/catalog.ts';`);
await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:tmp,minify:false,lib:{entry,formats:['es'],fileName:()=> 'rules.mjs'}}});
const {R,L}=await import(pathToFileURL(resolve(tmp,'rules.mjs')).href),fixtures=[],search=[];
const cases=[
 {id:'crumb-burst',crew:['soot','marigold','inkcap'],enemies:['button-guard','spool-ram','teacup-healer']},
 {id:'wildfire',crew:['mallow','cinnamon','mochi'],enemies:['button-guard','sock-skipper','teacup-healer']},
 {id:'rupture',crew:['velvet','biscuit','brioche'],enemies:['button-guard','kettle-knight','sock-skipper']},
 {id:'spread',crew:['velvet','biscuit','brioche'],enemies:['button-guard','teacup-healer','needle-moth']},
 {id:'boss',crew:['clover','sorrel','panko'],enemies:['yarn-giant']},
];
const state=b=>b.actors.map(a=>({id:a.id,hp:a.hp,shield:a.shield,statuses:structuredClone(a.statuses)}));
try{
 for(const c of cases){let found=false;
  for(let seed=1;seed<=20;seed++){
   const b=R.createBattle({seed,chapter:1,gameplayV4:true,skillsV5:true,cats:c.crew.map(id=>({id,stats:{...L.CARDS.find(x=>x.id===id).baseStats},row:R.CAT_BY_ID[id].row,skills:R.CAT_BY_ID[id].skills.map(s=>s.id)})),enemies:c.enemies}),actions=[];
   for(let n=0;!b.result&&n<900;n++){
    const before=state(b),actor=R.currentActor(b),logStart=b.log.length,eventStart=b.v4.events.length;
    if(actor.side==='enemy')assert(R.enemyAct(b));else assert(R.act(b,R.chooseAction(b,'auto')));
    actions.push({actionId:b.procRounds.v5ActionSequence,round:b.log.slice(logStart).find(e=>['action','enemy-action'].includes(e.kind))?.round,actorId:actor.id,logStart,logEnd:b.log.length,eventStart,eventEnd:b.v4.events.length,before,after:state(b)});
   }
   assert(b.result);const reactions=b.v4.events.filter(e=>e.kind==='reaction').map(e=>e.reactionId);
   const match=c.id==='boss'?b.v4.events.some(e=>e.kind==='status-applied'&&e.statusId==='bitter'):reactions.includes(c.id);
   search.push({id:c.id,seed,result:b.result,rounds:b.round,reactions:[...new Set(reactions)],selected:match});
   if(!match)continue;
   assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
   assert(b.v4.events.every((e,i)=>R.validBattleEventV5(e,i,true)));
   fixtures.push({id:c.id,seed,initial:b.initial,choices:b.choices,events:b.v4.events,log:b.log,actions,result:b.result,rounds:b.round,battleSha256:createHash('sha256').update(JSON.stringify(b)).digest('hex')});found=true;break;
  }
  assert(found,`No natural TRAIN example for ${c.id}`);
 }
 const output='packages/game-rules/src/cardrpg/depth/skills-v5/fixtures/events-v2.json';await mkdir(resolve(output,'..'),{recursive:true});
 const value={version:2,selection:'First natural auto battle with required cue among TRAIN seeds1–20. Examples, not acceptance estimates.',timing:{reactionMaxMs:600,staggerMs:[60,90],insideAction:true},search,fixtures};
 await writeFile(output,JSON.stringify(value,null,2)+'\n');console.log(JSON.stringify({fixtures:fixtures.map(f=>({id:f.id,seed:f.seed,events:f.events.length,rounds:f.rounds})),bytes:Buffer.byteLength(JSON.stringify(value,null,2)+'\n')}));
}finally{await rm(tmp,{recursive:true,force:true});}
