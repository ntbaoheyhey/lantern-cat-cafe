/** Execute current source routing and atlas consumers with a non-rendering canvas. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),req=createRequire(resolve(app,'package.json'));
const {createServer}=await import(req.resolve('vite')),sha=x=>createHash('sha256').update(x).digest('hex');
const out=resolve(root,'work/v5/CXI/preload/closure-r1');await mkdir(out,{recursive:true});
const server=await createServer({root:app,configFile:false,server:{middlewareMode:true,fs:{allow:[root]}},logLevel:'error'});
const rows=[],verified=[];
try{
 const load=rel=>server.ssrLoadModule(resolve(root,rel));
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const {DepthModel}=await load('apps/web/src/game/cardrpg/depth/model.ts');
 const {SpineScene}=await load('apps/web/src/game/cardrpg/spine/scene.ts');
 const {LayeredVfx}=await load('apps/web/src/game/cardrpg/vfx-layered/player.ts');
 const {FieldVfx}=await load('apps/web/src/game/cardrpg/battle-v3/field-vfx.ts');
 const {V5SkillPlayer}=await load('apps/web/src/game/cardrpg/vfx-layered/skill-player.ts');
 const {chargeEvent}=await load('apps/web/src/game/cardrpg/depth/card-action-plan.ts');
 const packed=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/vfx-packed/manifest.json')));
 for(const rel of ['apps/web/src/game/cardrpg/depth/model.ts','apps/web/src/game/cardrpg/depth/passive-presentation.ts','apps/web/src/game/cardrpg/spine/scene.ts','apps/web/src/game/cardrpg/spine/vfx.ts','apps/web/src/game/cardrpg/vfx-layered/player.ts','apps/web/src/game/cardrpg/battle-v3/field-vfx.ts','apps/web/src/game/cardrpg/vfx-layered/skill-player.ts']){
  const path=resolve(root,rel);verified.push({path,sha256:sha(await readFile(path))});
 }
 const enemies=['button-guard','sock-skipper','spool-ram','needle-moth','teacup-healer','kettle-knight','yarn-giant','binding-thread','crumb-sentinel','pollen-scout'];
 for(const a6 of [true,false])for(const owner of enemies)for(const charged of [false,true])for(const rage of [false,true]){
  let account=R.setGameplayA6(R.setSkillsV5(R.setGameplayV4(R.createDepthAccount(71),true),true),a6);
  if(a6)account=R.setFormationC2(account);
  const other=owner==='binding-thread'?'yarn-giant':'binding-thread';
  const battle=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:a6,formationC2:a6,cats:R.battleCats(account),enemies:[owner,other]});
  const actor=battle.actors.find(a=>a.catalogId===owner),intent=battle.intents.find(i=>i.actorId===actor.id);
  actor.turns=2;actor.bonuses.v5Charge=Number(charged);actor.charge=rage?100:0;intent.signature=charged||rage;
  battle.queue=[actor.id,...battle.queue.filter(id=>id!==actor.id)];battle.v4.committed=true;
  const model=new DepthModel(true);Object.assign(model,{state:account,tutorialBattle:battle,sceneReady:true,sceneStarted:true,watching:true,screen:'map'});model.act();
  const plan=model.plan;assert(plan,'A real model action must yield a plan');const unchanged=JSON.stringify([battle,plan]);
  const timeline=new V5SkillPlayer(()=>undefined,{}),overrides=new Map();
  const scene=Object.assign(Object.create(SpineScene.prototype),{effectsLoaded:true,effects:{overrides:{effects:overrides}},actors:new Map(battle.actors.map(a=>[a.id,{asset:a.catalogId}]))});
  const socket=(id,part)=>({x:id===actor.id?250:850,y:part==='feet'?520:part==='head'?290:380});
  const layered=new LayeredVfx(socket);
  for(const [id,entry]of Object.entries(packed.entries))layered.images.set(id,{...entry,image:{atlas:entry.page},sourceUrl:'diagnostic-only.webp'});
  const actors=battle.actors.map(a=>({...a,cardRpg:{cardId:a.catalogId}}));
  for(const override of [false,true]){
   if(override)overrides.set(plan.presentationId??plan.skillId,{});else overrides.clear();
   const v5=timeline.handles(plan)&&!override,craft=scene.craftHandles(plan),calls=[];
   const canvas=new Proxy({drawImage:(image,...args)=>calls.push({atlas:image.atlas,args}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(target,key)=>Reflect.get(target,key)??(()=>{})});
   const field=new FieldVfx(socket,id=>layered.images.get(id)),sampled=[];
   for(const elapsed of [0,175,350,600,1100,1400,1800,2199]){
    calls.length=0;const view={actors,formationC2:a6,reducedMotion:false,quality:'high',frame:{plan,elapsed}};
    if(a6&&!v5&&!craft&&!override)layered.render(canvas,view,1280,720);
    if(a6&&!v5&&!craft)field.render(canvas,view,1280,720,elapsed/1000);
    if(calls.length)sampled.push({elapsed,draws:calls.length,atlases:[...new Set(calls.map(c=>c.atlas))]});
   }
   rows.push({a6,owner,charged,rage,override,skillId:plan.skillId,presentationId:plan.presentationId,charge:!!chargeEvent(plan),events:plan.events.map(e=>e.type),cues:plan.presentationCues??[],v5,craft,sampled});
  }
  assert.equal(JSON.stringify([battle,plan]),unchanged,'Audit must not mutate game or plan');
 }
}finally{await server.close();}
const raw=resolve(out,'rows.json');await writeFile(raw,JSON.stringify(rows,null,2)+'\n');
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),verified,
 raw:{path:raw,sha256:sha(await readFile(raw))},cases:rows.length,
 groups:[true,false].flatMap(a6=>[false,true].map(override=>{const group=rows.filter(r=>r.a6===a6&&r.override===override);return{a6,override,cases:group.length,chargePlans:group.filter(r=>r.charge).length,atlasConsumerCases:group.filter(r=>r.sampled.length).length,atlases:[...new Set(group.flatMap(r=>r.sampled.flatMap(s=>s.atlases)))]};})),
 runtimeChanged:false,imagesViewed:0,provenSafeRemovals:[],
 limits:'Source-contract audit using real DepthModel enemy actions and actual render functions, dummy image handles and a non-rendering canvas. Explicit override cases are defensive fallback coverage, not a claim that an override is installed. No browser pixels, natural scheduling, performance or full reachability proof. Legacy passive and round-plan paths remain separate.'};
await writeFile(resolve(root,'reports/v5/CXI/evidence/v8-vfx-preload-closure-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:report.cases,groups:report.groups}));
