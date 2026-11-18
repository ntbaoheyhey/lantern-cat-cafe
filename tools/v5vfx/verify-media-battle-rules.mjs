/** Replay natural observations with the pinned rules; --plan is an offline roster check. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {loadRules} from '/Users/bao/taskbar-hero-chain/tools/cardrpg-big/a4-load.mjs';
const root='/Users/bao/taskbar-hero-chain',mode=process.argv[2],out=resolve(process.argv[3]??'');
assert(['--plan','--verify'].includes(mode));assert(out.startsWith('/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/'));
const sha=v=>createHash('sha256').update(v).digest('hex'),stable=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const result={utc:new Date().toISOString(),mode,pass:false,runs:[],errors:[],harnessSha256:sha(await readFile(import.meta.filename))};
const destination=resolve(out,mode==='--plan'?'rules-plan.json':'rules-verification.json');assert(!existsSync(destination));await mkdir(out,{recursive:true});
const modules=await loadRules();
try{
 const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
 const step=b=>{const actor=R.currentActor(b);assert(actor);assert(actor.side==='enemy'?R.enemyAct(b):R.act(b,R.chooseAction(b,'auto')));return actor;};
 if(mode==='--plan'){
  const config=JSON.parse(await readFile(resolve(root,'scripts/v3a2/fixtures.json'))),fixture=config.fixtures.find(f=>f.id==='boss'),roster=['mochi','clover','panko','mallow'];
  const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(config.seed),true));state.tutorial=4;
  const template=state.account.cards[0];state.account.cards=roster.map(id=>({...template,id,cardId:id,level:6}));state.team=roster;state.rows=Object.fromEntries(roster.map((id,i)=>[id,i<2?'front':'rear']));state.skills=Object.fromEntries(roster.map(id=>[id,R.CAT_BY_ID[id].skills.map(s=>s.id)]));
  const battle=R.createBattle({seed:config.seed,chapter:fixture.chapter,cats:R.battleCats(state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});battle.v4.committed=true;
  const initialSha256=sha(stable(battle));let actions=0;while(!battle.result&&actions<1000){step(battle);actions++;}
  result.runs.push({roster,initialSha256,actions,result:battle.result,logEvents:battle.log.length,round:battle.round,finalSha256:sha(stable(battle)),actors:battle.actors.map(a=>({id:a.id,hp:a.hp,maxHp:a.maxHp}))});
  assert.equal(battle.result,'party','Full-battle roster must reach victory without modifying rules or HP');
 }else{
  const report=JSON.parse(await readFile(resolve(out,'report.json')));result.sourceCommit=report.servedSource;result.indexSha256=report.indexSha256;
  assert.equal(execFileSync('git',['diff',report.servedSource,'--','packages/game-rules/src'],{cwd:root,encoding:'utf8'}),'','Rules checkout must equal captured source');
  for(const run of report.runs){
   const initial=JSON.parse(await readFile(resolve(out,run.mode,'initial.json'))),timeline=JSON.parse(await readFile(resolve(out,run.mode,'timeline.json'))),actual=timeline.finalBattle,control=structuredClone(initial.battle);assert(actual);
   let actions=0;while(control.log.length<actual.log.length&&actions<1000){step(control);actions++;}
   const comparisons=Object.fromEntries(['log','actors','queue','round','result'].map(k=>[k,stable(control[k])===stable(actual[k])]));
   const row={mode:run.mode,actions,observedActions:run.actions,comparisons,fullBattleExact:stable(control)===stable(actual),replaySha256:sha(stable(control)),observedSha256:sha(stable(actual))};result.runs.push(row);
   assert(Object.values(comparisons).every(Boolean));assert(row.fullBattleExact);assert.equal(actions,run.actions);assert.equal(actual.result,'party');
  }
  assert.equal(result.runs.length,2);assert.equal(result.runs[0].observedSha256,result.runs[1].observedSha256);
 }
 result.pass=true;
}catch(error){result.errors.push(error.stack);process.exitCode=1;}
finally{await modules.vite.close();result.finishedUTC=new Date().toISOString();await writeFile(destination,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({destination,...result}));}
