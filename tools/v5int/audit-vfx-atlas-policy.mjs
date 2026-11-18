/** Source routing experiment. Real render branches; canvas calls, not pixels. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..'), app=resolve(root,'apps/web');
const req=createRequire(resolve(app,'package.json')), {createServer}=await import(req.resolve('vite'));
const out=resolve(root,'work/v5/CXI/preload/policy-r1');await mkdir(out,{recursive:true});
const sha=data=>createHash('sha256').update(data).digest('hex');
const server=await createServer({root:app,configFile:false,server:{middlewareMode:true,fs:{allow:[root]}},logLevel:'error'});
const fixtures=[], rows=[], verified=[];globalThis.devicePixelRatio=1;
try {
 const load=path=>server.ssrLoadModule(resolve(root,path));
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const {DepthModel}=await load('apps/web/src/game/cardrpg/depth/model.ts');
 const {SpineScene}=await load('apps/web/src/game/cardrpg/spine/scene.ts');
 const {PaintedVfx}=await load('apps/web/src/game/cardrpg/spine/vfx.ts');
 const {LayeredVfx,PAINT_TIMELINES}=await load('apps/web/src/game/cardrpg/vfx-layered/player.ts');
 const {FieldVfx}=await load('apps/web/src/game/cardrpg/battle-v3/field-vfx.ts');
 const {V5SkillPlayer}=await load('apps/web/src/game/cardrpg/vfx-layered/skill-player.ts');
 const {pilotFixture}=await load('apps/web/src/game/cardrpg/vfx-layered/fixture.ts');
 const {canNarrowBattleAtlases,prepareBattleAtlases}=await load('apps/web/src/game/cardrpg/spine/effect-preload-selection.ts');
 const packed=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/vfx-packed/manifest.json')));
 for(const path of ['packages/game-rules/src/cardrpg/depth/formation-c2.ts','apps/web/src/game/cardrpg/depth/model.ts',
  'apps/web/src/game/cardrpg/depth/passive-presentation.ts','apps/web/src/game/cardrpg/depth/battle-presentation.ts',
  'apps/web/src/game/cardrpg/vfx-layered/fixture.ts','apps/web/src/game/cardrpg/spine/scene.ts','apps/web/src/game/cardrpg/spine/vfx.ts',
  'apps/web/src/game/cardrpg/vfx-layered/player.ts','apps/web/src/game/cardrpg/battle-v3/field-vfx.ts',
  'apps/web/src/game/cardrpg/vfx-layered/skill-player.ts','apps/web/src/game/cardrpg/spine/effect-preload-selection.ts']) {
  verified.push({path:resolve(root,path),sha256:sha(await readFile(resolve(root,path)))});
 }
 const enemies=['button-guard','sock-skipper','spool-ram','needle-moth','teacup-healer','kettle-knight','yarn-giant','binding-thread','crumb-sentinel','pollen-scout'];
 const mixed=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),false));assert(mixed.formationC2&&!R.gameplayA6(mixed));
 for(const a6 of [false,true])for(const owner of enemies)for(const charged of [false,true])for(const rage of [false,true])for(const last of [false,true]) {
  let account=R.setGameplayA6(R.setSkillsV5(R.setGameplayV4(R.createDepthAccount(71),true),true),a6);if(a6)account=R.setFormationC2(account);
  const battle=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:a6,formationC2:a6,cats:R.battleCats(account),enemies:[owner,owner==='binding-thread'?'yarn-giant':'binding-thread']});
  const actor=battle.actors.find(a=>a.catalogId===owner),intent=battle.intents.find(i=>i.actorId===actor.id);
  actor.turns=2;actor.bonuses.v5Charge=Number(charged);actor.charge=rage?100:0;intent.signature=charged||rage;
  battle.queue=last?[actor.id]:[actor.id,...battle.queue.filter(id=>id!==actor.id)];battle.v4.committed=true;
  const model=new DepthModel(true);Object.assign(model,{state:account,tutorialBattle:battle,sceneReady:true,sceneStarted:true,watching:true,screen:'map'});model.act();assert(model.plan);
  const name=`${a6?'a6':'legacy'}-${owner}-${charged}-${rage}-${last}`;
  fixtures.push({name,battle,plan:model.plan,kind:'action',a6});
  if(model.roundPlan)fixtures.push({name:name+'-round',battle,plan:model.roundPlan,kind:'round',a6});
 }
 for(const owner of enemies)for(const suffix of ['',':basic'])for(const preparation of [false,true]) {
  const f=pilotFixture('enemy:'+owner+suffix,preparation);fixtures.push({...f,name:`gallery-${owner}${suffix}-${preparation}`,kind:'gallery',a6:!!f.battle.initial.gameplayA6});
 }
 for(const owner of ['mochi','soot','clover','panko']) {
  const f=pilotFixture(owner+'-passive');assert(f.plan.presentationCues?.includes(owner+'-passive'));
  fixtures.push({...f,name:'passive-'+owner,kind:'gallery-passive',a6:false});
 }
 for(const f of fixtures)for(const override of [false,true])for(const reduced of [false,true])for(const layers of [false,true]) {
  const actors=f.battle.actors.map(a=>({...a,cardRpg:{cardId:a.catalogId}}));
  const owners=[...new Set(actors.map(a=>a.catalogId))].sort(),effects=new Map();
  if(override)effects.set(f.plan.presentationId??f.plan.skillId,{});
  // Legacy fixtures are also sampled through a C2 view. Their A6 provenance
  // remains false, so an archived/mixed configuration cannot narrow preload.
  const view={actors,formationC2:true,battleKey:{...f.battle.initial,formationC2:true},galleryPreview:f.kind.startsWith('gallery'),reducedMotion:reduced,quality:'high',frame:{plan:f.plan,elapsed:0}};
  let selected;await prepareBattleAtlases({ready:Promise.resolve(),overrides:{effects},prepare:async ids=>{selected=[...ids];}},owners,true,canNarrowBattleAtlases(view));
  const removed=owners.filter(x=>!selected.includes(x));
  if(!f.a6||override||view.galleryPreview)assert.equal(removed.length,0);
  const scene=Object.assign(Object.create(SpineScene.prototype),{effectsLoaded:true,effects:{overrides:{effects}},actors:new Map(actors.map(a=>[a.id,{asset:a.catalogId}]))});
  const socket=(id,part)=>actors.some(a=>a.id===id)?{x:id===f.plan.actorId?250:850,y:part==='feet'?520:part==='head'?290:380}:undefined;
  function painter(keep) {
   const calls=[];const canvas=new Proxy({drawImage:(image,...args)=>{if(image.atlas)calls.push({atlas:image.atlas,args});},createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(target,key)=>Reflect.get(target,key)??(()=>{})});
   const layered=new LayeredVfx(socket);for(const [id,entry] of Object.entries(packed.entries))if(keep.includes(PAINT_TIMELINES.get(id)?.owner))layered.images.set(id,{...entry,image:{atlas:entry.page},sourceUrl:'audit-only.webp'});
   const timeline=new V5SkillPlayer(socket,{});timeline.render=()=>{};timeline.audit={draws:0,particles:0};
   const paint=Object.assign(Object.create(PaintedVfx.prototype),{canvas:{width:1280,height:720},ctx:canvas,layered,useLayered:layers,socket,
    overrides:{effects,render(){},stats:{active:0}},timeline,blendLayers:{begin(){},passes:[]},field:new FieldVfx(socket,id=>layered.images.get(id)),
    glow:{render(){}},pool:[],stamps:{get:()=>({})},stats:{peak:0,draws:0,active:0},hitAt:-Infinity,damageTargets:[],healTargets:[],shieldTargets:[],faceMask:{},legacyMask:{}});
   return {paint,calls};
  }
  const full=painter(owners),filtered=painter(selected),before=JSON.stringify([f.battle,f.plan]);
  const contact=f.plan.beats[2].start,times=[...new Set([0,100,175,350,600,1100,1400,1800,2199,contact-1,contact,contact+70,contact+300,f.plan.duration-1].filter(t=>t>=0))].sort((a,b)=>a-b);
  let count=0;const pages=new Set();
  for(const elapsed of [...times,null,null]) {
   view.frame=elapsed===null?null:{plan:f.plan,elapsed};
   const time=elapsed===null?f.plan.duration/1000+1:elapsed/1000;
   full.calls.length=0;filtered.calls.length=0;
   const craft=scene.craftHandles(view.frame?.plan??null);
   full.paint.render(view,time,1280,720,[],craft);filtered.paint.render(view,time,1280,720,[],craft);
   assert.deepEqual(filtered.calls,full.calls,f.name+' '+elapsed+' atlas draw parity');
   count+=full.calls.length;for(const call of full.calls)pages.add(call.atlas);
  }
  assert.equal(JSON.stringify([f.battle,f.plan]),before);
  rows.push({fixture:f.name,kind:f.kind,a6:f.a6,override,reduced,layers,removed,samples:times.length+2,atlasDraws:count,atlases:[...pages]});
 }
} finally {await server.close();}
const raw=resolve(out,'rows.json');await writeFile(raw,JSON.stringify(rows)+'\n');
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),verified,
 harnessSha256:sha(await readFile(import.meta.filename)),raw:{path:raw,sha256:sha(await readFile(raw))},fixtures:fixtures.length,cases:rows.length,
 fixtureKinds:Object.fromEntries([...new Set(fixtures.map(f=>f.kind))].map(k=>[k,fixtures.filter(f=>f.kind===k).length])),
 comparedSamples:rows.reduce((n,r)=>n+r.samples,0),removedCases:rows.filter(r=>r.removed.length).length,atlasDrawParity:true,gameStateUnchanged:true,mixedC2DoesNotEnableA6:true,
 limits:'Real PaintedVfx.render and SpineScene.craftHandles branches, real layered/field consumers; dummy atlas handles/non-rendering canvas. V5/craft/override pixels and glow are not tested here. No native pixels or byte-budget acceptance.',releaseAccepted:false};
await writeFile(resolve(root,'reports/v5/CXI/evidence/v8-vfx-atlas-policy-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:report.cases,fixtures:report.fixtureKinds,comparedSamples:report.comparedSamples,removedCases:report.removedCases,atlasDrawParity:true}));
