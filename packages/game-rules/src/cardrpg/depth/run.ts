import { patrolDefaultsA6 } from './onboarding-a6';
import { powerScoreA6 } from './power-a6';
import { startTowerFloorA6, TOWER_FLOORS_A6 } from './tower-a6';
import { combatStarsV4, stopStarsV4 } from './stars-v4';
import { recordNodeStarsV4 } from './journey-v4';
import { Rng, deriveSeed } from '../../rng';
import { clone, integer, requireRule, progress } from '../internal';
import { BOONS, BOON_BY_ID } from './boons';
import { dropGear } from './equipment';
import { createBattle } from './battle';
import { battleCats, defaultSkills, grantDepth, requireHome, transactDepth } from './state';
import type { DepthAccount, NodeKind, RuleResult, Run, RunNode } from './contract';
import type { Row } from './contract';
import { CAT_BY_ID, ENEMY_BY_ID } from './catalog';
import { DEFAULT_PLAN, validPlan, type StandingPlan } from './gameplay-v4';
import { challengeStatsV4 } from './pacing-v4';
export const CHAPTERS = [
  {id:1,name:'Tangled Cafe',boss:'yarn-giant',palette:'#d8a76d',ambience:174,pool:['button-guard','sock-skipper','needle-moth','teacup-healer'],elites:['spool-ram','kettle-knight'],reward:'A Yarnkeeper Seal and 80 mastery materials'},
  {id:2,name:'Rooftop Orchard',boss:'rain-spool',palette:'#83b4a6',ambience:220,pool:['needle-moth','teacup-healer','button-guard','sock-skipper'],elites:['pollen-scout','kettle-knight'],reward:'An Orchard Seal and 100 mastery materials'},
  {id:3,name:'Midnight Pantry',boss:'pantry-crown',palette:'#a292c2',ambience:146,pool:['sock-skipper','teacup-healer','binding-thread','needle-moth'],elites:['crumb-sentinel','pollen-scout'],reward:'A Pantry Seal, 120 mastery materials and Tower access'},
];
export const EVENTS = [
  {id:'chipped-cup',name:'The chipped cup',story:'A little cup on the roof still remembers the cafe. Its handle could mend an apron, or hold one more warm drink.',choices:[{id:'mend',label:'Mend the handle',description:'Spend 25 run points. Gain a Shelter charm.',cost:25,heal:0,points:0,boon:'shelter-3'},{id:'share',label:'Share a warm drink',description:'Heal every cat by 18% HP. Lose 10 run points.',cost:10,heal:18,points:0,boon:''},{id:'recycle',label:'Return it to the kiln',description:'Gain 35 run points. Every cat loses 8% current HP.',cost:0,heal:-8,points:35,boon:''}]},
  {id:'lost-seed',name:'A seed in the gutter',story:'Clover finds a seed caught in a lantern. Keeping it warm will take the last clean cloth.',choices:[{id:'plant',label:'Wrap the seed',description:'Spend 20 run points. Gain a Garden charm.',cost:20,heal:0,points:0,boon:'garden-5'},{id:'brew',label:'Brew its leaves',description:'Heal every cat by 25% HP. Give up the charm.',cost:0,heal:25,points:0,boon:''},{id:'sell',label:'Trade with the baker',description:'Gain 30 run points. Lose 10% current HP climbing down.',cost:0,heal:-10,points:30,boon:''}]},
  {id:'quiet-bell',name:'A quiet bell',story:'A tiny bell rings only when everyone takes a breath together. The pantry door creaks nearby.',choices:[{id:'listen',label:'Listen together',description:'Spend 20 run points. Gain a Night charm.',cost:20,heal:0,points:0,boon:'night-1'},{id:'polish',label:'Polish the bell',description:'Lose 12% current HP to sharp edges. Gain 45 run points.',cost:0,heal:-12,points:45,boon:''},{id:'leave',label:'Leave a cup beside it',description:'Heal every cat by 10% HP.',cost:0,heal:10,points:0,boon:''}]},
];
export const MUTATORS=[{id:'rainy',name:'Rainy evening',description:'Enemies begin with 20 shield.'},{id:'thin-pot',name:'Small teapot',description:'Shared energy per round is 4.'},{id:'warm-floor',name:'Warm floorboards',description:'Every front-row actor begins with one Cozy stack.'},{id:'late-shift',name:'Late shift',description:'Enemies gain 10% attack. Cats gain 15 opening charge.'}];
export function calendarChallenge(date: string) {
  requireRule(/^\d{4}-\d{2}-\d{2}$/.test(date),'INVALID_AMOUNT','Use a calendar date in YYYY-MM-DD form.');
  const ms=Date.parse(date+'T00:00:00Z');
  requireRule(Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===date,'INVALID_AMOUNT','Invalid calendar date.');
  const day=Math.floor(ms/86400000),week=Math.floor((day+3)/7);
  return {seed:deriveSeed(43113,day),week,mutator:MUTATORS[((week%MUTATORS.length)+MUTATORS.length)%MUTATORS.length]!};
}
export function generateMap(seed: number, chapter: number): RunNode[] {
  const spec=CHAPTERS[chapter-1];if(!spec)throw Error('Unknown chapter');
  const rng=new Rng(seed);
  const structure: Array<[number,number,NodeKind]>=[[0,0,'battle'],[1,0,'event'],[1,1,'elite'],[2,0,'treasure'],[3,0,'shop'],[4,0,'campfire'],[5,0,'battle'],[5,1,'elite'],[6,0,'boss']];
  const nodes=structure.map(([depth,lane,kind]):RunNode=>{
    const enemies=kind==='boss'?[spec.boss]:kind==='elite'?[spec.elites[rng.int(0,spec.elites.length-1)]!,spec.pool[rng.int(0,spec.pool.length-1)]!]:kind==='battle'?[spec.pool[rng.int(0,spec.pool.length-1)]!,spec.pool[rng.int(0,spec.pool.length-1)]!]:[];
    return {id:`${depth}-${lane}`,depth,lane,kind,next:[],enemies,...(kind==='event'?{eventId:EVENTS[rng.int(0,EVENTS.length-1)]!.id}:{})};
  });
  for(const node of nodes)node.next=nodes.filter(n=>n.depth===node.depth+1).map(n=>n.id);
  return nodes;
}
export function availableNodes(run: Run) {
  if(run.complete||run.current||run.rewardChoices.length)return [];
  const last=run.nodes.find(n=>n.id===run.visited.at(-1));
  return run.nodes.filter(n=>last?last.next.includes(n.id):n.depth===0);
}
/** Authored campaign pressure. No player stats/equipment or completion count enter this budget.
 * Preserve the existing seven-stop route: early streets, late streets, then the guardian.
 * Map, preparation and replay all consume this same frozen enemy snapshot. */
