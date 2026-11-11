// Select representative legal seeded encounters; never modify published rules.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(process.env.PUPPET_PREVIEW_ROOT||process.cwd());
const require=createRequire(root+'/apps/web/package.json');
const {createServer}=await import(require.resolve('vite'));
const out=resolve(process.env.ART_OUT);await mkdir(out,{recursive:true});
const vite=await createServer({configFile:false,root:root+'/apps/web',envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
try{
 const R=await vite.ssrLoadModule('/@fs/'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
 const candidates=[];
 for(const seed of [20261110,17,71]){
  let state=R.createDepthAccount(seed);state=R.setGameplayV4(state,true);state=R.setSkillsV5(state,true);state=R.setGameplayA6(state,true);
  // A progression showcase, not a first-session fixture. Derive every stat and
  // unlocked skill from the same level-six account used by the visible HUD.
  for(const card of state.account.cards)card.level=6;
  const cats=R.battleCats(state);
  if(cats.some(c=>!c.skills.includes(c.id+'-4')))throw Error('Showcase requires legitimately unlocked ultimate kits');
  for(const chapter of [1,2,3])for(const node of R.generateMap(seed,chapter).filter(n=>['battle','elite','boss'].includes(n.kind))){
   const enemies=node.enemies,boss=node.kind==='boss';
   const setup={seed,chapter,cats,enemies,gameplayV4:true,skillsV5:true,gameplayA6:true};
   const battle=R.playBattle(R.createBattle(setup),'auto');
   const ultimates=battle.choices.filter(c=>c.skillId.endsWith('-4')).length;
   const enemyUltimates=(battle.v4?.events??[]).filter(e=>e.kind==='ultimate.cast'&&!e.skillId.endsWith('-4')).length;
   const actions=battle.log.filter(e=>e.kind==='action').length;
   const estimatedSeconds=actions*(boss?1.25:.92)+ultimates*.8+battle.round*.4;
   candidates.push({kind:boss?'boss':'normal',nodeKind:node.kind,setup:battle.initial,account:state,choices:battle.choices,expectedResult:battle.result,rounds:battle.round,ultimates,enemyUltimates,actions,estimatedSeconds,logEntries:battle.log.length});
  }
 }
 await writeFile(out+'/candidates.json',JSON.stringify(candidates.map(({account,setup,choices,...rest})=>({...rest,seed:setup.seed,chapter:setup.chapter,enemies:setup.enemies,choices:choices.length})),null,2)+'\n');
 // More choices provide a useful x1 excerpt; actual duration/ultimate count is
 // verified from the film, rather than inferred from a successful simulation.
 for(const kind of ['normal','boss']){
  const eligible=candidates.filter(c=>c.kind===kind&&c.ultimates>=3);
  if(!eligible.length)throw Error('No legal '+kind+' case has several ultimates');
  eligible.sort((a,b)=>Math.abs(a.estimatedSeconds-75)-Math.abs(b.estimatedSeconds-75));
  await writeFile(out+'/'+kind+'-replay.json',JSON.stringify(eligible[0],null,2)+'\n');
 }
 console.log(JSON.stringify(candidates.filter(c=>c.ultimates>=3).sort((a,b)=>Math.abs(a.estimatedSeconds-75)-Math.abs(b.estimatedSeconds-75)).slice(0,8).map(({kind,setup,choices,expectedResult,rounds,ultimates,estimatedSeconds})=>({kind,seed:setup.seed,chapter:setup.chapter,enemies:setup.enemies,choices:choices.length,result:expectedResult,rounds,ultimates,estimatedSeconds}))));
}finally{await vite.close();}
