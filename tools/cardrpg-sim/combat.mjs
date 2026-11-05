import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadRules, root } from './load.mjs';
const {rules:R,vite,load}=await loadRules();
const E=await load('packages/game-rules/src/squad/turn/engine.ts');
const {choosePolicyLoot}=await load('packages/game-rules/src/squad/gear/run.ts');
const seeds=Number(process.env.CARDRPG_SEEDS||30), full=process.env.CARDRPG_FULL==='1';
const {TURN_CONFIG}=await load('packages/game-rules/src/squad/turn/config.ts');
const enemyAttackFactor=Number(process.env.CARDRPG_ENEMY_ATTACK||1);
for(const [role,stats] of Object.entries(TURN_CONFIG.stats))if(!['guardian','witch','alchemist'].includes(role))stats.attack*=enemyAttackFactor;
TURN_CONFIG.boss.standalone.attack*=enemyAttackFactor;
const overrides=JSON.parse(process.env.CARDRPG_STATS||'{}');
for(const c of R.CARDS)Object.assign(c.baseStats,overrides[c.role]||{});
const rows=[],runs=[];
for(const encounter of full?['patrol','boss','campaign']:['campaign'])for(const preset of ['hearthkeepers','lanternbreakers'])for(const policy of ['auto','active'])for(const gear of full?['off','starter','high']:['starter']){
 const group=[];
 for(let seed=1+Number(process.env.CARDRPG_SEED_OFFSET||0);seed<=seeds+Number(process.env.CARDRPG_SEED_OFFSET||0);seed++){
  const s=R.createStarterAccount(seed);
  if(gear==='off'){s.inventory.items=[];s.loadouts={};}
  if(gear==='high')for(const c of s.cards){const set={guardian:'hearthloom',witch:'moonwick',alchemist:'mossbrew'}[R.CARD_BY_ID[c.cardId].role];s.loadouts[c.id]={};for(const slot of R.EQUIPMENT_SLOTS){const i=R.makeItem(s,`${set}-${slot}-legendary`,'forge');i.enhancement=12;s.inventory.items.push(i);s.loadouts[c.id][slot]=i.id;}}
  const options={...R.toBattleOptions(s,seed,preset),encounter,gearMode:gear==='off'?'off':'starter'};
  const b=E.createTurnBattle(options);E.beginRun(b);
  while(!b.result&&b.turn<650){
   if(b.run.stage==='loot'){E.chooseLoot(b,choosePolicyLoot(b,policy));continue;}
   if(b.run.stage==='rest'){E.autoEquipGear(b);E.continueRun(b);continue;}
   E.startTurn(b);if(b.phase==='choose'){const c=E.getAutoAction(b,policy);if(!c||!E.chooseAction(b,c))throw Error('Illegal policy');E.resolveAction(b);}E.endTurn(b);
  }
  if(!b.result)throw Error('unfinished');
  const result={seed,encounter,preset,policy,gear,...b.result,historyHash:createHash('sha256').update(JSON.stringify(b.history)).digest('hex')};group.push(result);runs.push(result);
 }
 const deaths={guardian:0,witch:0,alchemist:0};for(const r of group)if(r.firstDeath)deaths[r.firstDeath]++;
 const row={encounter,preset,policy,gear,seeds,wins:group.filter(r=>r.winner==='party').length,winRate:group.filter(r=>r.winner==='party').length/seeds,meanRounds:group.reduce((n,r)=>n+r.rounds,0)/seeds,firstDeaths:deaths};rows.push(row);console.log(JSON.stringify(row));
}
const dir=resolve(root,'docs/design/cardrpg/evidence');mkdirSync(dir,{recursive:true});
writeFileSync(resolve(dir,`combat-${process.env.CARDRPG_TRIAL||'initial'}.json`),JSON.stringify({version:R.CONTRACT_VERSION,seeds,full,overrides,enemyAttackFactor,rows,runs},null,2)+'\n');await vite.close();