export function campaignEnemyStatsA6(run: Run, node: RunNode) {
  const stats = challengeStatsV4(run.challengeLevel ?? 1);
  if (!run.gameplayA6 || run.mode !== 'campaign' || !node.enemies.length) return stats;
  // Later guardians spend more of their fixed budget on endurance, avoiding a burst wall.
  if(node.kind==='boss'&&run.chapter>1)for(const id of node.enemies)
    if(ENEMY_BY_ID[id]!.tier==='boss')stats[id]!.hp=Math.round(stats[id]!.hp*1.3);
  const enemies = createBattle({seed: 1, chapter: run.chapter, cats: [], enemies: node.enemies,
    gameplayV4: true, skillsV5: true, gameplayA6: true, enemyStats: stats}).actors;
  const expected = [7500, 7900, 8200][run.chapter - 1]!;
  const ratio = node.kind === 'boss' ? (run.chapter===3?1.2:1.15) : node.kind === 'elite' ? 1.04 : node.depth < 4 ? .72 : .98;
  const target = expected * ratio * (1 + ((run.challengeLevel ?? 1) - 1) * .012);
  const attacks = enemies.reduce((n, actor) => n + actor.attack * 20, 0);
  const other = enemies.reduce((n, actor) => n + powerScoreA6(actor) - actor.attack * 20, 0);
  const multiplier = Math.max(.1, (target - other) / Math.max(1, attacks));
  for (const value of Object.values(stats)) value.attack = Math.max(1, Math.round(value.attack * multiplier));
  // Fallback after the three Q13f passes: shield-wash/Hush bosses need a smaller
  // strike budget than the first guardian. Keep their fixed HP and mechanics;
  // do not manufacture the requested Power ratio with an unfixable damage wall.
  if (node.kind === 'boss' && run.chapter > 1) for (const id of node.enemies) {
    if (ENEMY_BY_ID[id]!.tier === 'boss')
      stats[id]!.attack = Math.max(1, Math.round(stats[id]!.attack * (run.chapter === 2 ? .78 : .9)));
  }
  return stats;
}
export function startRun(state: DepthAccount, chapter: number, seed: number, mode: Run['mode']='campaign', date='2026-11-06', challengeLevel?: number): RuleResult<DepthAccount> {
  if(state.gameplayA6&&mode==='tower')return startTowerFloorA6(state);
  return transactDepth(state,s=>{
    requireHome(s);requireRule(integer(chapter,1,3)&&integer(seed,0,0xffffffff),'INVALID_AMOUNT','Invalid chapter or seed.');
    requireRule(chapter===1||s.cleared.includes(chapter-1),'LOCKED','Clear the preceding chapter first.');
    requireRule(mode!=='tower'||s.cleared.includes(3),'LOCKED','Clear Midnight Pantry to open the Tower.');
    const defaultBand=s.gameplayA6&&mode==='campaign'?patrolDefaultsA6(s).band:undefined;
    const challenge=calendarChallenge(date),actualSeed=mode==='daily'?challenge.seed:seed;
    const cats=battleCats(s);
    s.run={id:s.nextRunId++,seed:actualSeed,chapter,mode,nodes:generateMap(actualSeed,chapter),visited:[],current:null,points:35,boons:{},hp:Object.fromEntries(cats.map(c=>[c.id,c.stats.hp])),upgrades:{},rewardChoices:[],battle:null,complete:false,won:false,floor:1,mutator:mode==='campaign'?'':challenge.mutator.id,supplies:1,earnedItems:[],date};
    if(s.gameplayA6&&mode==='campaign')for(const node of s.run.nodes)
      if(node.kind==='battle'&&node.depth>=4)node.enemies.push('binding-thread');
    if(s.gameplayV4){
      const ceiling=Math.min(...s.team.map(id=>s.account.cards.find(c=>c.cardId===id)!.level));
      const band=challengeLevel??defaultBand??ceiling;
      requireRule(integer(band,1,ceiling),'LOCKED','Choose a challenge band no higher than your lowest-level crew member.');
      s.run.gameplayV4=true;s.run.challengeLevel=band;if(s.skillsV5)s.run.skillsV5=true;if(s.gameplayA6)s.run.gameplayA6=true;
    }
  });
}
export function enterNode(state: DepthAccount, id: string): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    const run=s.run;requireRule(run,'NOT_READY','Start a run first.');
    const node=availableNodes(run).find(n=>n.id===id);requireRule(node,'NOT_READY','Choose a connected node on the map.');
    run.current=id;
    if(node.enemies.length){
      const setup={...(run.gameplayA6?{gameplayA6:true}:{}),...(run.skillsV5?{skillsV5:true}:{}),seed:deriveSeed(run.seed,run.visited.length+run.floor*100),chapter:run.chapter,cats:battleCats(s),enemies:node.enemies,hp:run.hp,boons:run.boons,upgrades:run.upgrades,mutator:run.mutator,...(run.gameplayV4?{gameplayV4:true,...(run.challengeLevel!==undefined?{challengeLevel:run.challengeLevel,enemyStats:clone(run.towerA6?.enemyStats??challengeStatsV4(run.challengeLevel))}:{}),plan:clone(s.v4?.plan??DEFAULT_PLAN),...(run.packedSupply?{packedSupply:clone(run.packedSupply)}:{})}:{})};
      if(run.gameplayA6&&run.mode==='campaign')setup.enemyStats=campaignEnemyStatsA6(run,node);
      run.battle=createBattle(setup);s.lastBattle=clone(run.battle.initial);s.lastChoices=[];
    }
  });
}
/** Only the untouched preparation can be rebuilt; seed and carried HP never reroll. */
export function configurePreparation(state: DepthAccount, team: string[], rows: Record<string,Row>, plan: StandingPlan): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    const run=s.run,battle=run?.battle;
    requireRule(run&&battle?.v4&&!run.complete&&!battle.result&&!battle.v4.committed&&battle.choices.length===0&&battle.actors.every(a=>a.turns===0),'NOT_READY','Preparation is locked after Fight.');
    requireRule(validPlan(plan),'INVALID_AMOUNT','Choose a valid standing plan.');
    requireRule(team.length===3&&new Set(team).size===3&&team.every(id=>s.account.cards.some(c=>c.cardId===id)),'INVALID_TEAM','Choose three collected companions.');
    requireRule(team.every(id=>['front','rear'].includes(rows[id]!))&&team.some(id=>rows[id]==='front'&&(run.hp[id]??1)>0),'INVALID_TEAM','Keep at least one living companion in front.');
    const changed=team.some((id,i)=>id!==s.team[i]);
    requireRule(!changed||run.visited.length===0&&(run.floor===1||!!run.towerA6),'NOT_READY','The roster stays together after the first stop; change rows or plans here.');
    requireRule(!battle.initial.packedSupply||team.includes(battle.initial.packedSupply.catId),'INVALID_TEAM','Keep the companion with the packed supply for this encounter.');
    s.team=[...team]; s.rows={...s.rows,...rows};
    for(const id of team) s.skills[id]??=CAT_BY_ID[id]!.skills.slice(0,3).map(skill=>skill.id);
    s.v4??={version:1,plan:{...DEFAULT_PLAN}};
    s.v4.plan={...plan};
    const cats=battleCats(s);
    for(const cat of cats) run.hp[cat.id]=Math.min(run.hp[cat.id]??cat.stats.hp,cat.stats.hp);
    run.battle=createBattle({...battle.initial,cats,hp:clone(run.hp),plan:{...plan}});
    s.lastBattle=clone(run.battle.initial); s.lastChoices=[];
  });
}
export function commitPreparation(state: DepthAccount): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    const battle=s.run?.battle;
    requireRule(battle?.v4&&!battle.result,'NOT_READY','Open an automatic preparation first.');
    battle.v4.committed=true;
    delete s.run!.packedSupply;
  });
}
function addBoon(run: Run, id: string) {
  const boon=BOON_BY_ID[id];requireRule(boon,'UNKNOWN_ID','Unknown charm.');
  requireRule((run.boons[id]??0)<boon.cap,'MAX_LEVEL','This charm is at its stacking cap.');
  run.boons[id]=(run.boons[id]??0)+1;
}
function finishNode(run: Run) {requireRule(run.current,'NOT_READY','Choose a node.');run.visited.push(run.current);run.current=null;}
export function rewardOptions(run: Run, skillIds: string[]): string[] {
  const rng=new Rng(deriveSeed(run.seed,run.visited.length+run.floor*51));
  const pool=BOONS.filter(b=>(run.boons[b.id]??0)<b.cap).map(b=>b.id),options:string[]=[];
  while(options.length<2&&pool.length)options.push(pool.splice(rng.int(0,pool.length-1),1)[0]!);
  const upgrade=skillIds.filter(id=>(run.upgrades[id]??0)<3);
  if(upgrade.length)options.push('skill:'+upgrade[rng.int(0,upgrade.length-1)]!);
  else if(pool.length)options.push(pool[rng.int(0,pool.length-1)]!);
  return options;
}
function settleRun(s: DepthAccount, won: boolean) {
  const run=s.run!;requireRule(!s.claimedRuns.includes(run.id),'ALREADY_CLAIMED','Run already settled.');
  run.complete=true;run.won=won;s.claimedRuns.push(run.id);
  const challengeId=run.mode==='daily'?`daily-${run.date}`:run.mode==='tower'?(run.towerA6?`a6-tower-floor-${run.floor}`:`tower-${run.date}`):'';
  const rewarded=(!run.towerA6||won)&&s.account.daily.battles<6&&(!challengeId||!s.challengeClaims.includes(challengeId));
  if(rewarded){
    if(run.gameplayV4&&s.v4?.journal)s.v4.journal.rewardedRoutes++;
    s.account.daily.battles++;progress(s.account,'battles');
    grantDepth(s,{fish:won?90:30,threads:won?18:6,stamps:won?40:10,essence:won?2:0},won?60:20);
    const key=`depth-material-${s.account.day}`,earned=s.account.inventory.stacks[key]??0,amount=Math.min(30-earned,run.visited.length*2+(won?5:0));
    s.materials+=Math.max(0,amount);s.account.inventory.stacks[key]=earned+Math.max(0,amount);
    if(challengeId)s.challengeClaims.push(challengeId);
  }
  if(won){
    if(rewarded){progress(s.account,'wins');if(!run.towerA6||run.floor%5===0)progress(s.account,'bossWins');}
    const sealKey=`depth-seal-${s.account.day}`;
    if(rewarded&&!s.account.inventory.stacks[sealKey]){s.seals++;s.account.inventory.stacks[sealKey]=1;}
    if(run.mode==='campaign'&&!s.cleared.includes(run.chapter)){
      s.cleared.push(run.chapter);s.materials+=60+run.chapter*20;s.account.chapter=Math.max(s.account.chapter,run.chapter+1);
      grantDepth(s,{fish:120,stamps:80,essence:4});
    }
    if(!run.towerA6&&run.visited.filter(id=>run.nodes.find(n=>n.id===id)?.kind==='elite').length>=2&&!s.masteries.includes(run.chapter))s.masteries.push(run.chapter);
    if(run.mode==='tower')s.towerBest=Math.max(s.towerBest,run.floor);
  }
}
export function finishEncounter(state: DepthAccount): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    const run=s.run,b=run?.battle;requireRule(run&&b?.result,'NOT_READY','Finish the encounter.');
    const node=run.nodes.find(n=>n.id===run.current);requireRule(node,'NOT_READY','Encounter node missing.');
    if(!run.towerA6)recordNodeStarsV4(s, combatStarsV4(run, node, b));
    if(run.gameplayV4)delete run.packedSupply;
    run.hp=Object.fromEntries(b.actors.filter(a=>a.side==='party').map(a=>[a.catalogId,a.hp]));s.lastChoices=clone(b.choices);run.battle=null;
    if(b.result==='enemy'){settleRun(s,false);return;}
    if(!run.towerA6)run.points+=node.kind==='elite'?65:node.kind==='boss'?100:35;
    const drop=dropGear(s,node.kind as 'battle'|'elite'|'boss',deriveSeed(run.seed,run.visited.length+999),run.chapter);
    if(drop)run.earnedItems.push(drop);
    if(node.kind==='boss'||run.towerA6){finishNode(run);settleRun(s,true);return;}
    run.rewardChoices=rewardOptions(run,s.team.flatMap(id=>defaultSkills(s,id)));
  });
}
export function chooseReward(state: DepthAccount,id: string): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    const run=s.run;requireRule(run&&run.rewardChoices.includes(id),'NOT_READY','Choose an offered reward.');
    if(id.startsWith('skill:')){const skill=id.slice(6);requireRule((run.upgrades[skill]??0)<3,'MAX_LEVEL','Skill upgrade capped.');run.upgrades[skill]=(run.upgrades[skill]??0)+1;}
    else addBoon(run,id);
    run.rewardChoices=[];finishNode(run);
  });
}
export function resolveNode(state: DepthAccount,choice: string,targetId?: string): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    const run=s.run;requireRule(run&&!run.battle&&!run.rewardChoices.length&&!run.complete,'NOT_READY','Resolve the current encounter first.');
    const node=run.nodes.find(n=>n.id===run.current);requireRule(node,'NOT_READY','Enter a map node.');
    const cats=battleCats(s);
    const healTeam=(percent:number)=>{for(const cat of cats){const old=run.hp[cat.id]??cat.stats.hp;run.hp[cat.id]=percent>=0?Math.min(cat.stats.hp,old+Math.round(cat.stats.hp*percent/100)):Math.max(1,Math.round(old*(1+percent/100)));}};
    if(node.kind==='campfire') {
      if(choice==='heal')healTeam(35);
      else {requireRule(choice==='upgrade'&&targetId&&s.team.some(id=>defaultSkills(s,id).includes(targetId))&&(run.upgrades[targetId]??0)<3,'INVALID_AMOUNT','Choose an unlocked skill below rank three.');run.upgrades[targetId]=(run.upgrades[targetId]??0)+1;}
    } else if(node.kind==='event') {
      const event=EVENTS.find(e=>e.id===node.eventId)!,option=event.choices.find(c=>c.id===choice);requireRule(option,'UNKNOWN_ID','Choose a story option.');
      requireRule(run.points>=option.cost,'INSUFFICIENT_FUNDS','Insufficient earned run points.');run.points+=option.points-option.cost;
      healTeam(option.heal);if(option.boon)addBoon(run,option.boon);
    } else if(node.kind==='shop') {
      if(choice!=='leave'){
        requireRule(run.points>=45,'INSUFFICIENT_FUNDS','Need 45 earned run points.');
        if(choice==='tonic'){requireRule(!run.gameplayV4||run.supplies<5,'MAX_LEVEL','Carry at most five packed tonics.');run.supplies++;}else{requireRule(shopStock(run).includes(choice),'UNKNOWN_ID','Choose a charm from this shop.');addBoon(run,choice);}
        run.points-=45;
      }
    } else if(node.kind==='treasure') {
      requireRule(['points','charm'].includes(choice),'INVALID_AMOUNT','Choose points or the offered charm.');
      if(choice==='points')run.points+=70;else addBoon(run,shopStock(run)[0]!);
    } else requireRule(false,'NOT_READY','This node requires a battle.');
    finishNode(run);
    recordNodeStarsV4(s, stopStarsV4(s, run, node, Object.fromEntries(cats.map(c => [c.id,c.stats.hp]))));
  });
}
export function shopStock(run: Run): string[] {
  const rng=new Rng(deriveSeed(run.seed,500+run.floor));
  const pool=BOONS.filter(b=>(run.boons[b.id]??0)<b.cap).map(b=>b.id),stock:string[]=[];
  while(stock.length<3&&pool.length)stock.push(pool.splice(rng.int(0,pool.length-1),1)[0]!);
  return stock;
}
export function useTonic(state: DepthAccount): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{const r=s.run;requireRule(r&&!r.battle&&!r.complete&&r.supplies>0,'NOT_READY','Use a packed tonic between encounters.');for(const cat of battleCats(s))r.hp[cat.id]=Math.min(cat.stats.hp,(r.hp[cat.id]??0)+100);r.supplies--;});
}
export function abandonRun(state: DepthAccount): RuleResult<DepthAccount> {
  return transactDepth(state, s => {
    requireRule(s.run && !s.run.complete, 'NOT_READY', 'No active run.');
    if(s.run.packedSupply&&!s.run.battle?.v4?.committed){const old=s.run.packedSupply;s.account.inventory.stacks[old.id]=(s.account.inventory.stacks[old.id]??0)+1;}
    delete s.run.packedSupply;
    if (s.run.battle) s.lastChoices = clone(s.run.battle.choices);
    s.run.battle = null;
    s.run.rewardChoices = [];
    settleRun(s, false);
  });
}
export function nextTowerFloor(state: DepthAccount): RuleResult<DepthAccount> {
  if(state.run?.towerA6){
    const old=state.run;
    if(!old.complete||!old.won||old.floor>=TOWER_FLOORS_A6)return {ok:false,state,error:old.floor>=TOWER_FLOORS_A6?'All thirty floors are complete.':'Clear this floor first.'};
    return startTowerFloorA6(state,old.floor+1);
  }
  return transactDepth(state,s=>{
    const old=s.run;requireRule(old?.mode==='tower'&&old.complete&&old.won,'NOT_READY','Clear a Tower floor first.');
    const floor=old.floor+1,seed=deriveSeed(old.seed,floor),chapter=(floor-1)%3+1;
    s.run={...old,id:s.nextRunId++,seed,floor,chapter,nodes:generateMap(seed,chapter),visited:[],current:null,complete:false,won:false,battle:null,rewardChoices:[],mutator:MUTATORS[(floor-1)%4]!.id};
  });
}
