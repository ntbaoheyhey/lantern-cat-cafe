import {mkdir,writeFile} from 'node:fs/promises';
import {web,requireWeb} from '../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
try{
 const load=p=>vite.ssrLoadModule('/@fs/'+process.cwd()+'/'+p);
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const {snapshotBattle,splitPresentation}=await load('apps/web/src/game/cardrpg/depth/battle-presentation.ts');
 const {createCardActionPlan}=await load('apps/web/src/game/cardrpg/depth/card-action-plan.ts');
 const {STATUS_IDENTITIES}=await load('apps/web/src/game/squad/turn3d/card-status-data.ts');
 const setup=(owner='mochi',enemies=['button-guard','sock-skipper'])=>{
  const a=R.createDepthAccount(71);a.account.cards=R.CATS.map(c=>({id:c.id,cardId:c.id,level:10,stars:3,shards:0,soulbound:true}));
  a.team=[...new Set([owner,'mochi','soot','clover'])].slice(0,3);
  for(const c of R.CATS){a.rows[c.id]=c.row;a.skills[c.id]=c.skills.slice(0,3).map(s=>s.id)}
  return R.createBattle({seed:71,chapter:1,cats:R.battleCats(a),enemies});
 };
 const cast=(id)=>{
  const owner=id.split('-')[0],battle=setup(owner,['button-guard','sock-skipper','teacup-healer']);
  const caster=battle.actors.find(a=>a.catalogId===owner),foes=battle.actors.filter(a=>a.side==='enemy');
  battle.queue=[caster.id,...battle.queue.filter(id=>id!==caster.id)];battle.energy=10;caster.charge=100;caster.skills=R.CAT_BY_ID[owner].skills.map(s=>s.id);
  for(const a of foes){a.row='front';if(owner==='soot')a.statuses=[{id:'crumb',stacks:2,remaining:3,source:caster.id,appliedRound:1}];}
  const before=snapshotBattle(battle);if(!R.act(battle,{actorId:caster.id,skillId:id,targetId:foes[0].id}))throw Error(`Fixture rejected ${id}`);
  const split=splitPresentation(before,battle,id),targets=[...new Set(split.events.flatMap(e=>e.targetIds))];
  const events=[{version:3,seq:0,turn:caster.turns,round:1,actionId:battle.log.length,beat:0,type:'action_start',actorId:caster.id,skillId:id,targetIds:targets,amount:0},...split.events];
  const plan=createCardActionPlan(events,id);
  return {battle,plan,at:plan.beats[2].start+180,raw:battle.log.slice(before.log.length),method:'Staged level10 three-foe setup; existing R.act resolves all event amounts and status applications. Presentation fixture, not a natural starter action.'};
 };
 const fixtures={base:setup(),multi:cast('mallow-2'),burst:cast('soot-4'),statuses:R.STATUSES,identities:STATUS_IDENTITIES};
 await mkdir('reports/cardrpg-look/skills-v5',{recursive:true});
 await writeFile('reports/cardrpg-look/skills-v5/fixtures.json',JSON.stringify(fixtures,null,2));
 console.log(JSON.stringify({multi:fixtures.multi.raw.filter(e=>e.kind==='damage').length,bursts:fixtures.burst.raw.filter(e=>e.kind==='detonate').length}));
}finally{await vite.close()}
