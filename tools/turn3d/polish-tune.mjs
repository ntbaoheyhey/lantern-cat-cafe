import {createRequire} from 'node:module';import {resolve} from 'node:path';import fs from 'node:fs';
const root=resolve(import.meta.dirname,'../..'),web=resolve(root,'apps/web'),require=createRequire(resolve(web,'package.json'));
const {createServer}=await import(require.resolve('vite'));const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const {choosePolicyLoot}=await vite.ssrLoadModule(resolve(root,'packages/game-rules/src/squad/gear/run.ts'));
const E=await vite.ssrLoadModule(resolve(root,'packages/game-rules/src/squad/turn/engine.ts'));
const {TURN_CONFIG:C}=await vite.ssrLoadModule(resolve(root,'packages/game-rules/src/squad/turn/config.ts'));
const rows=[];const seeds=Number(process.env.TURN_SEEDS||12),base=structuredClone(C);
const trials=process.env.TURN_TUNINGS?JSON.parse(process.env.TURN_TUNINGS):[170,190,210,230].flatMap(attack=>[3050,3600,4200].map(hp=>({attack,hp})));
for(const trial of trials){C.stats.yarn.attack=trial.attack;C.stats.yarn.hp=trial.hp;C.boss.enrageRounds=trial.enrage??base.boss.enrageRounds;C.presets.hearthkeepers.attack=trial.hearthAttack??base.presets.hearthkeepers.attack;C.presets.lanternbreakers.attack=trial.lanternAttack??base.presets.lanternbreakers.attack;
 Object.assign(C.policy.active,base.policy.active,trial.active??{});
 for(const preset of ['hearthkeepers','lanternbreakers'])for(const policy of ['auto','active']){
 const result={trial,preset,policy,seeds,wins:0,deaths:{guardian:0,witch:0,alchemist:0},turns:0};
 for(let seed=1;seed<=seeds;seed++){
 const b=E.createTurnBattle({seed,preset,encounter:process.env.TURN_ENCOUNTER||'campaign',gearMode:'starter',interactive:true});E.beginRun(b);
 while(!b.result&&b.turn<C.maxTurns){if(b.run.stage==='loot'){E.chooseLoot(b,choosePolicyLoot(b,policy));continue}if(b.run.stage==='rest'){E.autoEquipGear(b);E.continueRun(b);continue}E.startTurn(b);if(b.phase==='choose'){const choice=E.getAutoAction(b,policy);if(!choice||!E.chooseAction(b,choice))throw Error('Illegal');E.resolveAction(b)}E.endTurn(b)}
 if(!b.result)throw Error('Incomplete');result.wins+=b.result.winner==='party'?1:0;result.turns+=b.turn;if(b.result.firstDeath)result.deaths[b.result.firstDeath]++;
 }
 result.turns=+(result.turns/seeds).toFixed(2);rows.push(result);console.log(JSON.stringify(result));
 }
 fs.writeFileSync(`reports/turn3d-polish/tuning-${process.env.TURN_TRIAL||'boss-grid'}.json`,JSON.stringify({date:new Date().toISOString(),seeds,rows},null,2));
}
await vite.close();
